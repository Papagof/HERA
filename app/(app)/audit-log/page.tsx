import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

const AUDITED_TABLES = [
  "profiles",
  "properties",
  "landlords",
  "residents",
  "service_charge_structures",
  "payments",
  "property_listings",
  "executives",
  "income_expenditure_entries",
  "monthly_reports",
];

const ACTION_TONE: Record<string, "green" | "amber" | "red"> = {
  INSERT: "green",
  UPDATE: "amber",
  DELETE: "red",
};

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ table?: string }>;
}) {
  const profile = await requireProfile();
  if (!["super_admin", "executive_current", "executive_past"].includes(profile.role)) {
    redirect("/dashboard");
  }

  const { table } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("audit_log")
    .select("id, table_name, record_id, action, changed_at, changed_by, old_data, new_data")
    .order("changed_at", { ascending: false })
    .limit(200);
  if (table) query = query.eq("table_name", table);

  const { data: entries, error } = await query;
  if (error) throw new Error(error.message);

  const changedByIds = Array.from(
    new Set((entries ?? []).map((e) => e.changed_by).filter((id): id is string => !!id))
  );
  const { data: changers } =
    changedByIds.length > 0
      ? await supabase.from("profiles").select("id, full_name").in("id", changedByIds)
      : { data: [] as { id: string; full_name: string | null }[] };
  const nameById = new Map((changers ?? []).map((c) => [c.id, c.full_name]));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Audit Log</h1>

      <Card>
        <form className="flex items-center gap-2">
          <Select name="table" defaultValue={table ?? ""}>
            <option value="">All tables</option>
            {AUDITED_TABLES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
          <Button type="submit" variant="secondary">
            Filter
          </Button>
        </form>
      </Card>

      <Card>
        <div className="space-y-2">
          {entries?.map((entry) => (
            <details
              key={entry.id}
              className="rounded-md border border-slate-200 p-3 dark:border-slate-800"
            >
              <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge tone={ACTION_TONE[entry.action] ?? "slate"}>{entry.action}</Badge>
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {entry.table_name}
                  </span>
                  <span className="text-xs text-slate-400">{entry.record_id}</span>
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  {entry.changed_by ? nameById.get(entry.changed_by) ?? "Unknown user" : "System"} ·{" "}
                  {new Date(entry.changed_at).toLocaleString()}
                </div>
              </summary>
              <div className="mt-3 grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
                {entry.old_data && (
                  <div>
                    <p className="mb-1 font-medium text-slate-500 dark:text-slate-400">Before</p>
                    <pre className="overflow-x-auto rounded bg-slate-50 p-2 dark:bg-slate-950">
                      {JSON.stringify(entry.old_data, null, 2)}
                    </pre>
                  </div>
                )}
                {entry.new_data && (
                  <div>
                    <p className="mb-1 font-medium text-slate-500 dark:text-slate-400">After</p>
                    <pre className="overflow-x-auto rounded bg-slate-50 p-2 dark:bg-slate-950">
                      {JSON.stringify(entry.new_data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </details>
          ))}
          {(!entries || entries.length === 0) && (
            <p className="text-sm text-slate-500 dark:text-slate-400">No audit entries yet.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
