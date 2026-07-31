"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function str(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

export async function updateGroupInviteUrl(groupId: string, formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("community_groups")
    .update({ invite_url: str(formData, "invite_url") })
    .eq("id", groupId);

  if (error) throw new Error(error.message);
  revalidatePath("/community");
}
