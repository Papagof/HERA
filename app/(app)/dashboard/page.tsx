import { createClient } from "@/lib/supabase/server";
import { requireProfile, isStaff } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/currency";
import { formatCoverageLabel } from "@/lib/month";

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <Card>
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-3xl font-semibold text-slate-900 dark:text-slate-100">{value}</p>
    </Card>
  );
}

type OwnPaymentRow = {
  id: string;
  amount: number;
  paid_at: string;
  period: string | null;
  covers_start: string | null;
  covers_end: string | null;
  service_charge_structures: { name: string; charge_category: string } | null;
};

function PaymentList({ payments }: { payments: OwnPaymentRow[] }) {
  return (
    <div className="space-y-2">
      {payments.map((payment) => {
        const coverage = formatCoverageLabel(payment.covers_start, payment.covers_end, payment.period);
        const coveragePrefix = payment.covers_start && payment.covers_end ? "covers " : "";
        return (
          <div
            key={payment.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-200 p-2 text-sm dark:border-slate-800"
          >
            <span className="text-slate-700 dark:text-slate-300">
              {payment.service_charge_structures?.name ?? "Payment"}
              {payment.service_charge_structures?.charge_category
                ? ` (${payment.service_charge_structures.charge_category})`
                : ""}
              {coverage ? ` · ${coveragePrefix}${coverage}` : ""}
            </span>
            <span className="text-slate-500 dark:text-slate-400">
              {formatCurrency(payment.amount)} · paid {payment.paid_at.slice(0, 10)}
            </span>
          </div>
        );
      })}
      {payments.length === 0 && (
        <p className="text-sm text-slate-500 dark:text-slate-400">No payments recorded yet.</p>
      )}
    </div>
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

  let balance = 0;

  if (canSeeFinancials) {
    const { data: entries } = await supabase.from("income_expenditure_entries").select("entry_type, amount");
    const totalIncome = (entries ?? [])
      .filter((e) => e.entry_type === "income")
      .reduce((sum, e) => sum + Number(e.amount), 0);
    const totalExpenditure = (entries ?? [])
      .filter((e) => e.entry_type === "expenditure")
      .reduce((sum, e) => sum + Number(e.amount), 0);
    balance = totalIncome - totalExpenditure;
  }

  let residentPayments: OwnPaymentRow[] | null = null;
  if (profile.role === "resident") {
    const { data: resident } = await supabase
      .from("residents")
      .select("id")
      .eq("profile_id", profile.id)
      .maybeSingle();
    if (resident) {
      const { data } = await supabase
        .from("payments")
        .select("id, amount, paid_at, period, covers_start, covers_end, service_charge_structures(name, charge_category)")
        .eq("resident_id", resident.id)
        .order("paid_at", { ascending: false });
      residentPayments = (data ?? []) as unknown as OwnPaymentRow[];
    }
  }
  const residentTotalPaid = (residentPayments ?? []).reduce((sum, p) => sum + Number(p.amount), 0);

  let residentsUnderLandlord: { id: string; full_name: string; payments: OwnPaymentRow[] }[] | null = null;
  if (profile.role === "landlord") {
    const { data: landlord } = await supabase
      .from("landlords")
      .select("property_id")
      .eq("profile_id", profile.id)
      .maybeSingle();
    if (landlord) {
      const [{ data: residents }, { data: payments }] = await Promise.all([
        supabase.from("residents").select("id, full_name").eq("property_id", landlord.property_id).order("full_name"),
        supabase
          .from("payments")
          .select(
            "id, resident_id, amount, paid_at, period, covers_start, covers_end, service_charge_structures(name, charge_category)"
          )
          .not("resident_id", "is", null)
          .order("paid_at", { ascending: false }),
      ]);
      const paymentsByResident = new Map<string, OwnPaymentRow[]>();
      for (const payment of (payments ?? []) as unknown as (OwnPaymentRow & { resident_id: string })[]) {
        const list = paymentsByResident.get(payment.resident_id) ?? [];
        list.push(payment);
        paymentsByResident.set(payment.resident_id, list);
      }
      residentsUnderLandlord = (residents ?? []).map((resident) => ({
        id: resident.id,
        full_name: resident.full_name,
        payments: paymentsByResident.get(resident.id) ?? [],
      }));
    }
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
        {canSeeFinancials && <StatCard label="Current balance" value={formatCurrency(balance)} />}
      </div>

      {residentPayments && (
        <Card>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-medium text-slate-900 dark:text-slate-100">My Payments</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Total paid: <span className="font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(residentTotalPaid)}</span>
            </p>
          </div>
          <PaymentList payments={residentPayments} />
        </Card>
      )}

      {residentsUnderLandlord && (
        <Card>
          <h2 className="mb-4 text-lg font-medium text-slate-900 dark:text-slate-100">Resident Payments</h2>
          <div className="space-y-4">
            {residentsUnderLandlord.map((resident) => {
              const totalPaid = resident.payments.reduce((sum, p) => sum + Number(p.amount), 0);
              return (
                <div key={resident.id} className="rounded-md border border-slate-200 p-3 dark:border-slate-800">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium text-slate-900 dark:text-slate-100">{resident.full_name}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Total paid: <span className="font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(totalPaid)}</span>
                    </p>
                  </div>
                  <PaymentList payments={resident.payments} />
                </div>
              );
            })}
            {residentsUnderLandlord.length === 0 && (
              <p className="text-sm text-slate-500 dark:text-slate-400">No residents linked to your property yet.</p>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
