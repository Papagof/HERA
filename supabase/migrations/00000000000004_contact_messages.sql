-- Public contact form submissions (mirrors the listing_inquiries pattern:
-- anyone can insert, only staff can read).
create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text,
  message text not null,
  created_at timestamptz not null default now()
);

alter table public.contact_messages enable row level security;

create policy "contact_messages_insert_anyone" on public.contact_messages
  for insert with check (true);

create policy "contact_messages_select_staff" on public.contact_messages
  for select using ((select public.current_user_role()) in ('super_admin', 'executive_current'));
