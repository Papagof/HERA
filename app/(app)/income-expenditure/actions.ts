"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function str(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

export async function createEntry(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("income_expenditure_entries").insert({
    entry_type: str(formData, "entry_type") ?? "expenditure",
    category: str(formData, "category")!,
    description: str(formData, "description"),
    amount: Number(str(formData, "amount")),
    receipt_url: str(formData, "receipt_url"),
    entry_date: str(formData, "entry_date") ?? new Date().toISOString().slice(0, 10),
    recorded_by: user?.id ?? null,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/income-expenditure");
}

export async function deleteEntry(entryId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("income_expenditure_entries").delete().eq("id", entryId);
  if (error) throw new Error(error.message);
  revalidatePath("/income-expenditure");
}
