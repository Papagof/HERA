-- Aggregate counts only (no row-level data), safe to expose to anonymous
-- visitors on the public homepage - residents/landlords/properties tables
-- themselves stay RLS-restricted.
create function public.estate_public_stats()
returns table (
  resident_count bigint,
  available_properties bigint,
  active_executives bigint
)
language sql
security definer set search_path = public
stable
as $$
  select
    (select count(*) from public.residents) + (select count(*) from public.landlords) as resident_count,
    (select count(*) from public.properties where status = 'available') as available_properties,
    (select count(*) from public.executives where is_active) as active_executives;
$$;

grant execute on function public.estate_public_stats() to anon, authenticated;
