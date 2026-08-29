create table outreach_prospects (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  website text,
  city text,
  contact_name text,
  contact_role text,
  email text,
  phone text,
  stage text not null default 'not_contacted'
    check (stage in ('not_contacted', 'email_sent', 'replied', 'call_scheduled', 'pilot_booked', 'not_interested')),
  last_contacted_on date,
  next_follow_up_on date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index outreach_prospects_stage_idx on outreach_prospects(stage);
create index outreach_prospects_follow_up_idx on outreach_prospects(next_follow_up_on);

create trigger outreach_prospects_set_updated_at
before update on outreach_prospects
for each row execute function set_updated_at();

alter table outreach_prospects enable row level security;
