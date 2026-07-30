-- Split resident_count (previously residents+landlords combined) into two
-- separate fields, so the dashboard can show them as distinct stat cards
-- (matching its existing "Residents"/"Landlords" layout) while still using
-- this same security-definer source of truth the public homepage already
-- relies on - the dashboard's direct `.from("residents").select(count)`
-- query was RLS-scoped to the viewer's own row for landlord/resident
-- roles, silently disagreeing with the homepage's true estate-wide total.
drop function public.estate_public_stats();

create function public.estate_public_stats()
returns table (
  resident_count bigint,
  landlord_count bigint,
  available_properties bigint,
  active_executives bigint
)
language sql
security definer set search_path = public
stable
as $$
  select
    (select count(*) from public.residents) as resident_count,
    (select count(*) from public.landlords) as landlord_count,
    (select count(*) from public.properties where status = 'available') as available_properties,
    (select count(*) from public.executives where is_active) as active_executives;
$$;

grant execute on function public.estate_public_stats() to anon, authenticated;
