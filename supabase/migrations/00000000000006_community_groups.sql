-- WhatsApp community links: three fixed groups (executive-only, landlords-only,
-- estate-wide) whose invite links a super_admin can set/update from the app,
-- with visibility of each link scoped by role via RLS rather than in app code
-- alone, so the executive-only link is never queryable by a resident session.

create table public.community_groups (
  id uuid primary key default gen_random_uuid(),
  key text unique not null check (key in ('executive', 'landlords', 'estate_wide')),
  label text not null,
  invite_url text,
  created_at timestamptz not null default now()
);

insert into public.community_groups (key, label) values
  ('executive', 'Executive Committee'),
  ('landlords', 'Landlords'),
  ('estate_wide', 'Estate Community (Executives, Landlords & Residents)');

alter table public.community_groups enable row level security;

create policy "community_groups_select" on public.community_groups
  for select using (
    case key
      when 'executive' then (select public.current_user_role()) in ('super_admin', 'executive_current')
      when 'landlords' then (select public.current_user_role()) in ('super_admin', 'executive_current', 'landlord')
      when 'estate_wide' then (select public.current_user_role()) is not null
      else false
    end
  );

create policy "community_groups_insert_super_admin" on public.community_groups
  for insert with check ((select public.current_user_role()) = 'super_admin');

create policy "community_groups_update_super_admin" on public.community_groups
  for update using ((select public.current_user_role()) = 'super_admin');

create policy "community_groups_delete_super_admin" on public.community_groups
  for delete using ((select public.current_user_role()) = 'super_admin');

create trigger audit_community_groups after insert or update or delete on public.community_groups
  for each row execute function public.log_audit_event();
