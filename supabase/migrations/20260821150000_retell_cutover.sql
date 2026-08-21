-- Clean cutover from the test Vapi/Twilio implementation to Retell.
-- Telephony history was test-only; customer, campaign, and lead data is retained.

delete from calls;
delete from reactivation_attempts;
delete from public_demo_call_requests;

drop index if exists clients_vapi_assistant_id_idx;
drop index if exists clients_vapi_phone_number_id_idx;
drop index if exists customer_agents_vapi_assistant_idx;
drop index if exists calls_sms_retry_idx;

alter table clients
  drop column if exists vapi_assistant_id,
  drop column if exists vapi_phone_number_id;

alter table customer_agents
  drop column if exists vapi_assistant_id,
  drop column if exists vapi_phone_number_id,
  alter column voice_id set default 'retell-Cimo',
  add column retell_agent_id text,
  add column retell_llm_id text,
  add column retell_agent_version integer,
  add column retell_phone_number text;

create unique index customer_agents_retell_agent_idx
  on customer_agents(retell_agent_id)
  where retell_agent_id is not null;

alter table calls rename column vapi_call_id to retell_call_id;
alter table reactivation_attempts rename column vapi_call_id to retell_call_id;
alter table public_demo_call_requests rename column vapi_call_id to retell_call_id;

create index calls_sms_retry_idx
  on calls(retell_call_id, sms_sent_at, sms_send_in_progress_at);

update clients
set number_provider = null,
    provisioned_phone_number = null,
    provisioning_status = 'pending',
    provisioning_error = null,
    last_provision_attempt_at = null,
    test_call_completed_at = null,
    forwarding_completed_at = null;

update customer_agents
set status = 'draft',
    voice_id = 'retell-Cimo',
    provisioned_phone_number = null,
    provisioning_error = null,
    last_provision_attempt_at = null;

comment on table customer_agents is
  'Customer-owned voice-agent configurations. Retell is the execution layer; this table is the application source of truth.';

create table public_web_call_requests (
  id uuid primary key default gen_random_uuid(),
  ip_hash text not null,
  retell_call_id text unique,
  status text not null default 'requested' check (status in ('requested', 'in_progress', 'completed', 'failed')),
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index public_web_call_requests_ip_created_idx
  on public_web_call_requests(ip_hash, created_at desc);

alter table public_web_call_requests enable row level security;

create trigger public_web_call_requests_set_updated_at
before update on public_web_call_requests
for each row execute function set_updated_at();

create or replace function create_public_web_call_request(p_ip_hash text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  request_id uuid;
begin
  if length(coalesce(p_ip_hash, '')) < 32 then
    raise exception 'invalid_request';
  end if;

  perform pg_advisory_xact_lock(hashtext(p_ip_hash));

  if (select count(*) from public_web_call_requests where ip_hash = p_ip_hash and created_at >= now() - interval '1 day') >= 5 then
    raise exception 'rate_limit';
  end if;

  if (select count(*) from public_web_call_requests where created_at >= now() - interval '1 day') >= 200 then
    raise exception 'global_rate_limit';
  end if;

  insert into public_web_call_requests(ip_hash)
  values (p_ip_hash)
  returning id into request_id;

  return request_id;
end;
$$;

revoke all on function create_public_web_call_request(text) from public, anon, authenticated;
grant execute on function create_public_web_call_request(text) to service_role;
