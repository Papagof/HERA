-- Split the blanket payments_staff policy into one-per-action so
-- corrections (UPDATE) can be restricted to super_admin only, matching the
-- app-level check in updatePayment - staff/accountant can still record and
-- view payments, but only super_admin can correct or remove one afterward.
drop policy payments_staff on public.payments;

create policy "payments_select" on public.payments
  for select using ((select public.current_user_role()) in ('super_admin', 'executive_current', 'accountant'));

create policy "payments_insert" on public.payments
  for insert with check ((select public.current_user_role()) in ('super_admin', 'executive_current', 'accountant'));

create policy "payments_update_super_admin" on public.payments
  for update using ((select public.current_user_role()) = 'super_admin');

create policy "payments_delete_super_admin" on public.payments
  for delete using ((select public.current_user_role()) = 'super_admin');
