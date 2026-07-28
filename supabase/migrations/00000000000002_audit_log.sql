-- Audit trail: "all financial entries should be traceable to a user and
-- timestamp" / "log of who created/edited/deleted records and when" (spec).
-- A generic trigger on every records/financial table logs every write to a
-- single append-only table, independent of which code path made the change.

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  table_name text not null,
  record_id uuid,
  action text not null check (action in ('INSERT', 'UPDATE', 'DELETE')),
  changed_by uuid references public.profiles (id) on delete set null,
  changed_at timestamptz not null default now(),
  old_data jsonb,
  new_data jsonb
);

create index idx_audit_log_table_record on public.audit_log (table_name, record_id);
create index idx_audit_log_changed_at on public.audit_log (changed_at desc);

create function public.log_audit_event()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.audit_log (table_name, record_id, action, changed_by, old_data, new_data)
  values (
    TG_TABLE_NAME,
    case when TG_OP = 'DELETE' then old.id else new.id end,
    TG_OP,
    auth.uid(),
    case when TG_OP in ('UPDATE', 'DELETE') then to_jsonb(old) else null end,
    case when TG_OP in ('INSERT', 'UPDATE') then to_jsonb(new) else null end
  );
  return coalesce(new, old);
end;
$$;

-- Attach to every records/financial table - profiles included, since role
-- changes (who promoted whom) are security-sensitive and worth tracing.
-- Excludes occupancy_history (itself a derived historical log) and
-- listing_inquiries (public-submitted, not an admin-edited record).
do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles', 'properties', 'landlords', 'residents',
    'service_charge_structures', 'invoices', 'payments',
    'property_listings', 'executives', 'income_expenditure_entries',
    'monthly_reports'
  ]
  loop
    execute format(
      'create trigger audit_%1$s after insert or update or delete on public.%1$s
       for each row execute function public.log_audit_event()',
      t
    );
  end loop;
end $$;

alter table public.audit_log enable row level security;

-- Read-only for staff/past-executives; no insert/update/delete policy at all -
-- the only writer is log_audit_event(), a SECURITY DEFINER function, which
-- bypasses RLS as the table owner regardless of the calling role's grants.
create policy "audit_log_select_staff" on public.audit_log
  for select using ((select public.current_user_role()) in ('super_admin', 'executive_current', 'executive_past'));
