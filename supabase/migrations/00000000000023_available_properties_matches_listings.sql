-- The homepage's "Available Properties" stat linked to /listings, but was
-- counting properties.status = 'available' (a Directory occupancy field)
-- instead of published property_listings rows (what /listings actually
-- shows) - the two counts drift apart whenever a property is marked
-- available in the Directory before a public listing is created for it.
create or replace function public.estate_public_stats()
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
    (select count(*) from public.property_listings where is_published) as available_properties,
    (select count(*) from public.executives where is_active) as active_executives;
$$;
