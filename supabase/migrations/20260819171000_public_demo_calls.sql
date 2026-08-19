create table if not exists public_demo_call_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  business_name text not null,
  phone_e164 text not null,
  phone_hash text not null,
  ip_hash text not null,
  consent_version text not null,
  consent_text text not null,
  consented_at timestamptz not null default now(),
  user_agent text,
  vapi_call_id text unique,
  status text not null default 'queued' check (status in ('queued', 'in_progress', 'completed', 'failed')),
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists public_demo_calls_phone_created_idx on public_demo_call_requests(phone_hash, created_at desc);
create index if not exists public_demo_calls_ip_created_idx on public_demo_call_requests(ip_hash, created_at desc);
create index if not exists public_demo_calls_created_idx on public_demo_call_requests(created_at desc);

alter table public_demo_call_requests enable row level security;

comment on table public_demo_call_requests is 'Server-managed audit and rate-limit records for visitor-requested Mabel demo calls.';
comment on column public_demo_call_requests.phone_hash is 'Keyed hash used for abuse prevention without querying by the clear phone number.';

create or replace function create_public_demo_call_request(
  p_name text,
  p_business_name text,
  p_phone_e164 text,
  p_phone_hash text,
  p_ip_hash text,
  p_consent_version text,
  p_consent_text text,
  p_user_agent text
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  request_id uuid;
begin
  perform pg_advisory_xact_lock(hashtext('public_demo_call_requests'));

  if (select count(*) from public_demo_call_requests where phone_hash = p_phone_hash and created_at >= now() - interval '24 hours') >= 2 then
    raise exception using errcode = 'P0001', message = 'phone_rate_limit';
  end if;
  if (select count(*) from public_demo_call_requests where ip_hash = p_ip_hash and created_at >= now() - interval '1 hour') >= 3 then
    raise exception using errcode = 'P0001', message = 'ip_rate_limit';
  end if;
  if (select count(*) from public_demo_call_requests where created_at >= now() - interval '24 hours') >= 50 then
    raise exception using errcode = 'P0001', message = 'global_rate_limit';
  end if;

  insert into public_demo_call_requests (
    name, business_name, phone_e164, phone_hash, ip_hash,
    consent_version, consent_text, user_agent
  ) values (
    p_name, p_business_name, p_phone_e164, p_phone_hash, p_ip_hash,
    p_consent_version, p_consent_text, left(p_user_agent, 300)
  ) returning id into request_id;

  return request_id;
end;
$$;

revoke all on function create_public_demo_call_request(text, text, text, text, text, text, text, text) from public, anon, authenticated;
grant execute on function create_public_demo_call_request(text, text, text, text, text, text, text, text) to service_role;
