"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/types/database";

type PropertyType = Database["public"]["Enums"]["property_type"];
type Relationship = Database["public"]["Enums"]["resident_relationship"];

function str(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

export async function createProperty(formData: FormData) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("properties")
    .insert({
      street_name: str(formData, "street_name")!,
      house_number: str(formData, "house_number")!,
      block: str(formData, "block"),
      type: (str(formData, "type") as PropertyType) ?? "occupied",
      status: str(formData, "status") ?? "available",
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/directory");
  redirect(`/directory/${data.id}`);
}

export async function updateProperty(propertyId: string, formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("properties")
    .update({
      street_name: str(formData, "street_name")!,
      house_number: str(formData, "house_number")!,
      block: str(formData, "block"),
      type: (str(formData, "type") as PropertyType) ?? "occupied",
      status: str(formData, "status") ?? "available",
    })
    .eq("id", propertyId);

  if (error) throw new Error(error.message);

  revalidatePath("/directory");
  revalidatePath(`/directory/${propertyId}`);
}

export async function deleteProperty(propertyId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("properties").delete().eq("id", propertyId);
  if (error) throw new Error(error.message);

  revalidatePath("/directory");
  redirect("/directory");
}

export async function upsertLandlord(
  propertyId: string,
  landlordId: string | null,
  formData: FormData
) {
  const supabase = await createClient();

  const payload = {
    property_id: propertyId,
    full_name: str(formData, "full_name")!,
    phone: str(formData, "phone"),
    email: str(formData, "email"),
    id_document_url: str(formData, "id_document_url"),
    ownership_proof_url: str(formData, "ownership_proof_url"),
  };

  const { error } = landlordId
    ? await supabase.from("landlords").update(payload).eq("id", landlordId)
    : await supabase.from("landlords").insert(payload);

  if (error) throw new Error(error.message);

  revalidatePath(`/directory/${propertyId}`);
}

export async function deleteLandlord(propertyId: string, landlordId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("landlords").delete().eq("id", landlordId);
  if (error) throw new Error(error.message);

  revalidatePath(`/directory/${propertyId}`);
}

export async function createResident(propertyId: string, formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase.from("residents").insert({
    property_id: propertyId,
    full_name: str(formData, "full_name")!,
    phone: str(formData, "phone"),
    email: str(formData, "email"),
    whatsapp_number: str(formData, "whatsapp_number"),
    relationship: (str(formData, "relationship") as Relationship) ?? "tenant",
    move_in_date: str(formData, "move_in_date"),
  });

  if (error) throw new Error(error.message);

  revalidatePath(`/directory/${propertyId}`);
}

export async function updateResident(
  propertyId: string,
  residentId: string,
  formData: FormData
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("residents")
    .update({
      full_name: str(formData, "full_name")!,
      phone: str(formData, "phone"),
      email: str(formData, "email"),
      whatsapp_number: str(formData, "whatsapp_number"),
      relationship: (str(formData, "relationship") as Relationship) ?? "tenant",
      move_in_date: str(formData, "move_in_date"),
    })
    .eq("id", residentId);

  if (error) throw new Error(error.message);

  revalidatePath(`/directory/${propertyId}`);
}

// Moves a resident out: logs them to occupancy_history, then removes the
// active residents row - keeps the "current occupants" query a plain select.
export async function moveOutResident(propertyId: string, residentId: string) {
  const supabase = await createClient();

  const { data: resident, error: fetchError } = await supabase
    .from("residents")
    .select("*")
    .eq("id", residentId)
    .single();

  if (fetchError) throw new Error(fetchError.message);

  const { error: historyError } = await supabase.from("occupancy_history").insert({
    resident_id: resident.id,
    property_id: resident.property_id,
    full_name: resident.full_name,
    relationship: resident.relationship,
    start_date: resident.move_in_date,
  });

  if (historyError) throw new Error(historyError.message);

  const { error: deleteError } = await supabase.from("residents").delete().eq("id", residentId);
  if (deleteError) throw new Error(deleteError.message);

  revalidatePath(`/directory/${propertyId}`);
}
