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

  -- Each number gets two real call starts per day. Failed provider starts do not
  -- consume the retry intended for Bluetooth, voicemail, or connection issues.
  if (
    select count(*)
    from public_demo_call_requests
    where phone_hash = p_phone_hash
      and status <> 'failed'
      and created_at >= now() - interval '24 hours'
  ) >= 2 then
    raise exception using errcode = 'P0001', message = 'phone_rate_limit';
  end if;

  -- Keep a broader connection guard without preventing a few people on the
  -- same office or home network from using both of their allowed calls.
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
      and created_at >= now() - interval '24 hours'
  ) >= 50 then
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
