// Helpers for working with "YYYY-MM" month strings (the value an
// <input type="month"> produces) and the DATE columns (first-of-month) they
// map to in the database.

import { BILLING_PERIODS } from "./billing-periods";

export function monthToDate(yyyyMm: string): string {
  return `${yyyyMm}-01`;
}

export function dateToMonth(dateStr: string): string {
  return dateStr.slice(0, 7);
}

export function addMonths(yyyyMm: string, delta: number): string {
  const [year, month] = yyyyMm.split("-").map(Number);
  const total = year * 12 + (month - 1) + delta;
  const newYear = Math.floor(total / 12);
  const newMonth = (total % 12) + 1;
  return `${newYear}-${String(newMonth).padStart(2, "0")}`;
}

// Inclusive list of every "YYYY-MM" from start through end.
export function monthRange(start: string, end: string): string[] {
  const months: string[] = [];
  let cur = start;
  while (cur <= end) {
    months.push(cur);
    cur = addMonths(cur, 1);
  }
  return months;
}

export function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

export function formatMonthLabel(yyyyMm: string): string {
  const [year, month] = yyyyMm.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleString("en-US", { month: "short", year: "numeric" });
}

// A payment either covers an explicit month range (Service Charge), a named
// period with no explicit range (legacy rows), or neither (a one-off charge).
export function formatCoverageLabel(
  coversStart: string | null,
  coversEnd: string | null,
  period: string | null
): string | null {
  if (coversStart && coversEnd) {
    const startMonth = dateToMonth(coversStart);
    const endMonth = dateToMonth(coversEnd);
    return startMonth === endMonth
      ? formatMonthLabel(startMonth)
      : `${formatMonthLabel(startMonth)} – ${formatMonthLabel(endMonth)}`;
  }
  if (period) {
    return BILLING_PERIODS.find((p) => p.value === period)?.label ?? period;
  }
  return null;
}
