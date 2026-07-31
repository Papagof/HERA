-- WhatsApp number per resident, separate from the general contact phone,
-- so staff can send them a one-tap invite to the estate WhatsApp group
-- (via a wa.me deep link built from this number + the group's invite URL).
alter table public.residents add column whatsapp_number text;
