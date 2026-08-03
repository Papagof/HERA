-- Toll payments are recorded by typing the payer's name directly rather than
-- picking a resident/landlord from the directory (unlike every other
-- category) - store that free-text name separately from resident_name /
-- landlord_name so it's clear it isn't a directory-linked record.
alter table public.payments add column payer_name text;
