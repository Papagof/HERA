"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireProfile } from "@/lib/auth";
import type { Database } from "@/lib/types/database";

type Role = Database["public"]["Enums"]["app_role"];

function str(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

// Every action re-checks the caller is super_admin, in addition to the RLS
// policy and the page-level redirect - defense in depth, since these all
// call the service-role admin client, which bypasses RLS entirely.
async function requireSuperAdmin() {
  const profile = await requireProfile();
  if (profile.role !== "super_admin") {
    throw new Error("Only super_admin can manage users.");
  }
  return profile;
}

export async function inviteUser(formData: FormData) {
  await requireSuperAdmin();

  const email = str(formData, "email")!;
  const fullName = str(formData, "full_name");
  const role = (str(formData, "role") as Role) ?? "resident";

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { full_name: fullName },
  });
  if (error) throw new Error(error.message);

  // handle_new_user's trigger already created a `resident`-default profile
  // row for this new auth user - update it to the role picked in this form.
  if (role !== "resident") {
    const supabase = await createClient();
    const { error: roleError } = await supabase
      .from("profiles")
      .update({ role })
      .eq("id", data.user.id);
    if (roleError) throw new Error(roleError.message);
  }

  revalidatePath("/users");
}

export async function updateUserRole(userId: string, formData: FormData) {
  await requireSuperAdmin();
  const role = str(formData, "role") as Role;

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ role }).eq("id", userId);
  if (error) throw new Error(error.message);

  revalidatePath("/users");
}

export async function removeUser(userId: string) {
  const profile = await requireSuperAdmin();
  if (userId === profile.id) {
    throw new Error("You cannot remove your own account.");
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) throw new Error(error.message);

  revalidatePath("/users");
}
