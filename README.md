# HERA — Estate Management

A web app for managing residents/landlords, properties, service charges, executive committee records, income/expenditure, and monthly reporting for a residential estate.

Built with [Next.js 16](https://nextjs.org) (App Router), TypeScript, Tailwind CSS v4, and [Supabase](https://supabase.com) (Postgres, Auth, Row Level Security).

See [CLAUDE.md](CLAUDE.md) for the full project spec and [AGENTS.md](AGENTS.md) for the Next.js 16 note (`middleware.ts` → `proxy.ts`).

## Project structure

- `app/` — pages and layouts (App Router)
  - `app/(app)/` — authenticated shell, one folder per module:
    - `dashboard/` — overview cards (counts + financials for staff/accountant)
    - `directory/` — Resident & Landlord Directory
    - `service-charges/` — charge structures, invoice generation, payments
    - `property-listings/` — staff-side listing management + inquiries received
    - `executives/` — Executive Committee Records
    - `income-expenditure/` — income/expenditure entries + running balance
    - `reports/` — monthly report generation/archive
    - `account/` — change password (any signed-in user)
    - `users/` — invite/remove accounts, assign roles (`super_admin` only)
    - `audit-log/` — who created/edited/deleted what, and when (`super_admin`/`executive_current`/`executive_past`)
  - `app/login/` — public login page
  - `app/listings/` — public-facing property listings + inquiry form (no auth)
- `lib/supabase/` — `client.ts` (browser), `server.ts` (Server Components/Actions), `proxy.ts` (session refresh, used by root `proxy.ts`), `admin.ts` (service-role client, `super_admin`-gated Server Actions only)
- `lib/auth.ts` — `getCurrentProfile()` / `requireProfile()` / `isStaff()`
- `lib/types/database.ts` — generated Supabase types (regenerate after schema changes)
- `components/ui/` — shared design system primitives (Button, Card, Input, Select, Textarea, Badge)
- `supabase/migrations/` — SQL schema, kept in-repo for reference (applied to the live project via Supabase MCP tools, not the Supabase CLI)
- `proxy.ts` — session refresh + auth redirects, runs on every request (`/login` bounces a signed-in user to `/dashboard`; `/listings` is public either way; everything else requires a session)

## Setup

```sh
npm install
cp .env.local.example .env.local   # fill in NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY
npm run dev                        # http://localhost:3000
```

The Supabase project ("HERA", `eu-west-1`) already has the full schema and RLS policies applied. For `/users` (invite/remove accounts) you also need the project's `service_role` secret key (Project Settings → API) as `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` — server-only, never `NEXT_PUBLIC_`, bypasses RLS. Without it, every other page still works; `/users` just shows a clear error instead of inviting/removing.

To bootstrap the very first account (before `/users` exists to invite anyone), sign up via the `/login` page's Supabase Auth flow, then promote directly in the database:

```sql
update public.profiles set role = 'super_admin' where id = '<user-id>';
```

## Roles

`super_admin`, `executive_current`, `executive_past`, `landlord`, `resident`, `accountant` — see the `app_role` enum and RLS policies in `supabase/migrations/`. Every new `auth.users` row gets a `profiles` row automatically (defaulting to `resident`) via the `handle_new_user` trigger.

## Status

All 6 modules have working CRUD UIs:

1. **Resident & Landlord Directory** — searchable/filterable list, property/landlord/resident CRUD, move-out → occupancy history.
2. **Service Charge Management** — charge structures, bulk invoice generation per structure/due-date, payment recording (unpaid/partial/paid).
3. **Property Listings** — staff management (`/property-listings`) + a public marketing page (`/listings`, no auth) with an inquiry form.
4. **Executive Committee Records** — current/past committee, tenure dates, handover documents.
5. **Income & Expenditure Management** — categorized entries, running income/expenditure/balance totals (also feeds the dashboard's financial cards).
6. **Monthly Reporting** — generates a report per month from Service Charges + Income & Expenditure data, editable summary, publish toggle (published reports are visible to landlords/residents).

Plus account/access management:
- **Account** (`/account`) — any signed-in user can change their own password.
- **Users** (`/users`, `super_admin` only) — invite new accounts by email (Supabase Auth sends the invite; passwords are self-set), assign/change roles, remove accounts.
- **Audit Log** (`/audit-log`, `super_admin`/`executive_current`/`executive_past`) — every insert/update/delete on every records/financial table, with who and when, via a DB-level trigger (`audit_log` table + `log_audit_event()`), so it can't be bypassed by a code path that forgets to log something.

Robustness work done in this pass:
- Git repo initialized and pushed to `https://github.com/Papagof/HERA`.
- Fixed a privilege-escalation gap: `executive_current` could previously change any profile's role, including granting `super_admin`. Now only `super_admin` can manage accounts/roles.
- Added covering indexes for 14 previously-unindexed foreign keys; rewrote RLS policies to wrap `auth.uid()`/`current_user_role()` calls in `(select ...)` so Postgres evaluates them once per query instead of once per row; consolidated `profiles`' overlapping policies.

Known gaps (by design, deferred from this pass):
- Photos/documents/receipts are plain URL text fields — no real file upload UI or Supabase Storage buckets yet.
- No PDF/Excel export for reports — in-app view only.
- No payment gateway integration (Paystack/Flutterwave/Stripe) — payments are recorded manually.
- No automated email/SMS reminders or notifications.

## Scripts

- `npm run dev` — dev server on :3000
- `npm run build` — production build (type-checks + lints)
- `npm run lint` — ESLint only
