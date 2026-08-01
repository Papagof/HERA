"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function str(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

export async function createStructure(formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase.from("service_charge_structures").insert({
    name: str(formData, "name")!,
    amount: Number(str(formData, "amount")),
    frequency: str(formData, "frequency") ?? "monthly",
    applies_to_apartment_type: str(formData, "applies_to_apartment_type"),
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

// Payment is recorded directly for a resident - no separate "generate
// invoice" step first. Creates the invoice (already status='paid') and the
// payment together in one transaction-like sequence, both snapshotting the
// resident's name/property so history reads correctly even if that resident
// later moves out.
export async function recordDirectPayment(structureId: string, formData: FormData) {
  const supabase = await createClient();

  const residentId = str(formData, "resident_id")!;
  const period = str(formData, "period") ?? "monthly";
  const amount = Number(str(formData, "amount"));
  const paidAt = str(formData, "paid_at") ?? new Date().toISOString().slice(0, 10);

  const { data: resident, error: residentError } = await supabase
    .from("residents")
    .select("id, full_name, property_id")
    .eq("id", residentId)
    .single();
  if (residentError) throw new Error(residentError.message);

  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .insert({
      property_id: resident.property_id,
      resident_id: resident.id,
      resident_name: resident.full_name,
      structure_id: structureId,
      amount,
      due_date: paidAt,
      period,
      status: "paid",
    })
    .select("id")
    .single();
  if (invoiceError) throw new Error(invoiceError.message);

  const { error: paymentError } = await supabase.from("payments").insert({
    invoice_id: invoice.id,
    property_id: resident.property_id,
    resident_id: resident.id,
    resident_name: resident.full_name,
    amount,
    period,
    paid_at: paidAt,
    method: str(formData, "method") ?? "bank_transfer",
    reference: str(formData, "reference"),
  });
  if (paymentError) throw new Error(paymentError.message);

  revalidatePath("/service-charges");
}

export async function recordPayment(invoiceId: string, formData: FormData) {
  const supabase = await createClient();

  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", invoiceId)
    .single();
  if (invoiceError) throw new Error(invoiceError.message);

  const amount = Number(str(formData, "amount"));

  const { error: paymentError } = await supabase.from("payments").insert({
    invoice_id: invoiceId,
    property_id: invoice.property_id,
    resident_id: invoice.resident_id,
    resident_name: invoice.resident_name,
    amount,
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

  revalidatePath("/service-charges");
}
