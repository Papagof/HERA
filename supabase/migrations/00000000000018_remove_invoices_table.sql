-- Payments are now the only record - there is no "unpaid" state to track
-- since every payment is recorded at the moment it's made, so the separate
-- invoices table (which only ever represented "this payment, already paid")
-- was pure duplication. structure_id moves onto payments directly.
-- payment_id on income_expenditure_entries links each auto-created entry
-- back to the payment that produced it, so corrections can update both
-- precisely instead of guessing by description text.

alter table public.payments add column structure_id uuid references public.service_charge_structures(id) on delete set null;
update public.payments p set structure_id = i.structure_id from public.invoices i where i.id = p.invoice_id;

alter table public.income_expenditure_entries add column payment_id uuid references public.payments(id) on delete set null;

-- Backfill: the 5 existing income entries from today's real payments map
-- 1:1 unambiguously by payer name + amount + date.
update public.income_expenditure_entries e set payment_id = m.payment_id
from (values
  ('90954b8b-849f-46d8-961c-641b14a41de8'::uuid, 'ef3bb99a-6632-490b-9cd0-90732858f33a'::uuid),
  ('be02c404-31bc-4c10-8f92-82c60c29d7e5'::uuid, 'a376e036-cd11-4df2-9bff-ce08d46b4582'::uuid),
  ('c22787a8-17a2-4f2e-bcce-01d0e624c45e'::uuid, '6732015c-b718-42b9-bac7-8e054fa15507'::uuid),
  ('30c7db1d-2194-4463-b9f0-6ec70ca838d6'::uuid, 'ed6c7db0-3642-48e5-95fe-6ea01ef72c2f'::uuid),
  ('31f7a3f7-67f7-41ec-a7b0-7558955b0e76'::uuid, '56a02294-a739-42f8-a84f-fe4b051e1b62'::uuid)
) as m(entry_id, payment_id)
where e.id = m.entry_id;

alter table public.payments drop column invoice_id;

drop table public.invoices;

create index idx_payments_structure_id on public.payments (structure_id);
create index idx_income_expenditure_entries_payment_id on public.income_expenditure_entries (payment_id);
