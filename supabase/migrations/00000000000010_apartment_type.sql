-- "Different apartments pay different service charges" - a new dimension
-- (apartment_type) separate from the existing "type" (occupied/rent/sale/both,
-- which stays as-is per the user's choice), so service charge structures can
-- target real dwelling categories instead of market status.

alter table public.properties add column apartment_type text
  check (apartment_type in ('Duplex', '3 Bedroom Flat', '2 Bedroom Flat', 'Mini Flat', 'A Room Self', 'Others'));

alter table public.service_charge_structures add column applies_to_apartment_type text
  check (applies_to_apartment_type in ('Duplex', '3 Bedroom Flat', '2 Bedroom Flat', 'Mini Flat', 'A Room Self', 'Others'));
