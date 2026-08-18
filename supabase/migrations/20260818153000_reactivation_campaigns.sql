alter table clients
  add column if not exists product_mode text not null default 'reactivation';

update clients
set product_mode = 'missed_call_recovery'
where vapi_assistant_id is not null;

alter table clients
  add constraint clients_product_mode_check
  check (product_mode in ('reactivation', 'missed_call_recovery'));

create table reactivation_campaigns (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  name text not null,
  status text not null default 'draft' check (status in ('draft', 'ready', 'running', 'paused', 'completed')),
  service_type text not null default 'general',
  calling_timezone text not null default 'America/New_York',
  calling_window_start time not null default '09:00',
  calling_window_end time not null default '18:00',
  max_attempts int not null default 2 check (max_attempts between 1 and 5),
  daily_limit int not null default 25 check (daily_limit between 1 and 500),
  eligibility_attested_at timestamptz,
  eligibility_attested_by uuid references auth.users(id) on delete set null,
  launched_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table suppression_entries (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  phone_e164 text not null,
  reason text not null default 'opt_out',
  source text not null default 'campaign',
  created_at timestamptz not null default now(),
  unique(client_id, phone_e164)
);

create table reactivation_contacts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  campaign_id uuid not null references reactivation_campaigns(id) on delete cascade,
  name text not null,
  phone_e164 text not null,
  email text,
  source text,
  lead_age_days int check (lead_age_days is null or lead_age_days >= 0),
  notes text,
  status text not null default 'queued' check (status in ('queued', 'calling', 'interested', 'follow_up', 'booked', 'contacted', 'not_interested', 'completed_project', 'wrong_number', 'do_not_call', 'no_answer', 'failed')),
  outcome text,
  project_type text,
  requested_timing text,
  qualification_notes text,
  next_step text,
  estimated_value numeric,
  attempt_count int not null default 0,
  last_attempt_at timestamptz,
  next_attempt_at timestamptz,
  owner_contacted_at timestamptz,
  booked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(campaign_id, phone_e164)
);

create table reactivation_attempts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  campaign_id uuid not null references reactivation_campaigns(id) on delete cascade,
  contact_id uuid not null references reactivation_contacts(id) on delete cascade,
  vapi_call_id text unique,
  status text not null default 'queued' check (status in ('queued', 'in_progress', 'completed', 'failed')),
  outcome text,
  summary text,
  transcript text,
  recording_url text,
  duration_seconds int,
  structured_data jsonb,
  raw_payload jsonb,
  error text,
  owner_alert_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table reactivation_appointments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  campaign_id uuid not null references reactivation_campaigns(id) on delete cascade,
  contact_id uuid not null references reactivation_contacts(id) on delete cascade,
  requested_window text,
  scheduled_for timestamptz,
  status text not null default 'requested' check (status in ('requested', 'confirmed', 'completed', 'canceled')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(contact_id)
);

create index reactivation_campaigns_client_idx on reactivation_campaigns(client_id, created_at desc);
create index reactivation_contacts_queue_idx on reactivation_contacts(campaign_id, status, next_attempt_at, created_at);
create index reactivation_contacts_priority_idx on reactivation_contacts(client_id, status, updated_at desc);
create index reactivation_attempts_contact_idx on reactivation_attempts(contact_id, created_at desc);
create index suppression_entries_client_phone_idx on suppression_entries(client_id, phone_e164);

create trigger reactivation_campaigns_set_updated_at before update on reactivation_campaigns for each row execute function set_updated_at();
create trigger reactivation_contacts_set_updated_at before update on reactivation_contacts for each row execute function set_updated_at();
create trigger reactivation_attempts_set_updated_at before update on reactivation_attempts for each row execute function set_updated_at();
create trigger reactivation_appointments_set_updated_at before update on reactivation_appointments for each row execute function set_updated_at();

alter table reactivation_campaigns enable row level security;
alter table reactivation_contacts enable row level security;
alter table reactivation_attempts enable row level security;
alter table reactivation_appointments enable row level security;
alter table suppression_entries enable row level security;
