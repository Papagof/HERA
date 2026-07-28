"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function str(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

function monthRange(monthStart: string) {
  const start = new Date(`${monthStart}T00:00:00Z`);
  const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1));
  return { start: start.toISOString(), end: end.toISOString() };
}

export async function generateReport(formData: FormData) {
  const supabase = await createClient();
  const monthInput = str(formData, "report_month")!; // "YYYY-MM"
  const reportMonth = `${monthInput}-01`;
  const { start, end } = monthRange(reportMonth);
  const nextMonthDate = end.slice(0, 10);

  const [{ data: payments }, { data: unpaidInvoices }, { data: entries }] = await Promise.all([
    supabase.from("payments").select("amount").gte("paid_at", start).lt("paid_at", end),
    supabase
      .from("invoices")
      .select("id, amount")
      .neq("status", "paid")
      .gte("due_date", reportMonth)
      .lt("due_date", nextMonthDate),
    supabase
      .from("income_expenditure_entries")
      .select("entry_type, amount")
      .gte("entry_date", reportMonth)
      .lt("entry_date", nextMonthDate),
  ]);

  const totalCollected = (payments ?? []).reduce((sum, p) => sum + Number(p.amount), 0);

  // Outstanding must net out any partial payments already made against these
  // invoices, matching the dashboard's calculation - not just the invoices'
  // original face amount.
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
  const totalOutstanding = (unpaidInvoices ?? []).reduce(
    (sum, invoice) => sum + Math.max(0, Number(invoice.amount) - (paidByInvoice.get(invoice.id) ?? 0)),
    0
  );
  const totalIncome = (entries ?? [])
    .filter((e) => e.entry_type === "income")
    .reduce((sum, e) => sum + Number(e.amount), 0);
  const totalExpenditure = (entries ?? [])
    .filter((e) => e.entry_type === "expenditure")
    .reduce((sum, e) => sum + Number(e.amount), 0);

  const { error } = await supabase.from("monthly_reports").upsert(
    {
      report_month: reportMonth,
      total_collected: totalCollected,
      total_outstanding: totalOutstanding,
      total_income: totalIncome,
      total_expenditure: totalExpenditure,
    },
    { onConflict: "report_month" }
  );

  if (error) throw new Error(error.message);
  revalidatePath("/reports");
}

export async function updateReport(reportId: string, formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("monthly_reports")
    .update({
      summary: str(formData, "summary"),
      file_url: str(formData, "file_url"),
      is_published: formData.get("is_published") === "on",
    })
    .eq("id", reportId);

  if (error) throw new Error(error.message);
  revalidatePath("/reports");
}

export async function deleteReport(reportId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("monthly_reports").delete().eq("id", reportId);
  if (error) throw new Error(error.message);
  revalidatePath("/reports");
}
