-- A landlord's own RLS on `residents` (profile_id = auth.uid()) only ever
-- matches their own resident row, which doesn't exist for them - so without
-- this, a landlord can't read their tenants' rows at all, even through the
-- payments_select_residents_under_landlord policy's underlying queries.
create policy "residents_select_under_landlord" on public.residents
  for select using (
    property_id in (
      select property_id from public.landlords where profile_id = (select auth.uid())
    )
  );
