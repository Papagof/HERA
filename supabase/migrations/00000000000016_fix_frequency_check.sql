-- The frequency check constraint predates BILLING_PERIODS (lib/billing-periods.ts)
-- and still only allowed the original 3 values, so selecting Bi-monthly or
-- Half-yearly on "Add structure" violated it and crashed the insert. Widen
-- it to the current 5 values, keeping the legacy 'annually' too so existing
-- rows (JohnPaul, Qudus Omiyale) stay valid without needing a data migration.
alter table public.service_charge_structures drop constraint service_charge_structures_frequency_check;
alter table public.service_charge_structures add constraint service_charge_structures_frequency_check
  check (frequency in ('monthly', 'bi_monthly', 'quarterly', 'half_yearly', 'yearly', 'annually'));
