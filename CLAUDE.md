@AGENTS.md

# HERA — Estate Management Web Application

## Project Overview
HERA is a fully automated web application for managing the day-to-day administration of a residential estate. It is the single source of truth for residents, landlords, properties, estate finances, executive committee history, and reporting.

## Status
All 6 modules have working UIs, plus account/access management and an audit trail. Next.js 16 (App Router, TypeScript, Tailwind CSS v4), Supabase project "HERA" (`ixiesjahzyfxtqmxxkbe`, eu-west-1) with full schema + RLS, Supabase Auth (login, session refresh via `proxy.ts`, auto-created `profiles` row per signup), role-aware dashboard with live financial cards. Git repo at `https://github.com/Papagof/HERA`.

- **Directory, Service Charges, Property Listings, Executives, Income & Expenditure, Reports** — all fully working CRUD, built directly against the schema below.
- **Account, Users, Audit Log** — password self-service, `super_admin`-only invite/role/remove (needs `SUPABASE_SERVICE_ROLE_KEY`, see README), and a DB-trigger-backed audit trail on every records/financial table.
- RLS policies wrap `auth.uid()`/`current_user_role()` in `(select ...)` for per-query (not per-row) evaluation; all FKs are indexed; `profiles` policies are one-per-action (no overlapping permissive policies).
- Photos/documents/receipts use plain URL text fields, not real file upload widgets (no Supabase Storage buckets wired up yet).
- Monthly report export is an in-app view only — no PDF/Excel generation yet.
- No payment gateway (Paystack/Flutterwave/Stripe) integration — payments are recorded manually.
- No automated reminders/notifications (email/SMS) yet.
- No automated tests or CI yet.

See `README.md` for setup and `AGENTS.md`/`node_modules/next/dist/docs/.../proxy.md` for the Next.js 16 `proxy.ts` (formerly `middleware.ts`) convention. Update this section as the items above get built out.

## Stack
- **Frontend/Backend**: Next.js 16 (App Router), TypeScript, Tailwind CSS v4 — single app, no separate backend service
- **Database/Auth/Storage**: Supabase (Postgres, Supabase Auth, Row Level Security, Storage for documents/images)
- **Note**: Next.js 16 renamed `middleware.ts` → `proxy.ts` (function `proxy`, not `middleware`) — see `AGENTS.md` / `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`. Don't write a `middleware.ts` file for this project.

---

## User Roles & Permissions
| Role | Access |
|---|---|
| **Super Admin** | Full access — manage all modules, users, and settings |
| **Executive (current)** | Manage residents, service charges, properties, income/expenditure, generate reports |
| **Executive (past)** | Read-only access to historical records from their tenure |
| **Landlord** | View their own property/unit details, service charge history, payment status |
| **Resident/Tenant** | View personal profile, service charge invoices, payment history |
| **Accountant/Treasurer** (optional) | Manage income/expenditure entries, generate financial reports |

---

## Core Modules

### 1. Resident & Landlord Directory
- Register and maintain records for every residence (house/unit number, block/street, occupancy status)
- Store landlord details: name, contact info, ID/verification documents, ownership proof
- Link landlords to properties and current tenants
- Track resident details: name, contact info, move-in date, relationship to property (owner-occupier, tenant, family member)
- Searchable/filterable directory (by street, status, landlord name, etc.)
- History log of past occupants per unit

### 2. Service Charge Management
- Define service charge structure (fixed, or per property type/size)
- Auto-generate invoices on a schedule (monthly/quarterly/annually)
- Record payments (manual entry and/or payment gateway — Paystack/Flutterwave/Stripe depending on region)
- Track balances, arrears, and payment history per resident/landlord
- Automated reminders/notifications for upcoming or overdue payments
- Downloadable receipts and statements

### 3. Property Listings (For Rent / For Sale)
- CRUD for available properties within the estate
- Fields: type, size, price, images, description, availability status, contact person
- Public-facing listing page (separate from admin-only resident data)
- Inquiry/contact form for prospective tenants or buyers
- Mark properties as "Rented," "Sold," or "Available"

### 4. Executive Committee Records
- Records of all executive committee members — current and past
- Fields: name, position (Chairman, Secretary, Treasurer, etc.), tenure start/end date, contact info, photo
- Archive of past executives with tenure history
- Optional: handover notes/documents between outgoing and incoming executives

### 5. Income & Expenditure Management
- Log income sources (service charges, donations, fines, miscellaneous levies)
- Log expenditures (security, maintenance, waste management, utilities, projects) with categories
- Attach receipts/invoices as proof of expenditure
- Real-time balance/summary dashboard (total income, total expenditure, net balance)
- Budget vs. actual comparison (optional)

### 6. Monthly Reporting
- Auto-generate a monthly report: service charges collected vs. outstanding, income/expenditure breakdown, fund disbursement details (what/who approved), key activities/decisions
- Exportable as PDF/Excel
- Option to publish reports to residents/landlords (view-only) for transparency
- Historical archive of all past monthly reports, searchable by month/year

---

## Additional Recommended Features
- **Dashboard**: overview cards (total residents, total properties, outstanding payments, current balance)
- **Notifications**: email/SMS alerts for payment due dates, new reports, announcements
- **Announcements/Notice board**: estate-wide communication
- **Document storage**: meeting minutes, estate bylaws, handover documents
- **Audit trail**: log of who created/edited/deleted records and when
- **Role-based authentication**: secure login with password reset, optional 2FA

---

## Non-Functional Requirements
- **Security**: encrypted passwords, role-based access control, secure handling of financial and personal data
- **Responsiveness**: fully usable on mobile and desktop
- **Scalability**: handle growth in residents/properties without redesign
- **Data backup**: automated regular backups of financial and resident data
- **Audit-friendly**: all financial entries traceable to a user and timestamp

---

## Deliverables Expected
1. Fully functional web application matching the modules above
2. Admin panel for executives to manage all records
3. Resident/landlord-facing portal (view-only, self-service where applicable)
4. Public property listings page
5. Automated monthly report generation and archive
6. Basic user documentation/guide for estate executives

---

## Related, unrelated project (do not touch)
`c:\Users\Papagof\Happyland Estate` is a **separate, unrelated** estate's app (different Supabase project, live production data). It was consulted only as a schema/pattern reference during HERA's initial scaffold — HERA does not share code, data, or its Supabase project with it.
