"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { CATEGORY_FREQUENCY, MONTHS_COVERED } from "@/lib/billing-periods";
import { addMonths, monthToDate } from "@/lib/month";
import { ALL_PAYMENT_PATHS } from "@/lib/payment-pages";

function revalidateAllPaymentPages() {
  for (const path of ALL_PAYMENT_PATHS) revalidatePath(path);
}

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
  revalidateAllPaymentPages();
}

export async function deleteStructure(structureId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("service_charge_structures")
    .delete()
    .eq("id", structureId);
  if (error) throw new Error(error.message);
  revalidateAllPaymentPages();
}

// A payment is the only record - there is no separate invoice. Each category
// has different fields because they're structurally different:
// - Service Charge: month coverage (period + starting month), amount as typed.
// - Development Levy: one-off, sized by plot_count at the structure's
//   per-plot rate (amount = rate * plots), no month coverage.
// - Toll/Donation/Others/5% on Rented Property: one-off, just an amount and
//   the date paid, no month coverage.
// Also logs the payment as income under the structure's own category, linked
// back via payment_id so a later correction can update both together.
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

  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .insert({
      property_id: propertyId,
      structure_id: structureId,
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
    })
    .select("id")
    .single();
  if (paymentError) throw new Error(paymentError.message);

  const { error: incomeError } = await supabase.from("income_expenditure_entries").insert({
    entry_type: "income",
    category: structure.charge_category,
    description: `${structure.name} — ${payerName}${plotCount ? ` (${plotCount} plot${plotCount === 1 ? "" : "s"})` : ""}`,
    amount,
    entry_date: paidAt,
    recorded_by: user?.id ?? null,
    payment_id: payment.id,
  });
  if (incomeError) throw new Error(incomeError.message);

  revalidateAllPaymentPages();
  revalidatePath("/income-expenditure");
}

// Corrections are super_admin only - re-checked here in addition to the RLS
// policy (payments_update_super_admin), since a mistaken amount/date on a
// payment that's already "paid" would otherwise need a raw SQL fix.
export async function updatePayment(paymentId: string, formData: FormData) {
  const profile = await requireProfile();
  if (profile.role !== "super_admin") {
    throw new Error("Only super_admin can correct a payment.");
  }

  const supabase = await createClient();

  const { data: payment, error: paymentFetchError } = await supabase
    .from("payments")
    .select("*, service_charge_structures(name, charge_category, amount)")
    .eq("id", paymentId)
    .single();
  if (paymentFetchError) throw new Error(paymentFetchError.message);

  const structure = (
    payment as unknown as {
      service_charge_structures: { name: string; charge_category: string; amount: number } | null;
    }
  ).service_charge_structures;
  const category = structure?.charge_category ?? SERVICE_CHARGE;

  const paidAt = str(formData, "paid_at") ?? payment.paid_at.slice(0, 10);

  let amount: number;
  let plotCount: number | null = payment.plot_count;
  let period: string | null = payment.period;
  let coversStart: string | null = payment.covers_start;
  let coversEnd: string | null = payment.covers_end;

  if (category === DEVELOPMENT_LEVY) {
    plotCount = Number(str(formData, "plot_count"));
    amount = (structure?.amount ?? 0) * plotCount;
  } else if (category === SERVICE_CHARGE) {
    amount = Number(str(formData, "amount"));
    period = str(formData, "period") ?? payment.period;
    const coversStartMonth = str(formData, "covers_start_month");
    if (coversStartMonth) {
      const coversEndMonth = addMonths(coversStartMonth, (MONTHS_COVERED[period ?? "monthly"] ?? 1) - 1);
      coversStart = monthToDate(coversStartMonth);
      coversEnd = monthToDate(coversEndMonth);
    }
  } else {
    amount = Number(str(formData, "amount"));
  }

  const { error: updateError } = await supabase
    .from("payments")
    .update({
      amount,
      plot_count: plotCount,
      period,
      covers_start: coversStart,
      covers_end: coversEnd,
      paid_at: paidAt,
      method: str(formData, "method") ?? payment.method,
      reference: str(formData, "reference"),
    })
    .eq("id", paymentId);
  if (updateError) throw new Error(updateError.message);

  const payerName = payment.resident_name ?? payment.landlord_name ?? "Unknown payer";
  const { error: incomeUpdateError } = await supabase
    .from("income_expenditure_entries")
    .update({
      amount,
      entry_date: paidAt,
      description: `${structure?.name ?? "Payment"} — ${payerName}${plotCount ? ` (${plotCount} plot${plotCount === 1 ? "" : "s"})` : ""}`,
    })
    .eq("payment_id", paymentId);
  if (incomeUpdateError) throw new Error(incomeUpdateError.message);

  revalidateAllPaymentPages();
  revalidatePath("/income-expenditure");
}
