import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireProfile } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { labelClass } from "@/components/ui/fieldStyles";
import { inviteUser, updateUserRole, removeUser } from "./actions";

const ROLES = ["super_admin", "executive_current", "executive_past", "landlord", "resident", "accountant"] as const;

export default async function UsersPage() {
  const profile = await requireProfile();
  if (profile.role !== "super_admin") redirect("/dashboard");

  const supabase = await createClient();
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at");
  if (error) throw new Error(error.message);

  let emailById = new Map<string, string>();
  let adminError: string | null = null;
  try {
    const admin = createAdminClient();
    const { data: authUsers, error: listError } = await admin.auth.admin.listUsers({ perPage: 1000 });
    if (listError) throw new Error(listError.message);
    emailById = new Map(authUsers.users.map((u) => [u.id, u.email ?? ""]));
  } catch (err) {
    adminError = err instanceof Error ? err.message : "Failed to load user emails.";
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">User Accounts</h1>

      {adminError && (
        <Card className="border-red-300 bg-red-50 dark:border-red-900 dark:bg-red-950">
          <p className="text-sm text-red-700 dark:text-red-300">
            Couldn&rsquo;t load emails or manage accounts: {adminError}. Make sure{" "}
            <code>SUPABASE_SERVICE_ROLE_KEY</code> is set in <code>.env.local</code> and restart
            the dev server.
          </p>
        </Card>
      )}

      <Card>
        <div className="space-y-3">
          {profiles?.map((p) => (
            <div
              key={p.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-slate-200 p-3 dark:border-slate-800"
            >
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  {p.full_name ?? "Unnamed"}{" "}
                  {p.id === profile.id && <Badge tone="indigo">You</Badge>}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {emailById.get(p.id) ?? "—"}
                </p>
              </div>
              <form action={updateUserRole.bind(null, p.id)} className="flex items-center gap-2">
                <Select name="role" defaultValue={p.role}>
                  {ROLES.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </Select>
                <Button type="submit" variant="secondary">
                  Save role
                </Button>
                {p.id !== profile.id && (
                  <Button type="submit" variant="danger" formAction={removeUser.bind(null, p.id)}>
                    Remove
                  </Button>
                )}
              </form>
            </div>
          ))}
          {(!profiles || profiles.length === 0) && (
            <p className="text-sm text-slate-500 dark:text-slate-400">No users yet.</p>
          )}
        </div>
      </Card>

      <Card>
        <form action={inviteUser} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 sm:col-span-2">
            Invite a new user
          </p>
          <div>
            <label className={labelClass}>Email</label>
            <Input name="email" type="email" required />
          </div>
          <div>
            <label className={labelClass}>Full name</label>
            <Input name="full_name" />
          </div>
          <div>
            <label className={labelClass}>Role</label>
            <Select name="role" defaultValue="resident">
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex items-end sm:col-span-2">
            <Button type="submit">Send invite</Button>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 sm:col-span-2">
            Sends a Supabase Auth invite email with a link for them to set their own password.
          </p>
        </form>
      </Card>
    </div>
  );
}
