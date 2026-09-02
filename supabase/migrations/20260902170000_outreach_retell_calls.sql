alter table outreach_prospects
  drop constraint if exists outreach_prospects_last_call_outcome_check;

alter table outreach_prospects
  add constraint outreach_prospects_last_call_outcome_check
  check (last_call_outcome in (
    'real_person',
    'interested',
    'follow_up',
    'not_interested',
    'do_not_call',
    'voicemail',
    'no_answer',
    'busy',
    'wrong_number',
    'failed'
  )),
  add column last_retell_call_id text,
  add column potential_customer text
    check (potential_customer in ('yes', 'maybe', 'no')),
  add column last_call_summary text,
  add column call_in_progress_at timestamptz,
  add column do_not_call_at timestamptz,
  add column automated_call_attempt_count integer not null default 0
    check (automated_call_attempt_count >= 0);

create table outreach_call_attempts (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null references outreach_prospects(id) on delete cascade,
  retell_call_id text unique,
  status text not null default 'queued'
    check (status in ('queued', 'in_progress', 'completed', 'failed')),
  outcome text
    check (outcome in (
      'interested',
      'follow_up',
      'not_interested',
      'do_not_call',
      'voicemail',
      'no_answer',
      'busy',
      'wrong_number',
      'failed'
    )),
  potential_customer text
    check (potential_customer in ('yes', 'maybe', 'no')),
  contact_name text,
  contact_role text,
  interest_reason text,
  objection text,
  requested_follow_up text,
  summary text,
  transcript text,
  recording_url text,
  duration_seconds integer,
  structured_data jsonb,
  raw_payload jsonb,
  error text,
  eligibility_attested_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index outreach_call_attempts_prospect_idx
  on outreach_call_attempts(prospect_id, created_at desc);

create trigger outreach_call_attempts_set_updated_at
before update on outreach_call_attempts
for each row execute function set_updated_at();

alter table outreach_call_attempts enable row level security;
