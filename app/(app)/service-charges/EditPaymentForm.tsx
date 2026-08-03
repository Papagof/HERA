"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/currency";
import { BILLING_PERIODS } from "@/lib/billing-periods";

const SERVICE_CHARGE = "Service Charge";
const DEVELOPMENT_LEVY = "Development Levy";

export function EditPaymentForm({
  action,
  chargeCategory,
  rate,
  currentAmount,
  currentPlotCount,
  currentPeriod,
  currentCoversStartMonth,
  currentPaidAt,
  currentMethod,
  currentReference,
}: {
  action: (formData: FormData) => void;
  chargeCategory: string;
  rate: number;
  currentAmount: number;
  currentPlotCount: number | null;
  currentPeriod: string | null;
  currentCoversStartMonth: string | null;
  currentPaidAt: string;
  currentMethod: string;
  currentReference: string | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const [plotCount, setPlotCount] = useState(String(currentPlotCount ?? "1"));
  const isDevelopmentLevy = chargeCategory === DEVELOPMENT_LEVY;
  const isServiceCharge = chargeCategory === SERVICE_CHARGE;
  const plotCountNumber = Number(plotCount) || 0;

  if (!expanded) {
    return (
      <Button type="button" variant="secondary" onClick={() => setExpanded(true)}>
        Correct
      </Button>
    );
  }

  return (
    <form action={action} className="flex w-full flex-wrap items-center gap-2 border-t border-slate-200 pt-3 dark:border-slate-800">
      {isDevelopmentLevy ? (
        <>
          <Input
            name="plot_count"
            type="number"
            min="0.5"
            step="0.5"
            required
            value={plotCount}
            onChange={(e) => setPlotCount(e.target.value)}
            className="w-24"
          />
          <span className="text-sm text-slate-500 dark:text-slate-400">
            plots × {formatCurrency(rate)}/plot = <strong>{formatCurrency(rate * plotCountNumber)}</strong>
          </span>
        </>
      ) : (
        <Input name="amount" type="number" step="0.01" defaultValue={currentAmount} required className="w-28" />
      )}

      {isServiceCharge && (
        <>
          <Select name="period" defaultValue={currentPeriod ?? "monthly"} className="w-32">
            {BILLING_PERIODS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </Select>
          <Input
            name="covers_start_month"
            type="month"
            defaultValue={currentCoversStartMonth ?? ""}
            className="w-36"
          />
        </>
      )}

      <Input type="date" name="paid_at" required defaultValue={currentPaidAt} className="w-40" />
      <Select name="method" defaultValue={currentMethod} className="w-36">
        <option value="bank_transfer">Bank transfer</option>
        <option value="cash">Cash</option>
        <option value="card">Card</option>
        <option value="mobile_money">Mobile money</option>
      </Select>
      <Input name="reference" placeholder="Reference" defaultValue={currentReference ?? ""} className="w-32" />
      <Button type="submit" variant="secondary">
        Save correction
      </Button>
      <Button type="button" variant="secondary" onClick={() => setExpanded(false)}>
        Cancel
      </Button>
    </form>
  );
}
