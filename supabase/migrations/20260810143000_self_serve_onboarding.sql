alter table clients
  add column if not exists service_area text,
  add column if not exists business_description text,
  add column if not exists services text[] not null default '{}',
  add column if not exists business_hours jsonb not null default '{}'::jsonb,
  add column if not exists timezone text not null default 'America/New_York',
  add column if not exists emergency_rules text,
  add column if not exists callback_window text not null default 'Within 15 minutes for emergencies; within 2 hours otherwise',
  add column if not exists alert_phone text,
  add column if not exists onboarding_completed_at timestamptz,
  add column if not exists trial_started_at timestamptz,
  add column if not exists trial_ends_at timestamptz,
  add column if not exists account_status text not null default 'onboarding';

alter table clients
  add constraint clients_account_status_check
  check (account_status in ('onboarding', 'trialing', 'active', 'past_due', 'canceled'));

comment on column clients.business_hours is 'Weekly hours keyed by lowercase weekday with closed, open, and close values.';
comment on column clients.account_status is 'Customer lifecycle state for onboarding, trial, and billing.';
