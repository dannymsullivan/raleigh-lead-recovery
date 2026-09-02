create table outreach_suppression_entries (
  phone_e164 text primary key,
  reason text not null default 'opt_out',
  source_prospect_id uuid references outreach_prospects(id) on delete set null,
  source_retell_call_id text,
  created_at timestamptz not null default now()
);

alter table outreach_suppression_entries enable row level security;
