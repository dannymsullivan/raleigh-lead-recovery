alter table public_demo_call_requests
  add column if not exists is_rate_limit_exempt boolean not null default false;

comment on column public_demo_call_requests.is_rate_limit_exempt is
  'True only for server-approved owner test numbers with a higher finite allowance; requests remain fully audited.';

create or replace function create_public_demo_call_request_v2(
  p_name text,
  p_business_name text,
  p_phone_e164 text,
  p_phone_hash text,
  p_ip_hash text,
  p_consent_version text,
  p_consent_text text,
  p_user_agent text,
  p_bypass_rate_limits boolean
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  request_id uuid;
begin
  perform pg_advisory_xact_lock(hashtext('public_demo_call_requests'));

  -- Owner-controlled test numbers get a higher allowance, never an unlimited
  -- public bypass. This keeps repeated QA practical without creating an
  -- unauthenticated harassment or runaway-cost endpoint.
  if p_bypass_rate_limits then
    if (
      select count(*)
      from public_demo_call_requests
      where phone_hash = p_phone_hash
        and status <> 'failed'
        and created_at >= now() - interval '24 hours'
    ) >= 20 then
      raise exception using errcode = 'P0001', message = 'owner_test_rate_limit';
    end if;
  else
    if (
      select count(*)
      from public_demo_call_requests
      where phone_hash = p_phone_hash
        and status <> 'failed'
        and created_at >= now() - interval '24 hours'
    ) >= 2 then
      raise exception using errcode = 'P0001', message = 'phone_rate_limit';
    end if;

    if (
      select count(*)
      from public_demo_call_requests
      where ip_hash = p_ip_hash
        and status <> 'failed'
        and created_at >= now() - interval '1 hour'
    ) >= 10 then
      raise exception using errcode = 'P0001', message = 'ip_rate_limit';
    end if;

    if (
      select count(*)
      from public_demo_call_requests
      where status <> 'failed'
        and not is_rate_limit_exempt
        and created_at >= now() - interval '24 hours'
    ) >= 50 then
      raise exception using errcode = 'P0001', message = 'global_rate_limit';
    end if;
  end if;

  insert into public_demo_call_requests (
    name, business_name, phone_e164, phone_hash, ip_hash,
    consent_version, consent_text, user_agent, is_rate_limit_exempt
  ) values (
    p_name, p_business_name, p_phone_e164, p_phone_hash, p_ip_hash,
    p_consent_version, p_consent_text, left(p_user_agent, 300), p_bypass_rate_limits
  ) returning id into request_id;

  return request_id;
end;
$$;

revoke all on function create_public_demo_call_request_v2(text, text, text, text, text, text, text, text, boolean) from public, anon, authenticated;
grant execute on function create_public_demo_call_request_v2(text, text, text, text, text, text, text, text, boolean) to service_role;
