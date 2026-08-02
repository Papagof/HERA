-- Architecture split: Service Charge is billed to residents only,
-- Development Levy to landlords only, and Toll/5% on Rented Property/
-- Donation/Others can be paid by either. A structure now declares which
-- category it belongs to, and invoices/payments record who actually paid
-- (resident or landlord) since it's no longer always a resident.

alter table public.service_charge_structures add column charge_category text
  not null default 'Service Charge'
  check (charge_category in ('Service Charge', 'Development Levy', 'Toll', '5% on Rented Property', 'Donation', 'Others'));

alter table public.invoices add column payer_type text check (payer_type in ('resident', 'landlord'));
alter table public.invoices add column landlord_id uuid references public.landlords(id) on delete set null;
alter table public.invoices add column landlord_name text;

alter table public.payments add column payer_type text check (payer_type in ('resident', 'landlord'));
alter table public.payments add column landlord_id uuid references public.landlords(id) on delete set null;
alter table public.payments add column landlord_name text;

update public.invoices set payer_type = 'resident' where resident_id is not null;
update public.payments set payer_type = 'resident' where resident_id is not null;

create index idx_invoices_landlord_id on public.invoices (landlord_id);
create index idx_payments_landlord_id on public.payments (landlord_id);
