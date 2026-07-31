import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button, buttonClasses } from "@/components/ui/Button";
import { labelClass } from "@/components/ui/fieldStyles";
import { updateGroupInviteUrl } from "./actions";

const GROUP_DESCRIPTIONS: Record<string, string> = {
  executive: "Coordination and discussion for the current executive committee.",
  landlords: "Updates and discussion for landlords across the estate.",
  estate_wide: "General announcements and discussion for the whole estate.",
};

export default async function CommunityPage() {
  const profile = await requireProfile();
  const canManage = profile.role === "super_admin";
  const supabase = await createClient();

  const { data: groups, error } = await supabase
    .from("community_groups")
    .select("*")
    .order("key");

  if (error) throw new Error(error.message);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
        Community
      </h1>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        WhatsApp groups for the estate. You only see the groups your role belongs to.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {(groups ?? []).map((group) => (
          <Card key={group.id}>
            <p className="font-medium text-slate-900 dark:text-slate-100">{group.label}</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {GROUP_DESCRIPTIONS[group.key] ?? ""}
            </p>

            {group.invite_url ? (
              <a
                href={group.invite_url}
                target="_blank"
                rel="noopener noreferrer"
                className={`mt-4 inline-flex ${buttonClasses("primary")}`}
              >
                Join on WhatsApp
              </a>
            ) : (
              <p className="mt-4 text-sm text-slate-400 dark:text-slate-500">
                Invite link not set up yet.
              </p>
            )}

            {canManage && (
              <form
                action={updateGroupInviteUrl.bind(null, group.id)}
                className="mt-4 space-y-2 border-t border-slate-200 pt-4 dark:border-slate-800"
              >
                <label className={labelClass}>Invite link (super admin only)</label>
                <Input
                  name="invite_url"
                  type="url"
                  placeholder="https://chat.whatsapp.com/..."
                  defaultValue={group.invite_url ?? ""}
                />
                <Button type="submit" variant="secondary">
                  Save link
                </Button>
              </form>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
