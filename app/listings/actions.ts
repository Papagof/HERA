"use server";

import { createClient } from "@/lib/supabase/server";

function str(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

export async function submitInquiry(listingId: string, formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase.from("listing_inquiries").insert({
    listing_id: listingId,
    name: str(formData, "name")!,
    email: str(formData, "email")!,
    phone: str(formData, "phone"),
    message: str(formData, "message"),
  });

  if (error) throw new Error(error.message);
}
