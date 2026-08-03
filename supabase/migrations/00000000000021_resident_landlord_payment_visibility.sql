-- Residents can see their own payments; landlords can see payments made by
-- residents living at their property. These are additional permissive SELECT
-- policies (combined with OR alongside payments_select for staff), not a
-- replacement - staff access is untouched.
--
-- The resident-self case works with a plain subquery because residents_select
-- already lets a resident read their own row (profile_id = auth.uid()).
-- The landlord case needs a SECURITY DEFINER helper (same pattern as
-- current_user_role()) because a landlord's own RLS on `residents` only
-- lets them read rows via this policy, not raw subqueries - without it,
-- the subquery would be evaluated under the landlord's own residents_select
-- policy and return nothing for residents that aren't their own row.
create or replace function public.residents_under_current_landlord()
returns setof uuid
language sql
security definer
set search_path = public
stable
as $$
  select r.id
  from public.residents r
  join public.landlords l on l.property_id = r.property_id
  where l.profile_id = auth.uid();
$$;

create policy "payments_select_own_resident" on public.payments
  for select using (
    resident_id in (
      select id from public.residents where profile_id = (select auth.uid())
    )
  );

create policy "payments_select_residents_under_landlord" on public.payments
  for select using (
    resident_id in (select public.residents_under_current_landlord())
  );
