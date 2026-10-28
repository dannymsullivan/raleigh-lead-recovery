-- Bound paid browser-voice demo starts separately from public phone demos and
-- customer agents. Failed provider starts still consume an attempt.
create or replace function create_public_web_call_request(
  p_ip_hash text,
  p_bypass_rate_limits boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  request_id uuid;
  attempt_time timestamptz;
begin
  if length(coalesce(p_ip_hash, '')) < 32 or p_bypass_rate_limits is null then
    raise exception 'invalid_request';
  end if;

  -- A shared lock protects both global pools against starts from different IPs.
  perform pg_advisory_xact_lock(hashtext('public-web-demo-call-start'));
  attempt_time := clock_timestamp();

  -- Only the server may request this flag after authenticating the owner.
  -- Owner testing uses its own finite allowance instead of the public pool.
  if p_bypass_rate_limits then
    if (
      select count(*) from public_web_call_requests
      where is_rate_limit_exempt = true
        and created_at >= attempt_time - interval '24 hours'
    ) >= 10 then
      raise exception 'owner_test_rate_limit';
    end if;
  else
    if (
      select count(*) from public_web_call_requests
      where ip_hash = p_ip_hash
        and is_rate_limit_exempt = false
        and created_at >= attempt_time - interval '24 hours'
    ) >= 2 then
      raise exception 'rate_limit';
    end if;
    if (
      select count(*) from public_web_call_requests
      where is_rate_limit_exempt = false
        and created_at >= attempt_time - interval '24 hours'
    ) >= 10 then
      raise exception 'global_rate_limit';
    end if;
  end if;

  insert into public_web_call_requests(ip_hash, is_rate_limit_exempt, created_at, updated_at)
  values (p_ip_hash, p_bypass_rate_limits, attempt_time, attempt_time)
  returning id into request_id;
  return request_id;
end;
$$;

revoke all on function create_public_web_call_request(text, boolean) from public, anon, authenticated;
grant execute on function create_public_web_call_request(text, boolean) to service_role;
