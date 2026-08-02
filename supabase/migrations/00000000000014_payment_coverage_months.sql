-- Ties each payment to the specific calendar month(s) it covers (not just
-- a "monthly/quarterly" category), so arrears can be computed as "which
-- months has this resident not paid for" rather than just a due_date.
-- covers_end is derived server-side from covers_start + the period's month
-- count (see lib/billing-periods.ts), inclusive of the last covered month.

alter table public.invoices add column covers_start date;
alter table public.invoices add column covers_end date;

alter table public.payments add column covers_start date;
alter table public.payments add column covers_end date;
