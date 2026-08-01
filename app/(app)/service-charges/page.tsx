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
import { createStructure, deleteStructure, recordDirectPayment, recordPayment } from "./actions";

type InvoiceRow = {
  id: string;
  amount: number;
  due_date: string;
  status: string;
  resident_name: string | null;
  period: string | null;
  properties: { street_name: string; house_number: string } | null;
  service_charge_structures: { name: string } | null;
};

const STATUS_TONE: Record<string, "green" | "amber" | "red" | "slate"> = {
  paid: "green",
  partial: "amber",
  overdue: "red",
  unpaid: "slate",
};

export default async function ServiceChargesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const profile = await requireProfile();
  if (!isStaff(profile.role) && profile.role !== "accountant") redirect("/dashboard");

  const supabase = await createClient();
  const { status } = await searchParams;

  const [{ data: structures }, { data: invoices }, { data: residentsForPayment }] = await Promise.all([
    supabase.from("service_charge_structures").select("*").order("name"),
    supabase
      .from("invoices")
      .select("id, amount, due_date, status, resident_name, period, properties(street_name, house_number), service_charge_structures(name)")
      .order("due_date", { ascending: false }),
    supabase
      .from("residents")
      .select("id, full_name, properties(house_number, street_name)")
      .order("full_name"),
  ]);

  const filteredInvoices = ((invoices ?? []) as unknown as InvoiceRow[]).filter(
    (invoice) => !status || invoice.status === status
  );

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
        Service Charge Management
      </h1>

      <Card>
        <h2 className="mb-4 text-lg font-medium text-slate-900 dark:text-slate-100">
          Charge structures
        </h2>
        <div className="space-y-3">
          {structures?.map((structure) => (
            <div
              key={structure.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-slate-200 p-3 dark:border-slate-800"
            >
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100">{structure.name}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {formatCurrency(structure.amount)} · {structure.frequency}
                  {structure.applies_to_apartment_type ? ` · ${structure.applies_to_apartment_type}` : ""}
                  {structure.applies_to_property_type ? ` · ${structure.applies_to_property_type}` : ""}
                </p>
              </div>
              <form action={deleteStructure.bind(null, structure.id)}>
                <Button type="submit" variant="danger">
                  Delete
                </Button>
              </form>

              <form
                action={recordDirectPayment.bind(null, structure.id)}
                className="flex w-full flex-wrap items-center gap-2 border-t border-slate-200 pt-3 dark:border-slate-800"
              >
                <Select name="resident_id" required defaultValue="" className="w-56">
                  <option value="" disabled>
                    Select resident
                  </option>
                  {residentsForPayment?.map((resident) => (
                    <option key={resident.id} value={resident.id}>
                      {resident.full_name}
                      {resident.properties
                        ? ` — ${resident.properties.house_number} ${resident.properties.street_name}`
                        : ""}
                    </option>
                  ))}
                </Select>
                <Select
                  name="period"
                  defaultValue={
                    BILLING_PERIODS.some((p) => p.value === structure.frequency) ? structure.frequency : "monthly"
                  }
                  className="w-32"
                >
                  {BILLING_PERIODS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </Select>
                <Input
                  name="amount"
                  type="number"
                  step="0.01"
                  defaultValue={structure.amount}
                  required
                  className="w-28"
                />
                <Input type="date" name="paid_at" required defaultValue={today} className="w-40" />
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
            </div>
          ))}
          {(!structures || structures.length === 0) && (
            <p className="text-sm text-slate-500 dark:text-slate-400">No charge structures yet.</p>
          )}
        </div>

        <form action={createStructure} className="mt-6 grid grid-cols-1 gap-3 border-t border-slate-200 pt-4 dark:border-slate-800 sm:grid-cols-2">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 sm:col-span-2">
            Add structure
          </p>
          <div>
            <label className={labelClass}>Name</label>
            <Input name="name" required />
          </div>
          <div>
            <label className={labelClass}>Amount</label>
            <Input name="amount" type="number" step="0.01" required />
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
          <div>
            <label className={labelClass}>Applies to property type (optional)</label>
            <Select name="applies_to_property_type" defaultValue="">
              <option value="">All property types</option>
              <option value="occupied">Occupied</option>
              <option value="rent">For rent</option>
              <option value="sale">For sale</option>
              <option value="both">Rent or sale</option>
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Button type="submit">Add structure</Button>
          </div>
        </form>
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
                  {invoice.resident_name ?? "Unknown resident"}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {invoice.properties
                    ? `${invoice.properties.house_number} ${invoice.properties.street_name}`
                    : "Unknown property"}
                  {" · "}
                  {invoice.service_charge_structures?.name ?? "—"} · {formatCurrency(invoice.amount)}
                  {invoice.period ? ` · ${BILLING_PERIODS.find((p) => p.value === invoice.period)?.label ?? invoice.period}` : ""}
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
