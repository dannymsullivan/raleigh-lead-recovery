create extension if not exists pgcrypto;

create table clients (
  id uuid primary key default gen_random_uuid(),
  business_name text not null,
  trade text not null,
  owner_name text not null,
  owner_phone text not null,
  owner_email text,
  pilot_start date not null,
  pilot_end date not null,
  avg_job_value numeric not null default 500,
  close_rate numeric not null default 0.4,
  vapi_assistant_id text,
  vapi_phone_number_id text,
  created_at timestamptz not null default now()
);

create table calls (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  vapi_call_id text not null unique,
  caller_number text,
  caller_name text,
  callback_number text,
  service_address text,
  issue_description text,
  urgency text not null default 'other',
  lead_type text not null default 'other',
  estimated_value_band text not null default 'unknown',
  requested_timing text,
  callback_promised_by text,
  summary text,
  transcript text,
  recording_url text,
  duration_seconds int,
  raw_payload jsonb,
  sms_sent_at timestamptz,
  sms_send_in_progress_at timestamptz,
  sms_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index calls_client_created_at_idx on calls(client_id, created_at desc);
create index clients_vapi_assistant_id_idx on clients(vapi_assistant_id);
create index clients_vapi_phone_number_id_idx on clients(vapi_phone_number_id);
create index calls_sms_retry_idx on calls(vapi_call_id, sms_sent_at, sms_send_in_progress_at);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger calls_set_updated_at
before update on calls
for each row
execute function set_updated_at();

alter table clients enable row level security;
alter table calls enable row level security;
