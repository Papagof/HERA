-- A stored, auto-maintained resident count per property (rather than
-- computing it on every read), kept in sync by a trigger on residents
-- insert/delete - move-out deletes the residents row (see moveOutResident
-- in app/(app)/directory/actions.ts), so DELETE is the correct decrement point.

alter table public.properties add column resident_count integer not null default 0;

update public.properties p
set resident_count = (select count(*) from public.residents r where r.property_id = p.id);

create function public.sync_property_resident_count()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if TG_OP = 'INSERT' then
    update public.properties set resident_count = resident_count + 1 where id = new.property_id;
  elsif TG_OP = 'DELETE' then
    update public.properties set resident_count = greatest(resident_count - 1, 0) where id = old.property_id;
  end if;
  return coalesce(new, old);
end;
$$;

create trigger residents_sync_property_count
  after insert or delete on public.residents
  for each row execute function public.sync_property_resident_count();
