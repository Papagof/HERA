"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { labelClass } from "@/components/ui/fieldStyles";
import { INCOME_CATEGORIES } from "@/lib/income-categories";

export function AddEntryForm({ action }: { action: (formData: FormData) => void }) {
  const [entryType, setEntryType] = useState<"income" | "expenditure">("expenditure");

  return (
    <form action={action} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <p className="text-sm font-medium text-slate-700 dark:text-slate-300 sm:col-span-2">
        Add entry
      </p>
      <div>
        <label className={labelClass}>Type</label>
        <Select
          name="entry_type"
          value={entryType}
          onChange={(e) => setEntryType(e.target.value as "income" | "expenditure")}
        >
          <option value="income">Income</option>
          <option value="expenditure">Expenditure</option>
        </Select>
      </div>
      <div>
        <label className={labelClass}>Category</label>
        {entryType === "income" ? (
          <Select name="category" required defaultValue="">
            <option value="" disabled>
              Select a category
            </option>
            {INCOME_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </Select>
        ) : (
          <Input name="category" placeholder="Security, maintenance, donation..." required />
        )}
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
  );
}
