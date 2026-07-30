import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile, isStaff } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { labelClass } from "@/components/ui/fieldStyles";
import { formatCurrency } from "@/lib/currency";
import { createEntry, deleteEntry } from "./actions";

export default async function IncomeExpenditurePage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const profile = await requireProfile();
  if (!isStaff(profile.role) && profile.role !== "accountant") redirect("/dashboard");

  const supabase = await createClient();
  const { type } = await searchParams;

  let query = supabase
    .from("income_expenditure_entries")
    .select("*")
    .order("entry_date", { ascending: false });
  if (type) query = query.eq("entry_type", type);

  const { data: entries, error } = await query;
  if (error) throw new Error(error.message);

  const { data: allEntries } = await supabase
    .from("income_expenditure_entries")
    .select("entry_type, amount");
  const totalIncome = (allEntries ?? [])
    .filter((e) => e.entry_type === "income")
    .reduce((sum, e) => sum + Number(e.amount), 0);
  const totalExpenditure = (allEntries ?? [])
    .filter((e) => e.entry_type === "expenditure")
    .reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
        Income & Expenditure Management
      </h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-slate-500 dark:text-slate-400">Total income</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-600 dark:text-emerald-400">
            {formatCurrency(totalIncome)}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500 dark:text-slate-400">Total expenditure</p>
          <p className="mt-1 text-2xl font-semibold text-red-600 dark:text-red-400">
            {formatCurrency(totalExpenditure)}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500 dark:text-slate-400">Net balance</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">
            {formatCurrency(totalIncome - totalExpenditure)}
          </p>
        </Card>
      </div>

      <Card>
        <form action={createEntry} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 sm:col-span-2">
            Add entry
          </p>
          <div>
            <label className={labelClass}>Type</label>
            <Select name="entry_type" defaultValue="expenditure">
              <option value="income">Income</option>
              <option value="expenditure">Expenditure</option>
            </Select>
          </div>
          <div>
            <label className={labelClass}>Category</label>
            <Input name="category" placeholder="Security, maintenance, donation..." required />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Description (optional)</label>
            <Input name="description" />
          </div>
          <div>
            <label className={labelClass}>Amount</label>
            <Input name="amount" type="number" step="0.01" required />
          </div>
          <div>
            <label className={labelClass}>Date</label>
            <Input name="entry_date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Receipt URL (optional)</label>
            <Input name="receipt_url" />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit">Add entry</Button>
          </div>
        </form>

        <div className="mt-6 mb-4 flex items-center justify-between border-t border-slate-200 pt-4 dark:border-slate-800">
          <h2 className="text-lg font-medium text-slate-900 dark:text-slate-100">Entries</h2>
          <form className="flex items-center gap-2">
            <Select name="type" defaultValue={type ?? ""}>
              <option value="">All entries</option>
              <option value="income">Income</option>
              <option value="expenditure">Expenditure</option>
            </Select>
            <Button type="submit" variant="secondary">
              Filter
            </Button>
          </form>
        </div>

        <div className="space-y-2">
          {entries?.map((entry) => (
            <div
              key={entry.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-slate-200 p-3 dark:border-slate-800"
            >
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  {entry.category}
                  {entry.description ? ` — ${entry.description}` : ""}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{entry.entry_date}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge tone={entry.entry_type === "income" ? "green" : "red"}>
                  {entry.entry_type === "income" ? "+" : "-"}
                  {formatCurrency(entry.amount)}
                </Badge>
                <form action={deleteEntry.bind(null, entry.id)}>
                  <Button type="submit" variant="danger">
                    Delete
                  </Button>
                </form>
              </div>
            </div>
          ))}
          {(!entries || entries.length === 0) && (
            <p className="text-sm text-slate-500 dark:text-slate-400">No entries recorded.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
