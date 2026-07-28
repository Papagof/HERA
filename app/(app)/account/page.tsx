import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { ChangePasswordForm } from "./ChangePasswordForm";

export default async function AccountPage() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Account</h1>

      <Card>
        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-slate-500 dark:text-slate-400">Name</dt>
            <dd className="text-slate-900 dark:text-slate-100">{profile.full_name ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-slate-500 dark:text-slate-400">Email</dt>
            <dd className="text-slate-900 dark:text-slate-100">{user?.email ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-slate-500 dark:text-slate-400">Role</dt>
            <dd className="text-slate-900 dark:text-slate-100">{profile.role}</dd>
          </div>
        </dl>
      </Card>

      <ChangePasswordForm />
    </div>
  );
}
