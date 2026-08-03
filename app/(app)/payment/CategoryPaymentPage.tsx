import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile, isStaff } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/currency";
import { BILLING_PERIODS } from "@/lib/billing-periods";
import { currentMonth as getCurrentMonth, dateToMonth, formatMonthLabel, monthRange } from "@/lib/month";
import { createStructure, deleteStructure, recordDirectPayment, updatePayment } from "./actions";
import { RecordPaymentForm } from "./RecordPaymentForm";
import { AddStructureForm } from "./AddStructureForm";
import { EditPaymentForm } from "./EditPaymentForm";

const SERVICE_CHARGE = "Service Charge";

type PaymentRow = {
  id: string;
  amount: number;
  paid_at: string;
  method: string;
  reference: string | null;
  resident_name: string | null;
  landlord_name: string | null;
  period: string | null;
  covers_start: string | null;
  covers_end: string | null;
  plot_count: number | null;
  properties: { street_name: string; house_number: string } | null;
  service_charge_structures: { name: string; charge_category: string; amount: number } | null;
};

type StructureRow = {
  id: string;
  name: string;
  amount: number;
  frequency: string;
  applies_to_apartment_type: string | null;
  charge_category: string;
};

type PropertyLabel = { house_number: string; street_name: string } | null;

type LandlordForPayment = {
  id: string;
  full_name: string;
  property_id: string;
  properties: PropertyLabel;
};

type ResidentForPayment = {
  id: string;
  full_name: string;
  property_id: string;
};

type CoverageRow = {
  covers_start: string;
  covers_end: string;
  service_charge_structures: { name: string } | null;
};

type StructureCoverage = {
  structureName: string;
  paidThrough: string;
  owingMonths: string[];
};

function computeCoverageByStructure(rows: CoverageRow[], nowMonth: string): StructureCoverage[] {
  const byStructure = new Map<string, CoverageRow[]>();
  for (const row of rows) {
    const name = row.service_charge_structures?.name ?? "Unknown structure";
    if (!byStructure.has(name)) byStructure.set(name, []);
    byStructure.get(name)!.push(row);
  }

  const result: StructureCoverage[] = [];
  for (const [structureName, structureRows] of byStructure) {
    const covered = new Set<string>();
    let earliestStart = dateToMonth(structureRows[0].covers_start);
    let latestEnd = dateToMonth(structureRows[0].covers_end);
    for (const row of structureRows) {
      const start = dateToMonth(row.covers_start);
      const end = dateToMonth(row.covers_end);
      for (const month of monthRange(start, end)) covered.add(month);
      if (start < earliestStart) earliestStart = start;
      if (end > latestEnd) latestEnd = end;
    }
    const owingMonths = monthRange(earliestStart, nowMonth).filter((month) => !covered.has(month));
    result.push({ structureName, paidThrough: latestEnd, owingMonths });
  }
  return result;
}

function StructureList({
  list,
  landlords,
  residents,
  today,
  nowMonth,
}: {
  list: StructureRow[];
  landlords: LandlordForPayment[];
  residents: ResidentForPayment[];
  today: string;
  nowMonth: string;
}) {
  return (
    <div className="space-y-3">
      {list.map((structure) => (
        <div
          key={structure.id}
          className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-slate-200 p-3 dark:border-slate-800"
        >
          <div>
            <p className="font-medium text-slate-900 dark:text-slate-100">{structure.name}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {formatCurrency(structure.amount)}
              {structure.charge_category === "Development Levy" ? "/plot" : ""} · {structure.frequency} ·{" "}
              {structure.charge_category}
              {structure.applies_to_apartment_type ? ` · ${structure.applies_to_apartment_type}` : ""}
            </p>
          </div>
          <form action={deleteStructure.bind(null, structure.id)}>
            <Button type="submit" variant="danger">
              Delete
            </Button>
          </form>

          <RecordPaymentForm
            action={recordDirectPayment.bind(null, structure.id)}
            landlords={landlords}
            residents={residents}
            defaultAmount={structure.amount}
            defaultPeriod={BILLING_PERIODS.some((p) => p.value === structure.frequency) ? structure.frequency : "monthly"}
            today={today}
            currentMonth={nowMonth}
            chargeCategory={structure.charge_category}
          />
        </div>
      ))}
      {list.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">None yet.</p>}
    </div>
  );
}

export async function CategoryPaymentPage({
  categories,
  title,
  description,
  showCoverage,
  searchParams,
}: {
  categories: readonly string[];
  title: string;
  description?: string;
  showCoverage: boolean;
  searchParams: Promise<{ payer?: string }>;
}) {
  const profile = await requireProfile();
  if (!isStaff(profile.role) && profile.role !== "accountant") redirect("/dashboard");

  const supabase = await createClient();
  const { payer } = await searchParams;
  const [payerType, payerId] = payer ? payer.split(":") : [null, null];

  const [{ data: structures }, { data: residentsForPayment }, { data: landlordsForPayment }] = await Promise.all([
    supabase.from("service_charge_structures").select("*").in("charge_category", categories).order("name"),
    supabase.from("residents").select("id, full_name, property_id").order("full_name"),
    supabase
      .from("landlords")
      .select("id, full_name, property_id, properties(house_number, street_name)")
      .order("full_name"),
  ]);

  const structureIds = (structures ?? []).map((s) => s.id);
  const { data: payments } =
    structureIds.length > 0
      ? await supabase
          .from("payments")
          .select(
            "id, amount, paid_at, method, reference, resident_name, landlord_name, period, covers_start, covers_end, plot_count, properties(street_name, house_number), service_charge_structures(name, charge_category, amount)"
          )
          .in("structure_id", structureIds)
          .order("paid_at", { ascending: false })
      : { data: [] as PaymentRow[] };

  const paymentRows = (payments ?? []) as unknown as PaymentRow[];

  const today = new Date().toISOString().slice(0, 10);
  const nowMonth = getCurrentMonth();

  const serviceChargeStructures = (structures ?? []).filter((s) => s.charge_category === SERVICE_CHARGE);
  const oneOffStructures = (structures ?? []).filter((s) => s.charge_category !== SERVICE_CHARGE);
  const hasServiceCharge = categories.includes(SERVICE_CHARGE);

  let coverageByStructure: StructureCoverage[] = [];
  if (showCoverage && payerType && payerId) {
    const column = payerType === "landlord" ? "landlord_id" : "resident_id";
    const { data: coverageRows } = await supabase
      .from("payments")
      .select("covers_start, covers_end, service_charge_structures(name)")
      .in("structure_id", structureIds)
      .eq(column, payerId)
      .not("covers_start", "is", null)
      .order("covers_start");
    coverageByStructure = computeCoverageByStructure((coverageRows ?? []) as unknown as CoverageRow[], nowMonth);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>}
      </div>

      <Card>
        <h2 className="mb-4 text-lg font-medium text-slate-900 dark:text-slate-100">
          {hasServiceCharge ? "Service Charge structures" : "Structures"}
        </h2>
        <StructureList
          list={hasServiceCharge ? serviceChargeStructures : oneOffStructures}
          landlords={landlordsForPayment ?? []}
          residents={residentsForPayment ?? []}
          today={today}
          nowMonth={nowMonth}
        />
        {hasServiceCharge && categories.length > 1 && (
          <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-800">
            <h2 className="mb-4 text-lg font-medium text-slate-900 dark:text-slate-100">
              5% on Rented Property (one-off, on move-in)
            </h2>
            <StructureList
              list={oneOffStructures}
              landlords={landlordsForPayment ?? []}
              residents={residentsForPayment ?? []}
              today={today}
              nowMonth={nowMonth}
            />
          </div>
        )}
      </Card>

      <Card>
        <AddStructureForm action={createStructure} categories={categories} />
      </Card>

      {showCoverage && (
        <Card>
          <h2 className="mb-4 text-lg font-medium text-slate-900 dark:text-slate-100">Payment coverage</h2>
          <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
            Pick a resident or landlord to see which months they&apos;ve paid for, per charge, and which months
            they&apos;re owing.
          </p>
          <form className="flex flex-wrap items-center gap-2">
            <Select name="payer" defaultValue={payer ?? ""} className="w-72">
              <option value="">Select a payer</option>
              <optgroup label="Residents">
                {residentsForPayment?.map((resident) => (
                  <option key={`resident:${resident.id}`} value={`resident:${resident.id}`}>
                    {resident.full_name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Landlords">
                {landlordsForPayment?.map((landlord) => (
                  <option key={`landlord:${landlord.id}`} value={`landlord:${landlord.id}`}>
                    {landlord.full_name}
                  </option>
                ))}
              </optgroup>
            </Select>
            <Button type="submit" variant="secondary">
              Show coverage
            </Button>
          </form>

          {payerType && payerId && (
            <div className="mt-4 space-y-3">
              {coverageByStructure.length === 0 && (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No payment history with month coverage found for this payer.
                </p>
              )}
              {coverageByStructure.map((coverage) => (
                <div
                  key={coverage.structureName}
                  className="rounded-md border border-slate-200 p-3 dark:border-slate-800"
                >
                  <p className="font-medium text-slate-900 dark:text-slate-100">{coverage.structureName}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Paid through {formatMonthLabel(coverage.paidThrough)}
                  </p>
                  {coverage.owingMonths.length > 0 ? (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      Owing: {coverage.owingMonths.map(formatMonthLabel).join(", ")}
                    </p>
                  ) : (
                    <p className="mt-1 text-sm text-emerald-600 dark:text-emerald-400">Up to date</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      <Card>
        <h2 className="mb-4 text-lg font-medium text-slate-900 dark:text-slate-100">Payment History</h2>
        <div className="space-y-3">
          {paymentRows.map((payment) => (
            <div
              key={payment.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-slate-200 p-3 dark:border-slate-800"
            >
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  {payment.resident_name ?? payment.landlord_name ?? "Unknown payer"}
                  {payment.landlord_name && !payment.resident_name ? " (landlord)" : ""}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {payment.properties
                    ? `${payment.properties.house_number} ${payment.properties.street_name}`
                    : "Unknown property"}
                  {" · "}
                  {payment.service_charge_structures?.name ?? "—"} · {formatCurrency(payment.amount)}
                  {payment.plot_count ? ` · ${payment.plot_count} plot${payment.plot_count === 1 ? "" : "s"}` : ""}
                  {payment.covers_start && payment.covers_end
                    ? ` · covers ${
                        dateToMonth(payment.covers_start) === dateToMonth(payment.covers_end)
                          ? formatMonthLabel(dateToMonth(payment.covers_start))
                          : `${formatMonthLabel(dateToMonth(payment.covers_start))} – ${formatMonthLabel(dateToMonth(payment.covers_end))}`
                      }`
                    : payment.period
                      ? ` · ${BILLING_PERIODS.find((p) => p.value === payment.period)?.label ?? payment.period}`
                      : ""}
                  {" · "}
                  {payment.service_charge_structures?.charge_category ?? ""} · paid {payment.paid_at.slice(0, 10)}
                </p>
              </div>
              {profile.role === "super_admin" && (
                <EditPaymentForm
                  action={updatePayment.bind(null, payment.id)}
                  chargeCategory={payment.service_charge_structures?.charge_category ?? ""}
                  rate={payment.service_charge_structures?.amount ?? 0}
                  currentAmount={payment.amount}
                  currentPlotCount={payment.plot_count}
                  currentPeriod={payment.period}
                  currentCoversStartMonth={payment.covers_start ? dateToMonth(payment.covers_start) : null}
                  currentPaidAt={payment.paid_at.slice(0, 10)}
                  currentMethod={payment.method}
                  currentReference={payment.reference}
                />
              )}
            </div>
          ))}
          {paymentRows.length === 0 && (
            <p className="text-sm text-slate-500 dark:text-slate-400">No payments recorded yet.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
