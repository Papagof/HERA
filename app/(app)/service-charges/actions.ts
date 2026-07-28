"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/types/database";

type PropertyType = Database["public"]["Enums"]["property_type"];

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
    applies_to_property_type: (str(formData, "applies_to_property_type") as PropertyType) ?? null,
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

// Creates one unpaid invoice per property for this structure/due date,
// skipping properties that already have an invoice for that pair.
export async function generateInvoices(structureId: string, formData: FormData) {
  const supabase = await createClient();
  const dueDate = str(formData, "due_date")!;

  const { data: structure, error: structureError } = await supabase
    .from("service_charge_structures")
    .select("*")
    .eq("id", structureId)
    .single();
  if (structureError) throw new Error(structureError.message);

  let propertyQuery = supabase.from("properties").select("id");
  if (structure.applies_to_property_type) {
    propertyQuery = propertyQuery.eq("type", structure.applies_to_property_type);
  }
  const { data: properties, error: propertiesError } = await propertyQuery;
  if (propertiesError) throw new Error(propertiesError.message);

  const { data: existing, error: existingError } = await supabase
    .from("invoices")
    .select("property_id")
    .eq("structure_id", structureId)
    .eq("due_date", dueDate);
  if (existingError) throw new Error(existingError.message);

  const alreadyInvoiced = new Set((existing ?? []).map((row) => row.property_id));
  const toInsert = (properties ?? [])
    .filter((property) => !alreadyInvoiced.has(property.id))
    .map((property) => ({
      property_id: property.id,
      structure_id: structureId,
      amount: structure.amount,
      due_date: dueDate,
      status: "unpaid" as const,
    }));

  if (toInsert.length > 0) {
    const { error: insertError } = await supabase.from("invoices").insert(toInsert);
    if (insertError) throw new Error(insertError.message);
  }

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
