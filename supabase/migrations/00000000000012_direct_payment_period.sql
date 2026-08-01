-- Payments no longer require a pre-existing invoice: "Record payment" now
-- creates the invoice (already status='paid') and the payment together in
-- one step. Each records which period it covers - not the same as due_date,
-- since a resident might pay a different span than the structure's usual
-- frequency (e.g. paying half-yearly upfront on a monthly structure).
-- Existing unpaid/partial invoices from the old generate-then-pay workflow
-- are left as-is and still payable via the existing per-invoice recordPayment
-- action, so no historical data is lost by this change.

alter table public.invoices add column period text
  check (period in ('monthly', 'bi_monthly', 'quarterly', 'half_yearly', 'yearly'));

alter table public.payments add column period text
  check (period in ('monthly', 'bi_monthly', 'quarterly', 'half_yearly', 'yearly'));
