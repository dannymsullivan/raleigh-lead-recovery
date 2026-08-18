alter table clients
  add column if not exists alert_sms_consent_at timestamptz,
  add column if not exists alert_sms_consent_phone text;

create table if not exists messaging_consents (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,
  user_id uuid,
  phone_e164 text not null,
  purpose text not null check (purpose in ('verification', 'lead_alerts')),
  consent_version text not null,
  consent_text text not null,
  source text not null,
  consented_at timestamptz not null default now(),
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  unique(user_id, phone_e164, purpose, consent_version)
);

create index if not exists messaging_consents_client_phone_idx on messaging_consents(client_id, phone_e164);
create index if not exists messaging_consents_user_phone_idx on messaging_consents(user_id, phone_e164);

alter table messaging_consents enable row level security;

comment on table messaging_consents is 'Server-managed proof of consent for Raleigh Lead Recovery transactional SMS programs.';
comment on column messaging_consents.consent_text is 'Exact disclosure accepted or acted upon by the recipient.';
