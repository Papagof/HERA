import { createClient } from "@/lib/supabase/server";
import { requireProfile, isStaff } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { labelClass } from "@/components/ui/fieldStyles";
import { generateReport, updateReport, deleteReport } from "./actions";

export default async function ReportsPage() {
  const profile = await requireProfile();
  const canManage = isStaff(profile.role) || profile.role === "accountant";
  const supabase = await createClient();

  const { data: reports } = await supabase
    .from("monthly_reports")
    .select("*")
    .order("report_month", { ascending: false });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
        Monthly Reporting
      </h1>

      {canManage && (
        <Card>
          <form action={generateReport} className="flex flex-wrap items-end gap-3">
            <div>
              <label className={labelClass}>Month</label>
              <Input name="report_month" type="month" required defaultValue={new Date().toISOString().slice(0, 7)} />
            </div>
            <Button type="submit">Generate report</Button>
          </form>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Computes totals from Service Charges (collected/outstanding) and Income & Expenditure
            for the selected month. Re-running for the same month recalculates it.
          </p>
        </Card>
      )}

      <div className="space-y-4">
        {reports?.map((report) => (
          <Card key={report.id}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-medium text-slate-900 dark:text-slate-100">
                {new Date(`${report.report_month}T00:00:00Z`).toLocaleDateString(undefined, {
                  month: "long",
                  year: "numeric",
                  timeZone: "UTC",
                })}
              </h2>
              <Badge tone={report.is_published ? "green" : "slate"}>
                {report.is_published ? "Published" : "Draft"}
              </Badge>
            </div>

            <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <div>
                <dt className="text-slate-500 dark:text-slate-400">Collected</dt>
                <dd className="font-medium text-slate-900 dark:text-slate-100">{report.total_collected}</dd>
              </div>
              <div>
                <dt className="text-slate-500 dark:text-slate-400">Outstanding</dt>
                <dd className="font-medium text-slate-900 dark:text-slate-100">{report.total_outstanding}</dd>
              </div>
              <div>
                <dt className="text-slate-500 dark:text-slate-400">Income</dt>
                <dd className="font-medium text-emerald-600 dark:text-emerald-400">{report.total_income}</dd>
              </div>
              <div>
                <dt className="text-slate-500 dark:text-slate-400">Expenditure</dt>
                <dd className="font-medium text-red-600 dark:text-red-400">{report.total_expenditure}</dd>
              </div>
            </dl>

            {canManage ? (
              <form action={updateReport.bind(null, report.id)} className="mt-4 space-y-3 border-t border-slate-200 pt-4 dark:border-slate-800">
                <div>
                  <label className={labelClass}>Summary — key activities/decisions</label>
                  <Textarea name="summary" rows={3} defaultValue={report.summary ?? ""} />
                </div>
                <div>
                  <label className={labelClass}>File URL (optional export link)</label>
                  <Input name="file_url" defaultValue={report.file_url ?? ""} />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`publish-${report.id}`}
                    name="is_published"
                    defaultChecked={report.is_published}
                  />
                  <label htmlFor={`publish-${report.id}`} className="text-sm text-slate-700 dark:text-slate-300">
                    Published (visible to residents/landlords)
                  </label>
                </div>
                <div className="flex gap-2">
                  <Button type="submit">Save</Button>
                  <Button type="submit" variant="danger" formAction={deleteReport.bind(null, report.id)}>
                    Delete
                  </Button>
                </div>
              </form>
            ) : (
              report.summary && (
                <p className="mt-4 border-t border-slate-200 pt-4 text-sm text-slate-700 dark:border-slate-800 dark:text-slate-300">
                  {report.summary}
                </p>
              )
            )}
          </Card>
        ))}
        {(!reports || reports.length === 0) && (
          <Card className="text-center text-slate-500 dark:text-slate-400">No reports yet.</Card>
        )}
      </div>
    </div>
  );
}
