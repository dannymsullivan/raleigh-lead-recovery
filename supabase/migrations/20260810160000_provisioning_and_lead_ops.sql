alter table clients
  add column if not exists provisioning_status text not null default 'pending',
  add column if not exists provisioning_error text,
  add column if not exists provisioned_phone_number text,
  add column if not exists number_provider text,
  add column if not exists last_provision_attempt_at timestamptz,
  add column if not exists forwarding_completed_at timestamptz,
  add column if not exists test_call_completed_at timestamptz;

alter table clients
  add constraint clients_provisioning_status_check
  check (provisioning_status in ('pending', 'provisioning', 'ready', 'needs_configuration', 'error'));

alter table calls
  add column if not exists lead_status text not null default 'new',
  add column if not exists owner_notes text,
  add column if not exists callback_completed_at timestamptz,
  add column if not exists booked_value numeric;

alter table calls
  add constraint calls_lead_status_check
  check (lead_status in ('new', 'contacted', 'booked', 'lost', 'spam'));

create index if not exists calls_client_lead_status_idx
  on calls(client_id, lead_status, created_at desc);

comment on column clients.provisioning_status is 'Idempotent assistant and phone-number provisioning lifecycle.';
comment on column calls.lead_status is 'Owner-managed follow-up status for the captured opportunity.';
