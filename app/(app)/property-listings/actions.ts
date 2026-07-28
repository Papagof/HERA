"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function str(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

function urls(formData: FormData, key: string): string[] {
  const raw = str(formData, key);
  if (!raw) return [];
  return raw
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean);
}

export async function createListing(formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase.from("property_listings").insert({
    property_id: str(formData, "property_id")!,
    listing_type: str(formData, "listing_type") ?? "rent",
    price: str(formData, "price") ? Number(str(formData, "price")) : null,
    size: str(formData, "size"),
    description: str(formData, "description"),
    image_urls: urls(formData, "image_urls"),
    contact_name: str(formData, "contact_name"),
    contact_phone: str(formData, "contact_phone"),
    is_published: formData.get("is_published") === "on",
  });

  if (error) throw new Error(error.message);
  revalidatePath("/property-listings");
  revalidatePath("/listings");
}

export async function updateListing(listingId: string, formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("property_listings")
    .update({
      listing_type: str(formData, "listing_type") ?? "rent",
      price: str(formData, "price") ? Number(str(formData, "price")) : null,
      size: str(formData, "size"),
      description: str(formData, "description"),
      image_urls: urls(formData, "image_urls"),
      contact_name: str(formData, "contact_name"),
      contact_phone: str(formData, "contact_phone"),
      is_published: formData.get("is_published") === "on",
    })
    .eq("id", listingId);

  if (error) throw new Error(error.message);
  revalidatePath("/property-listings");
  revalidatePath("/listings");
}

export async function deleteListing(listingId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("property_listings").delete().eq("id", listingId);
  if (error) throw new Error(error.message);
  revalidatePath("/property-listings");
  revalidatePath("/listings");
}
