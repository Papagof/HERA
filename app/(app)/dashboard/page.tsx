import { createClient } from "@/lib/supabase/server";
import { requireProfile, isStaff } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/currency";

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <Card>
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-3xl font-semibold text-slate-900 dark:text-slate-100">{value}</p>
    </Card>
  );
}

export default async function DashboardPage() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const canSeeFinancials = isStaff(profile.role) || profile.role === "accountant";

  // Resident/landlord counts come from estate_public_stats() rather than a
  // direct table count - the same security-definer source the public
  // homepage uses. A direct `.from("residents").select(count)` is RLS-scoped
  // to the viewer's own row for landlord/resident roles, which would show a
  // misleadingly small number instead of the real estate-wide total.
  const [{ count: propertyCount }, { data: publicStats }] = await Promise.all([
    supabase.from("properties").select("*", { count: "exact", head: true }),
    supabase.rpc("estate_public_stats").single(),
  ]);
  const residentCount = publicStats?.resident_count ?? 0;
  const landlordCount = publicStats?.landlord_count ?? 0;

  let outstanding = 0;
  let balance = 0;

  if (canSeeFinancials) {
    const { data: unpaidInvoices } = await supabase
      .from("invoices")
      .select("id, amount")
      .neq("status", "paid");

    const invoiceIds = (unpaidInvoices ?? []).map((i) => i.id);
    const { data: paymentsAgainstUnpaid } =
      invoiceIds.length > 0
        ? await supabase.from("payments").select("invoice_id, amount").in("invoice_id", invoiceIds)
        : { data: [] as { invoice_id: string | null; amount: number }[] };

    const paidByInvoice = new Map<string, number>();
    for (const payment of paymentsAgainstUnpaid ?? []) {
      if (!payment.invoice_id) continue;
      paidByInvoice.set(payment.invoice_id, (paidByInvoice.get(payment.invoice_id) ?? 0) + Number(payment.amount));
    }
    outstanding = (unpaidInvoices ?? []).reduce(
      (sum, invoice) => sum + Math.max(0, Number(invoice.amount) - (paidByInvoice.get(invoice.id) ?? 0)),
      0
    );

    const { data: entries } = await supabase.from("income_expenditure_entries").select("entry_type, amount");
    const totalIncome = (entries ?? [])
      .filter((e) => e.entry_type === "income")
      .reduce((sum, e) => sum + Number(e.amount), 0);
    const totalExpenditure = (entries ?? [])
      .filter((e) => e.entry_type === "expenditure")
      .reduce((sum, e) => sum + Number(e.amount), 0);
    balance = totalIncome - totalExpenditure;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Dashboard</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Welcome back, {profile.full_name ?? "there"}.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Residents" value={residentCount} />
        <StatCard label="Properties" value={propertyCount ?? 0} />
        <StatCard label="Landlords" value={landlordCount} />
        {canSeeFinancials && (
          <>
            <StatCard label="Outstanding payments" value={formatCurrency(outstanding)} />
            <StatCard label="Current balance" value={formatCurrency(balance)} />
          </>
        )}
      </div>
    </div>
  );
}
