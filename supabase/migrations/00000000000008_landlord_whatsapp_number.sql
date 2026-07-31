-- Same rationale as residents (migration 00000000000007): a dedicated
-- WhatsApp number so staff can send landlords a one-tap group invite link.
alter table public.landlords add column whatsapp_number text;
