"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { CATEGORY_FREQUENCY, MONTHS_COVERED } from "@/lib/billing-periods";
import { addMonths, monthToDate } from "@/lib/month";

const SERVICE_CHARGE = "Service Charge";
const DEVELOPMENT_LEVY = "Development Levy";

function str(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

export async function createStructure(formData: FormData) {
  const supabase = await createClient();

  const category = str(formData, "charge_category") ?? SERVICE_CHARGE;

  const { error } = await supabase.from("service_charge_structures").insert({
    name: str(formData, "name")!,
    amount: Number(str(formData, "amount")),
    // Frequency is fixed per category, not a staff choice - see CATEGORY_FREQUENCY.
    frequency: CATEGORY_FREQUENCY[category] ?? "monthly",
    // Apartment type only makes sense for Service Charge (tied to the unit
    // the resident occupies); other categories don't use it.
    applies_to_apartment_type: category === SERVICE_CHARGE ? str(formData, "applies_to_apartment_type") : null,
    charge_category: category,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/service-charges");
}

export async function deleteStructure(structureId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("service_charge_structures")
    .delete()
    .eq("id", structureId);
  if (error) throw new Error(error.message);
  revalidatePath("/service-charges");
}

// Payment is recorded directly for a payer (a resident or a landlord,
// depending on the structure's charge_category - Service Charge is
// resident-only, Development Levy is landlord-only, everything else can be
// either) - no separate "generate invoice" step first. Creates the invoice
// (already status='paid') and the payment together, both snapshotting the
// payer's name/property so history reads correctly even after they leave.
// Also logs the payment as income under the structure's own category.
//
// Each category has different fields because they're structurally different:
// - Service Charge: month coverage (period + starting month), amount as typed.
// - Development Levy: one-off, sized by plot_count at the structure's
//   per-plot rate (amount = rate * plots), no month coverage.
// - Toll/Donation/Others/5% on Rented Property: one-off, just an amount and
//   the date paid, no month coverage.
export async function recordDirectPayment(structureId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const payerType = str(formData, "payer_type") === "landlord" ? "landlord" : "resident";
  const paidAt = str(formData, "paid_at") ?? new Date().toISOString().slice(0, 10);

  const { data: structure, error: structureError } = await supabase
    .from("service_charge_structures")
    .select("name, charge_category, amount")
    .eq("id", structureId)
    .single();
  if (structureError) throw new Error(structureError.message);

  let amount: number;
  let plotCount: number | null = null;
  let period: string | null = null;
  let coversStart: string | null = null;
  let coversEnd: string | null = null;

  if (structure.charge_category === DEVELOPMENT_LEVY) {
    plotCount = Number(str(formData, "plot_count"));
    amount = structure.amount * plotCount;
  } else if (structure.charge_category === SERVICE_CHARGE) {
    amount = Number(str(formData, "amount"));
    period = str(formData, "period") ?? "monthly";
    const coversStartMonth = str(formData, "covers_start_month")!;
    const coversEndMonth = addMonths(coversStartMonth, (MONTHS_COVERED[period] ?? 1) - 1);
    coversStart = monthToDate(coversStartMonth);
    coversEnd = monthToDate(coversEndMonth);
  } else {
    amount = Number(str(formData, "amount"));
  }

  let propertyId: string;
  let payerName: string;
  let residentId: string | null = null;
  let residentName: string | null = null;
  let landlordId: string | null = null;
  let landlordName: string | null = null;

  if (payerType === "resident") {
    const id = str(formData, "resident_id")!;
    const { data: resident, error: residentError } = await supabase
      .from("residents")
      .select("id, full_name, property_id")
      .eq("id", id)
      .single();
    if (residentError) throw new Error(residentError.message);
    propertyId = resident.property_id;
    payerName = resident.full_name;
    residentId = resident.id;
    residentName = resident.full_name;
  } else {
    const id = str(formData, "landlord_id")!;
    const { data: landlord, error: landlordError } = await supabase
      .from("landlords")
      .select("id, full_name, property_id")
      .eq("id", id)
      .single();
    if (landlordError) throw new Error(landlordError.message);
    propertyId = landlord.property_id;
    payerName = landlord.full_name;
    landlordId = landlord.id;
    landlordName = landlord.full_name;
  }

  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .insert({
      property_id: propertyId,
      payer_type: payerType,
      resident_id: residentId,
      resident_name: residentName,
      landlord_id: landlordId,
      landlord_name: landlordName,
      structure_id: structureId,
      amount,
      due_date: paidAt,
      period,
      covers_start: coversStart,
      covers_end: coversEnd,
      plot_count: plotCount,
      status: "paid",
    })
    .select("id")
    .single();
  if (invoiceError) throw new Error(invoiceError.message);

  const { error: paymentError } = await supabase.from("payments").insert({
    invoice_id: invoice.id,
    property_id: propertyId,
    payer_type: payerType,
    resident_id: residentId,
    resident_name: residentName,
    landlord_id: landlordId,
    landlord_name: landlordName,
    amount,
    period,
    covers_start: coversStart,
    covers_end: coversEnd,
    plot_count: plotCount,
    paid_at: paidAt,
    method: str(formData, "method") ?? "bank_transfer",
    reference: str(formData, "reference"),
  });
  if (paymentError) throw new Error(paymentError.message);

  const { error: incomeError } = await supabase.from("income_expenditure_entries").insert({
    entry_type: "income",
    category: structure.charge_category,
    description: `${structure.name} — ${payerName}${plotCount ? ` (${plotCount} plot${plotCount === 1 ? "" : "s"})` : ""}`,
    amount,
    entry_date: paidAt,
    recorded_by: user?.id ?? null,
  });
  if (incomeError) throw new Error(incomeError.message);

  revalidatePath("/service-charges");
  revalidatePath("/income-expenditure");
}

// Legacy path for invoices generated before payments went direct - still
// needed so any invoice left unpaid/partial under the old workflow can be
// settled. Each payment increment is logged as income too, same as
// recordDirectPayment, so partial payments over time each show up when made
// rather than all at once when the invoice finally reaches "paid".
export async function recordPayment(invoiceId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .select("*, service_charge_structures(name, charge_category)")
    .eq("id", invoiceId)
    .single();
  if (invoiceError) throw new Error(invoiceError.message);

  // Guards against double-submission (e.g. a double-click before the UI
  // re-renders and hides this form) recording the same payment twice.
  if (invoice.status === "paid") {
    throw new Error("This invoice is already fully paid.");
  }

  const amount = Number(str(formData, "amount"));
  const paidAt = new Date().toISOString().slice(0, 10);

  const { error: paymentError } = await supabase.from("payments").insert({
    invoice_id: invoiceId,
    property_id: invoice.property_id,
    payer_type: invoice.payer_type,
    resident_id: invoice.resident_id,
    resident_name: invoice.resident_name,
    landlord_id: invoice.landlord_id,
    landlord_name: invoice.landlord_name,
    amount,
    period: invoice.period,
    paid_at: paidAt,
    method: str(formData, "method") ?? "bank_transfer",
    reference: str(formData, "reference"),
  });
  if (paymentError) throw new Error(paymentError.message);

  const { data: payments, error: paymentsError } = await supabase
    .from("payments")
    .select("amount")
    .eq("invoice_id", invoiceId);
  if (paymentsError) throw new Error(paymentsError.message);

  const totalPaid = (payments ?? []).reduce((sum, p) => sum + Number(p.amount), 0);
  const status = totalPaid >= Number(invoice.amount) ? "paid" : totalPaid > 0 ? "partial" : "unpaid";

  const { error: updateError } = await supabase
    .from("invoices")
    .update({ status })
    .eq("id", invoiceId);
  if (updateError) throw new Error(updateError.message);

  const structureInfo = (
    invoice as { service_charge_structures: { name: string; charge_category: string } | null }
  ).service_charge_structures;
  const payerName = invoice.resident_name ?? invoice.landlord_name ?? "Unknown payer";
  const { error: incomeError } = await supabase.from("income_expenditure_entries").insert({
    entry_type: "income",
    category: structureInfo?.charge_category ?? "Service Charge",
    description: `${structureInfo?.name ?? "Service charge"} — ${payerName}`,
    amount,
    entry_date: paidAt,
    recorded_by: user?.id ?? null,
  });
  if (incomeError) throw new Error(incomeError.message);

  revalidatePath("/service-charges");
  revalidatePath("/income-expenditure");
}
