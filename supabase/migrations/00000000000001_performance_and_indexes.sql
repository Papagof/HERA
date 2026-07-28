-- Performance pass:
-- 1. Add covering indexes for every FK the advisor flagged as unindexed.
-- 2. Rewrite RLS policies so auth.uid()/current_user_role() calls are
--    wrapped in `(select ...)`, which Postgres evaluates once per query
--    (an InitPlan) instead of once per row - see
--    https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select
-- 3. Consolidate `profiles`' three overlapping policies (select_own_or_staff,
--    update_own, manage_super_admin_only via `for all`) into one policy per
--    action, since multiple permissive policies for the same role/action
--    each have to run on every query.

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index if not exists idx_executives_profile_id on public.executives (profile_id);
create index if not exists idx_income_expenditure_entries_recorded_by on public.income_expenditure_entries (recorded_by);
create index if not exists idx_invoices_property_id on public.invoices (property_id);
create index if not exists idx_invoices_structure_id on public.invoices (structure_id);
create index if not exists idx_landlords_profile_id on public.landlords (profile_id);
create index if not exists idx_landlords_property_id on public.landlords (property_id);
create index if not exists idx_listing_inquiries_listing_id on public.listing_inquiries (listing_id);
create index if not exists idx_occupancy_history_property_id on public.occupancy_history (property_id);
create index if not exists idx_occupancy_history_resident_id on public.occupancy_history (resident_id);
create index if not exists idx_payments_invoice_id on public.payments (invoice_id);
create index if not exists idx_payments_property_id on public.payments (property_id);
create index if not exists idx_property_listings_property_id on public.property_listings (property_id);
create index if not exists idx_residents_profile_id on public.residents (profile_id);
create index if not exists idx_residents_property_id on public.residents (property_id);

-- ---------------------------------------------------------------------------
-- profiles - consolidated to one policy per action
-- ---------------------------------------------------------------------------

drop policy "profiles_select_own_or_staff" on public.profiles;
drop policy "profiles_update_own" on public.profiles;
drop policy "profiles_manage_super_admin_only" on public.profiles;

create policy "profiles_select" on public.profiles
  for select using (
    id = (select auth.uid())
    or (select public.current_user_role()) in ('super_admin', 'executive_current', 'executive_past', 'accountant')
  );

create policy "profiles_update" on public.profiles
  for update using (
    id = (select auth.uid())
    or (select public.current_user_role()) = 'super_admin'
  );

create policy "profiles_insert" on public.profiles
  for insert with check ((select public.current_user_role()) = 'super_admin');

create policy "profiles_delete" on public.profiles
  for delete using ((select public.current_user_role()) = 'super_admin');

-- ---------------------------------------------------------------------------
-- properties
-- ---------------------------------------------------------------------------

drop policy "properties_write_staff" on public.properties;
drop policy "properties_update_staff" on public.properties;
drop policy "properties_delete_staff" on public.properties;

create policy "properties_write_staff" on public.properties
  for insert with check ((select public.current_user_role()) in ('super_admin', 'executive_current'));

create policy "properties_update_staff" on public.properties
  for update using ((select public.current_user_role()) in ('super_admin', 'executive_current'));

create policy "properties_delete_staff" on public.properties
  for delete using ((select public.current_user_role()) in ('super_admin', 'executive_current'));

-- ---------------------------------------------------------------------------
-- landlords
-- ---------------------------------------------------------------------------

drop policy "landlords_select" on public.landlords;
drop policy "landlords_write_staff" on public.landlords;
drop policy "landlords_update_staff" on public.landlords;
drop policy "landlords_delete_staff" on public.landlords;

create policy "landlords_select" on public.landlords
  for select using (
    (select public.current_user_role()) in ('super_admin', 'executive_current', 'executive_past')
    or profile_id = (select auth.uid())
  );

create policy "landlords_write_staff" on public.landlords
  for insert with check ((select public.current_user_role()) in ('super_admin', 'executive_current'));

create policy "landlords_update_staff" on public.landlords
  for update using ((select public.current_user_role()) in ('super_admin', 'executive_current'));

create policy "landlords_delete_staff" on public.landlords
  for delete using ((select public.current_user_role()) in ('super_admin', 'executive_current'));

-- ---------------------------------------------------------------------------
-- residents
-- ---------------------------------------------------------------------------

drop policy "residents_select" on public.residents;
drop policy "residents_write_staff" on public.residents;
drop policy "residents_update_staff" on public.residents;
drop policy "residents_delete_staff" on public.residents;

create policy "residents_select" on public.residents
  for select using (
    (select public.current_user_role()) in ('super_admin', 'executive_current', 'executive_past')
    or profile_id = (select auth.uid())
  );

create policy "residents_write_staff" on public.residents
  for insert with check ((select public.current_user_role()) in ('super_admin', 'executive_current'));

create policy "residents_update_staff" on public.residents
  for update using ((select public.current_user_role()) in ('super_admin', 'executive_current'));

create policy "residents_delete_staff" on public.residents
  for delete using ((select public.current_user_role()) in ('super_admin', 'executive_current'));

-- ---------------------------------------------------------------------------
-- occupancy_history
-- ---------------------------------------------------------------------------

drop policy "occupancy_history_select_staff" on public.occupancy_history;
drop policy "occupancy_history_write_staff" on public.occupancy_history;

create policy "occupancy_history_select_staff" on public.occupancy_history
  for select using ((select public.current_user_role()) in ('super_admin', 'executive_current', 'executive_past'));

create policy "occupancy_history_write_staff" on public.occupancy_history
  for insert with check ((select public.current_user_role()) in ('super_admin', 'executive_current'));

-- ---------------------------------------------------------------------------
-- service_charge_structures / invoices / payments / income_expenditure_entries
-- ---------------------------------------------------------------------------

drop policy "service_charge_structures_staff" on public.service_charge_structures;
create policy "service_charge_structures_staff" on public.service_charge_structures
  for all using ((select public.current_user_role()) in ('super_admin', 'executive_current', 'accountant'));

drop policy "invoices_staff" on public.invoices;
create policy "invoices_staff" on public.invoices
  for all using ((select public.current_user_role()) in ('super_admin', 'executive_current', 'accountant'));

drop policy "payments_staff" on public.payments;
create policy "payments_staff" on public.payments
  for all using ((select public.current_user_role()) in ('super_admin', 'executive_current', 'accountant'));

drop policy "income_expenditure_staff" on public.income_expenditure_entries;
create policy "income_expenditure_staff" on public.income_expenditure_entries
  for all using ((select public.current_user_role()) in ('super_admin', 'executive_current', 'accountant'));

-- ---------------------------------------------------------------------------
-- property_listings / listing_inquiries
-- ---------------------------------------------------------------------------

drop policy "property_listings_select_published" on public.property_listings;
drop policy "property_listings_write_staff" on public.property_listings;
drop policy "property_listings_update_staff" on public.property_listings;
drop policy "property_listings_delete_staff" on public.property_listings;

create policy "property_listings_select_published" on public.property_listings
  for select using (is_published or (select public.current_user_role()) in ('super_admin', 'executive_current'));

create policy "property_listings_write_staff" on public.property_listings
  for insert with check ((select public.current_user_role()) in ('super_admin', 'executive_current'));

create policy "property_listings_update_staff" on public.property_listings
  for update using ((select public.current_user_role()) in ('super_admin', 'executive_current'));

create policy "property_listings_delete_staff" on public.property_listings
  for delete using ((select public.current_user_role()) in ('super_admin', 'executive_current'));

drop policy "listing_inquiries_select_staff" on public.listing_inquiries;
create policy "listing_inquiries_select_staff" on public.listing_inquiries
  for select using ((select public.current_user_role()) in ('super_admin', 'executive_current'));

-- ---------------------------------------------------------------------------
-- executives
-- ---------------------------------------------------------------------------

drop policy "executives_write_staff" on public.executives;
drop policy "executives_update_staff" on public.executives;
drop policy "executives_delete_staff" on public.executives;

create policy "executives_write_staff" on public.executives
  for insert with check ((select public.current_user_role()) in ('super_admin', 'executive_current'));

create policy "executives_update_staff" on public.executives
  for update using ((select public.current_user_role()) in ('super_admin', 'executive_current'));

create policy "executives_delete_staff" on public.executives
  for delete using ((select public.current_user_role()) in ('super_admin', 'executive_current'));

-- ---------------------------------------------------------------------------
-- monthly_reports
-- ---------------------------------------------------------------------------

drop policy "monthly_reports_select_published_or_staff" on public.monthly_reports;
drop policy "monthly_reports_write_staff" on public.monthly_reports;
drop policy "monthly_reports_update_staff" on public.monthly_reports;

create policy "monthly_reports_select_published_or_staff" on public.monthly_reports
  for select using (is_published or (select public.current_user_role()) in ('super_admin', 'executive_current', 'accountant'));

create policy "monthly_reports_write_staff" on public.monthly_reports
  for insert with check ((select public.current_user_role()) in ('super_admin', 'executive_current', 'accountant'));

create policy "monthly_reports_update_staff" on public.monthly_reports
  for update using ((select public.current_user_role()) in ('super_admin', 'executive_current', 'accountant'));
