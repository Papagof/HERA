-- HERA initial schema: profiles/roles, directory (module 1), and stub tables for modules 2-6.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Roles & profiles
-- ---------------------------------------------------------------------------

create type public.app_role as enum (
  'super_admin',
  'executive_current',
  'executive_past',
  'landlord',
  'resident',
  'accountant'
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone text,
  role public.app_role not null default 'resident',
  created_at timestamptz not null default now()
);

-- Auto-create a profile row whenever a new auth user signs up.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Reads the caller's role without recursive RLS lookups (security definer).
create function public.current_user_role()
returns public.app_role
language sql
security definer set search_path = public
stable
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- ---------------------------------------------------------------------------
-- Module 1: Resident & Landlord Directory
-- ---------------------------------------------------------------------------

create type public.property_type as enum ('rent', 'sale', 'occupied', 'both');

create table public.properties (
  id uuid primary key default gen_random_uuid(),
  street_name text not null,
  house_number text not null,
  block text,
  type public.property_type not null default 'occupied',
  status text not null default 'available' check (status in ('available', 'occupied', 'rented', 'sold')),
  created_at timestamptz not null default now(),
  unique (street_name, house_number)
);

create table public.landlords (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles (id) on delete set null,
  property_id uuid not null references public.properties (id) on delete cascade,
  full_name text not null,
  phone text,
  email text,
  id_document_url text,
  ownership_proof_url text,
  created_at timestamptz not null default now()
);

create type public.resident_relationship as enum ('owner-occupier', 'tenant', 'family');

create table public.residents (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles (id) on delete set null,
  property_id uuid not null references public.properties (id) on delete cascade,
  full_name text not null,
  phone text,
  email text,
  relationship public.resident_relationship not null default 'tenant',
  move_in_date date,
  move_out_date date,
  created_at timestamptz not null default now()
);

-- Past-occupants log per unit; populated when a resident moves out.
create table public.occupancy_history (
  id uuid primary key default gen_random_uuid(),
  resident_id uuid not null references public.residents (id) on delete cascade,
  property_id uuid not null references public.properties (id) on delete cascade,
  full_name text not null,
  relationship public.resident_relationship not null,
  start_date date,
  end_date date not null default current_date,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Stub tables for modules 2-6 (schema only this pass, no UI yet)
-- ---------------------------------------------------------------------------

-- Module 2: Service Charge Management
create table public.service_charge_structures (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  amount numeric not null,
  frequency text not null default 'monthly' check (frequency in ('monthly', 'quarterly', 'annually')),
  applies_to_property_type public.property_type,
  created_at timestamptz not null default now()
);

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  structure_id uuid references public.service_charge_structures (id) on delete set null,
  amount numeric not null,
  due_date date not null,
  status text not null default 'unpaid' check (status in ('unpaid', 'paid', 'overdue', 'partial')),
  created_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid references public.invoices (id) on delete set null,
  property_id uuid references public.properties (id) on delete set null,
  amount numeric not null,
  method text not null default 'bank_transfer',
  reference text unique,
  paid_at timestamptz not null default now()
);

-- Module 3: Property Listings (public rent/sale marketing beyond the internal `properties` row)
create table public.property_listings (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  listing_type text not null check (listing_type in ('rent', 'sale')),
  price numeric,
  size text,
  description text,
  image_urls text[] not null default '{}',
  contact_name text,
  contact_phone text,
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.listing_inquiries (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.property_listings (id) on delete cascade,
  name text not null,
  email text not null,
  phone text,
  message text,
  created_at timestamptz not null default now()
);

-- Module 4: Executive Committee Records
create table public.executives (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles (id) on delete set null,
  full_name text not null,
  position text not null,
  phone text,
  photo_url text,
  tenure_start date not null,
  tenure_end date,
  handover_document_url text,
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- Module 5: Income & Expenditure Management
create table public.income_expenditure_entries (
  id uuid primary key default gen_random_uuid(),
  entry_type text not null check (entry_type in ('income', 'expenditure')),
  category text not null,
  description text,
  amount numeric not null,
  receipt_url text,
  entry_date date not null default current_date,
  recorded_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

-- Module 6: Monthly Reporting
create table public.monthly_reports (
  id uuid primary key default gen_random_uuid(),
  report_month date not null unique,
  total_collected numeric not null default 0,
  total_outstanding numeric not null default 0,
  total_income numeric not null default 0,
  total_expenditure numeric not null default 0,
  summary text,
  file_url text,
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.properties enable row level security;
alter table public.landlords enable row level security;
alter table public.residents enable row level security;
alter table public.occupancy_history enable row level security;
alter table public.service_charge_structures enable row level security;
alter table public.invoices enable row level security;
alter table public.payments enable row level security;
alter table public.property_listings enable row level security;
alter table public.listing_inquiries enable row level security;
alter table public.executives enable row level security;
alter table public.income_expenditure_entries enable row level security;
alter table public.monthly_reports enable row level security;

-- profiles: users see/update their own row; staff roles see everyone
create policy "profiles_select_own_or_staff" on public.profiles
  for select using (
    id = auth.uid()
    or public.current_user_role() in ('super_admin', 'executive_current', 'executive_past', 'accountant')
  );

create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid());

-- Only super_admin manages accounts/roles - executive_current's remit is
-- residents/service-charges/properties/income, not user management. Letting
-- executive_current update any profile's role would let them grant
-- super_admin to themselves or anyone else.
create policy "profiles_manage_super_admin_only" on public.profiles
  for all using (public.current_user_role() = 'super_admin');

-- properties: staff full access, everyone else read-only
create policy "properties_select_all" on public.properties
  for select using (true);

create policy "properties_write_staff" on public.properties
  for insert with check (public.current_user_role() in ('super_admin', 'executive_current'));

create policy "properties_update_staff" on public.properties
  for update using (public.current_user_role() in ('super_admin', 'executive_current'));

create policy "properties_delete_staff" on public.properties
  for delete using (public.current_user_role() in ('super_admin', 'executive_current'));

-- landlords: staff full read-write, past-executives read-only, landlord reads own row
create policy "landlords_select" on public.landlords
  for select using (
    public.current_user_role() in ('super_admin', 'executive_current', 'executive_past')
    or profile_id = auth.uid()
  );

create policy "landlords_write_staff" on public.landlords
  for insert with check (public.current_user_role() in ('super_admin', 'executive_current'));

create policy "landlords_update_staff" on public.landlords
  for update using (public.current_user_role() in ('super_admin', 'executive_current'));

create policy "landlords_delete_staff" on public.landlords
  for delete using (public.current_user_role() in ('super_admin', 'executive_current'));

-- residents: staff full read-write, past-executives read-only, resident reads own row
create policy "residents_select" on public.residents
  for select using (
    public.current_user_role() in ('super_admin', 'executive_current', 'executive_past')
    or profile_id = auth.uid()
  );

create policy "residents_write_staff" on public.residents
  for insert with check (public.current_user_role() in ('super_admin', 'executive_current'));

create policy "residents_update_staff" on public.residents
  for update using (public.current_user_role() in ('super_admin', 'executive_current'));

create policy "residents_delete_staff" on public.residents
  for delete using (public.current_user_role() in ('super_admin', 'executive_current'));

-- occupancy_history: staff read, staff write (system-inserted on move-out)
create policy "occupancy_history_select_staff" on public.occupancy_history
  for select using (public.current_user_role() in ('super_admin', 'executive_current', 'executive_past'));

create policy "occupancy_history_write_staff" on public.occupancy_history
  for insert with check (public.current_user_role() in ('super_admin', 'executive_current'));

-- Modules 2-6 stub tables: staff-only for now (no dedicated UI yet this pass)
create policy "service_charge_structures_staff" on public.service_charge_structures
  for all using (public.current_user_role() in ('super_admin', 'executive_current', 'accountant'));

create policy "invoices_staff" on public.invoices
  for all using (public.current_user_role() in ('super_admin', 'executive_current', 'accountant'));

create policy "payments_staff" on public.payments
  for all using (public.current_user_role() in ('super_admin', 'executive_current', 'accountant'));

create policy "property_listings_select_published" on public.property_listings
  for select using (is_published or public.current_user_role() in ('super_admin', 'executive_current'));

create policy "property_listings_write_staff" on public.property_listings
  for insert with check (public.current_user_role() in ('super_admin', 'executive_current'));

create policy "property_listings_update_staff" on public.property_listings
  for update using (public.current_user_role() in ('super_admin', 'executive_current'));

create policy "property_listings_delete_staff" on public.property_listings
  for delete using (public.current_user_role() in ('super_admin', 'executive_current'));

create policy "listing_inquiries_insert_anyone" on public.listing_inquiries
  for insert with check (true);

create policy "listing_inquiries_select_staff" on public.listing_inquiries
  for select using (public.current_user_role() in ('super_admin', 'executive_current'));

create policy "executives_select_all" on public.executives
  for select using (true);

create policy "executives_write_staff" on public.executives
  for insert with check (public.current_user_role() in ('super_admin', 'executive_current'));

create policy "executives_update_staff" on public.executives
  for update using (public.current_user_role() in ('super_admin', 'executive_current'));

create policy "executives_delete_staff" on public.executives
  for delete using (public.current_user_role() in ('super_admin', 'executive_current'));

create policy "income_expenditure_staff" on public.income_expenditure_entries
  for all using (public.current_user_role() in ('super_admin', 'executive_current', 'accountant'));

create policy "monthly_reports_select_published_or_staff" on public.monthly_reports
  for select using (is_published or public.current_user_role() in ('super_admin', 'executive_current', 'accountant'));

create policy "monthly_reports_write_staff" on public.monthly_reports
  for insert with check (public.current_user_role() in ('super_admin', 'executive_current', 'accountant'));

create policy "monthly_reports_update_staff" on public.monthly_reports
  for update using (public.current_user_role() in ('super_admin', 'executive_current', 'accountant'));
