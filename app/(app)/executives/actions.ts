"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function str(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

export async function createExecutive(formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase.from("executives").insert({
    full_name: str(formData, "full_name")!,
    position: str(formData, "position")!,
    phone: str(formData, "phone"),
    photo_url: str(formData, "photo_url"),
    tenure_start: str(formData, "tenure_start")!,
    tenure_end: str(formData, "tenure_end"),
    handover_document_url: str(formData, "handover_document_url"),
    is_active: formData.get("is_active") === "on",
    display_order: str(formData, "display_order") ? Number(str(formData, "display_order")) : 0,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/executives");
}

export async function updateExecutive(executiveId: string, formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("executives")
    .update({
      full_name: str(formData, "full_name")!,
      position: str(formData, "position")!,
      phone: str(formData, "phone"),
      photo_url: str(formData, "photo_url"),
      tenure_start: str(formData, "tenure_start")!,
      tenure_end: str(formData, "tenure_end"),
      handover_document_url: str(formData, "handover_document_url"),
      is_active: formData.get("is_active") === "on",
      display_order: str(formData, "display_order") ? Number(str(formData, "display_order")) : 0,
    })
    .eq("id", executiveId);

  if (error) throw new Error(error.message);
  revalidatePath("/executives");
}

export async function deleteExecutive(executiveId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("executives").delete().eq("id", executiveId);
  if (error) throw new Error(error.message);
  revalidatePath("/executives");
}
