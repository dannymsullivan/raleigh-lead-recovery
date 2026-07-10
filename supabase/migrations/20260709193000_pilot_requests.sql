create table pilot_requests (
  id uuid primary key default gen_random_uuid(),
  business_name text not null,
  owner_name text not null,
  owner_phone text not null,
  owner_email text,
  website text,
  service_area text not null default 'Raleigh',
  weekly_missed_calls text,
  current_after_hours text,
  notes text,
  source text not null default 'landing_page',
  created_at timestamptz not null default now()
);

create index pilot_requests_created_at_idx on pilot_requests(created_at desc);

alter table pilot_requests enable row level security;
