alter table public_web_call_requests
  add column if not exists is_rate_limit_exempt boolean not null default false;

create index if not exists public_web_call_requests_public_created_idx
  on public_web_call_requests(created_at desc)
  where is_rate_limit_exempt = false;

drop function if exists create_public_web_call_request(text);

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
begin
  if length(coalesce(p_ip_hash, '')) < 32 then
    raise exception 'invalid_request';
  end if;

  perform pg_advisory_xact_lock(hashtext(p_ip_hash));

  if p_bypass_rate_limits then
    if (
      select count(*)
      from public_web_call_requests
      where is_rate_limit_exempt = true
        and created_at >= now() - interval '1 day'
    ) >= 50 then
      raise exception 'owner_test_rate_limit';
    end if;
  else
    if (
      select count(*)
      from public_web_call_requests
      where ip_hash = p_ip_hash
        and is_rate_limit_exempt = false
        and created_at >= now() - interval '1 day'
    ) >= 5 then
      raise exception 'rate_limit';
    end if;

    if (
      select count(*)
      from public_web_call_requests
      where is_rate_limit_exempt = false
        and created_at >= now() - interval '1 day'
    ) >= 200 then
      raise exception 'global_rate_limit';
    end if;
  end if;

  insert into public_web_call_requests(ip_hash, is_rate_limit_exempt)
  values (p_ip_hash, p_bypass_rate_limits)
  returning id into request_id;

  return request_id;
end;
$$;

revoke all on function create_public_web_call_request(text, boolean) from public, anon, authenticated;
grant execute on function create_public_web_call_request(text, boolean) to service_role;

