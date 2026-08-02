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
import { APARTMENT_TYPES } from "@/lib/apartment-types";
import { BILLING_PERIODS } from "@/lib/billing-periods";
import { INCOME_CATEGORIES } from "@/lib/income-categories";
import { currentMonth as getCurrentMonth, dateToMonth, formatMonthLabel, monthRange } from "@/lib/month";
import { createStructure, deleteStructure, recordDirectPayment, recordPayment } from "./actions";
import { RecordPaymentForm } from "./RecordPaymentForm";

const SERVICE_CHARGE = "Service Charge";

type InvoiceRow = {
  id: string;
  amount: number;
  due_date: string;
  status: string;
  resident_name: string | null;
  landlord_name: string | null;
  period: string | null;
  covers_start: string | null;
  covers_end: string | null;
  properties: { street_name: string; house_number: string } | null;
  service_charge_structures: { name: string; charge_category: string } | null;
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

const STATUS_TONE: Record<string, "green" | "amber" | "red" | "slate"> = {
  paid: "green",
  partial: "amber",
  overdue: "red",
  unpaid: "slate",
};

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
              {formatCurrency(structure.amount)} · {structure.frequency} · {structure.charge_category}
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

export default async function ServiceChargesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; payer?: string }>;
}) {
  const profile = await requireProfile();
  if (!isStaff(profile.role) && profile.role !== "accountant") redirect("/dashboard");

  const supabase = await createClient();
  const { status, payer } = await searchParams;
  const [payerType, payerId] = payer ? payer.split(":") : [null, null];

  const [{ data: structures }, { data: invoices }, { data: residentsForPayment }, { data: landlordsForPayment }] =
    await Promise.all([
      supabase.from("service_charge_structures").select("*").order("name"),
      supabase
        .from("invoices")
        .select(
          "id, amount, due_date, status, resident_name, landlord_name, period, covers_start, covers_end, properties(street_name, house_number), service_charge_structures(name, charge_category)"
        )
        .order("due_date", { ascending: false }),
      supabase.from("residents").select("id, full_name, property_id").order("full_name"),
      supabase
        .from("landlords")
        .select("id, full_name, property_id, properties(house_number, street_name)")
        .order("full_name"),
    ]);

  const filteredInvoices = ((invoices ?? []) as unknown as InvoiceRow[]).filter(
    (invoice) => !status || invoice.status === status
  );

  const today = new Date().toISOString().slice(0, 10);
  const nowMonth = getCurrentMonth();

  const serviceChargeStructures = (structures ?? []).filter((s) => s.charge_category === SERVICE_CHARGE);
  const otherStructures = (structures ?? []).filter((s) => s.charge_category !== SERVICE_CHARGE);

  let coverageByStructure: StructureCoverage[] = [];
  if (payerType && payerId) {
    const column = payerType === "landlord" ? "landlord_id" : "resident_id";
    const { data: coverageRows } = await supabase
      .from("invoices")
      .select("covers_start, covers_end, service_charge_structures(name)")
      .eq(column, payerId)
      .not("covers_start", "is", null)
      .order("covers_start");
    coverageByStructure = computeCoverageByStructure((coverageRows ?? []) as unknown as CoverageRow[], nowMonth);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Payment Management</h1>

      <Card>
        <h2 className="mb-4 text-lg font-medium text-slate-900 dark:text-slate-100">
          Service Charge (residents only)
        </h2>
        <StructureList
          list={serviceChargeStructures}
          landlords={landlordsForPayment ?? []}
          residents={residentsForPayment ?? []}
          today={today}
          nowMonth={nowMonth}
        />
      </Card>

      <Card>
        <h2 className="mb-1 text-lg font-medium text-slate-900 dark:text-slate-100">Other Charges</h2>
        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
          Development Levy is billed to landlords only. Toll, 5% on Rented Property, Donation, and Others can be paid
          by either a resident or a landlord.
        </p>
        <StructureList
          list={otherStructures}
          landlords={landlordsForPayment ?? []}
          residents={residentsForPayment ?? []}
          today={today}
          nowMonth={nowMonth}
        />
      </Card>

      <Card>
        <form
          action={createStructure}
          className="grid grid-cols-1 gap-3 sm:grid-cols-2"
        >
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 sm:col-span-2">Add structure</p>
          <div>
            <label className={labelClass}>Name</label>
            <Input name="name" required />
          </div>
          <div>
            <label className={labelClass}>Amount</label>
            <Input name="amount" type="number" step="0.01" required />
          </div>
          <div>
            <label className={labelClass}>Category</label>
            <Select name="charge_category" defaultValue={SERVICE_CHARGE}>
              {INCOME_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className={labelClass}>Frequency</label>
            <Select name="frequency" defaultValue="monthly">
              {BILLING_PERIODS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className={labelClass}>Applies to apartment type (optional)</label>
            <Select name="applies_to_apartment_type" defaultValue="">
              <option value="">All apartment types</option>
              {APARTMENT_TYPES.map((apartmentType) => (
                <option key={apartmentType} value={apartmentType}>
                  {apartmentType}
                </option>
              ))}
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Button type="submit">Add structure</Button>
          </div>
        </form>
      </Card>

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

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-medium text-slate-900 dark:text-slate-100">Invoices</h2>
          <form className="flex items-center gap-2">
            <Select name="status" defaultValue={status ?? ""}>
              <option value="">All statuses</option>
              <option value="unpaid">Unpaid</option>
              <option value="partial">Partial</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </Select>
            <Button type="submit" variant="secondary">
              Filter
            </Button>
          </form>
        </div>

        <div className="space-y-3">
          {filteredInvoices.map((invoice) => (
            <div
              key={invoice.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-slate-200 p-3 dark:border-slate-800"
            >
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  {invoice.resident_name ?? invoice.landlord_name ?? "Unknown payer"}
                  {invoice.landlord_name && !invoice.resident_name ? " (landlord)" : ""}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {invoice.properties
                    ? `${invoice.properties.house_number} ${invoice.properties.street_name}`
                    : "Unknown property"}
                  {" · "}
                  {invoice.service_charge_structures?.name ?? "—"} · {formatCurrency(invoice.amount)}
                  {invoice.covers_start && invoice.covers_end
                    ? ` · covers ${
                        dateToMonth(invoice.covers_start) === dateToMonth(invoice.covers_end)
                          ? formatMonthLabel(dateToMonth(invoice.covers_start))
                          : `${formatMonthLabel(dateToMonth(invoice.covers_start))} – ${formatMonthLabel(dateToMonth(invoice.covers_end))}`
                      }`
                    : invoice.period
                      ? ` · ${BILLING_PERIODS.find((p) => p.value === invoice.period)?.label ?? invoice.period}`
                      : ""}
                  {" · "}
                  {invoice.status === "paid" ? "paid" : "due"} {invoice.due_date}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge tone={STATUS_TONE[invoice.status] ?? "slate"}>{invoice.status}</Badge>
                {invoice.status !== "paid" && (
                  <form action={recordPayment.bind(null, invoice.id)} className="flex items-center gap-2">
                    <Input name="amount" type="number" step="0.01" placeholder="Amount" required className="w-28" />
                    <Select name="method" defaultValue="bank_transfer" className="w-36">
                      <option value="bank_transfer">Bank transfer</option>
                      <option value="cash">Cash</option>
                      <option value="card">Card</option>
                      <option value="mobile_money">Mobile money</option>
                    </Select>
                    <Input name="reference" placeholder="Reference" className="w-32" />
                    <Button type="submit" variant="secondary">
                      Record payment
                    </Button>
                  </form>
                )}
              </div>
            </div>
          ))}
          {filteredInvoices.length === 0 && (
            <p className="text-sm text-slate-500 dark:text-slate-400">No invoices match this filter.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
