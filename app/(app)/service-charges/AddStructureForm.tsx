"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { labelClass } from "@/components/ui/fieldStyles";
import { APARTMENT_TYPES } from "@/lib/apartment-types";
import { INCOME_CATEGORIES } from "@/lib/income-categories";
import { CATEGORY_FREQUENCY } from "@/lib/billing-periods";

const SERVICE_CHARGE = "Service Charge";
const DEVELOPMENT_LEVY = "Development Levy";

const FREQUENCY_LABEL: Record<string, string> = {
  monthly: "Monthly",
  daily: "Daily",
  one_off: "One-off",
};

export function AddStructureForm({ action }: { action: (formData: FormData) => void }) {
  const [category, setCategory] = useState<string>(SERVICE_CHARGE);
  const frequency = CATEGORY_FREQUENCY[category] ?? "monthly";

  return (
    <form action={action} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <p className="text-sm font-medium text-slate-700 dark:text-slate-300 sm:col-span-2">Add structure</p>
      <div>
        <label className={labelClass}>Category</label>
        <Select name="charge_category" value={category} onChange={(e) => setCategory(e.target.value)}>
          {INCOME_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <label className={labelClass}>Name</label>
        <Input name="name" required />
      </div>
      <div>
        <label className={labelClass}>{category === DEVELOPMENT_LEVY ? "Rate per plot" : "Amount"}</label>
        <Input name="amount" type="number" step="0.01" required />
      </div>
      <div>
        <label className={labelClass}>Frequency</label>
        <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
          {FREQUENCY_LABEL[frequency] ?? frequency}
          {category === DEVELOPMENT_LEVY ? " (assessed per plot, minimum half a plot)" : ""}
        </p>
      </div>
      {category === SERVICE_CHARGE && (
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
      )}
      <div className="sm:col-span-2">
        <Button type="submit">Add structure</Button>
      </div>
    </form>
  );
}
