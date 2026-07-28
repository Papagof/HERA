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
  - `app/login/` — public login page
  - `app/listings/` — public-facing property listings + inquiry form (no auth)
- `lib/supabase/` — `client.ts` (browser), `server.ts` (Server Components/Actions), `proxy.ts` (session refresh, used by root `proxy.ts`)
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

The Supabase project ("HERA", `eu-west-1`) already has the full schema and RLS policies applied. Sign up a user via the `/login` page's Supabase Auth flow, then promote them to `super_admin` directly in the database (there is no self-service role picker, by design):

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

Known gaps (by design, deferred from this pass):
- Photos/documents/receipts are plain URL text fields — no real file upload UI or Supabase Storage buckets yet.
- No PDF/Excel export for reports — in-app view only.
- No payment gateway integration (Paystack/Flutterwave/Stripe) — payments are recorded manually.
- No automated email/SMS reminders or notifications.

## Scripts

- `npm run dev` — dev server on :3000
- `npm run build` — production build (type-checks + lints)
- `npm run lint` — ESLint only
