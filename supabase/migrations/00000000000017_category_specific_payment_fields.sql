-- Categories are structurally different, not just labels:
-- - Service Charge: tied to the resident's apartment, always monthly.
-- - Development Levy: landlord-only, one-off, sized by number of plots
--   (half-plot is the smallest unit) at a per-plot rate.
-- - Toll: daily.
-- - Donation/Others: ad hoc/random, no fixed schedule.
-- plot_count captures Development Levy's plot sizing; frequency's allowed
-- values widen to cover daily/one-off in addition to the existing periods.

alter table public.invoices add column plot_count numeric check (plot_count >= 0.5);
alter table public.payments add column plot_count numeric check (plot_count >= 0.5);

alter table public.service_charge_structures drop constraint service_charge_structures_frequency_check;
alter table public.service_charge_structures add constraint service_charge_structures_frequency_check
  check (frequency in ('monthly', 'bi_monthly', 'quarterly', 'half_yearly', 'yearly', 'annually', 'daily', 'one_off'));
