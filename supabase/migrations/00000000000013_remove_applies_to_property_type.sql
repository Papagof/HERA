-- No longer used: invoice generation now happens via direct payment
-- recording (migration 00000000000012), which doesn't filter by this field,
-- and apartment_type already covers "which units this structure is for."
alter table public.service_charge_structures drop column applies_to_property_type;
