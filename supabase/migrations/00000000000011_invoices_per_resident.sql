-- Invoices now generate one per resident, not one per property, so a unit
-- with multiple residents produces one invoice per person. resident_name is
-- a snapshot (same pattern as occupancy_history.full_name) so invoice/payment
-- history stays readable after a resident moves out and their row is deleted.

alter table public.invoices add column resident_id uuid references public.residents(id) on delete set null;
alter table public.invoices add column resident_name text;

alter table public.payments add column resident_id uuid references public.residents(id) on delete set null;
alter table public.payments add column resident_name text;

create index idx_invoices_resident_id on public.invoices (resident_id);
create index idx_payments_resident_id on public.payments (resident_id);
