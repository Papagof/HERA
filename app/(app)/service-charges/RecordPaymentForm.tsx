"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { BILLING_PERIODS } from "@/lib/billing-periods";

type PropertyLabel = { house_number: string; street_name: string } | null;

type Landlord = {
  id: string;
  full_name: string;
  property_id: string;
  properties: PropertyLabel;
};

type Resident = {
  id: string;
  full_name: string;
  property_id: string;
};

export function RecordPaymentForm({
  action,
  landlords,
  residents,
  defaultAmount,
  defaultPeriod,
  today,
  currentMonth,
}: {
  action: (formData: FormData) => void;
  landlords: Landlord[];
  residents: Resident[];
  defaultAmount: number;
  defaultPeriod: string;
  today: string;
  currentMonth: string;
}) {
  const [landlordId, setLandlordId] = useState("");
  const selectedLandlord = landlords.find((l) => l.id === landlordId);
  const residentsForLandlord = selectedLandlord
    ? residents.filter((r) => r.property_id === selectedLandlord.property_id)
    : [];

  return (
    <form
      action={action}
      className="flex w-full flex-wrap items-center gap-2 border-t border-slate-200 pt-3 dark:border-slate-800"
    >
      <Select
        value={landlordId}
        onChange={(e) => setLandlordId(e.target.value)}
        className="w-56"
      >
        <option value="">Select landlord</option>
        {landlords.map((landlord) => (
          <option key={landlord.id} value={landlord.id}>
            {landlord.full_name}
            {landlord.properties ? ` — ${landlord.properties.house_number} ${landlord.properties.street_name}` : ""}
          </option>
        ))}
      </Select>
      <Select
        key={landlordId}
        name="resident_id"
        required
        defaultValue=""
        className="w-56"
      >
        <option value="" disabled>
          {landlordId ? "Select resident" : "Select a landlord first"}
        </option>
        {residentsForLandlord.map((resident) => (
          <option key={resident.id} value={resident.id}>
            {resident.full_name}
          </option>
        ))}
      </Select>
      <Select name="period" defaultValue={defaultPeriod} className="w-32">
        {BILLING_PERIODS.map((p) => (
          <option key={p.value} value={p.value}>
            {p.label}
          </option>
        ))}
      </Select>
      <Input
        name="covers_start_month"
        type="month"
        required
        defaultValue={currentMonth}
        title="Starting month this payment covers"
        className="w-36"
      />
      <Input name="amount" type="number" step="0.01" defaultValue={defaultAmount} required className="w-28" />
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
  );
}
