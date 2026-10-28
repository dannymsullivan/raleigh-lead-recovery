-- Run after 20261028213000_public_web_demo_budget.sql with psql -v ON_ERROR_STOP=1 -f ... .
-- Isolated synthetic requests only; no paid provider calls and no persistent writes.
-- Run during a quiet period because the transaction holds the live quota lock.
begin;
set local statement_timeout = '20s';

create or replace function pg_temp.expect_web_demo_error(statement text, expected text)
returns void language plpgsql as $$
begin
  begin
    execute statement;
  exception when others then
    if sqlerrm = expected then return; end if;
    raise;
  end;
  raise exception 'Expected error % for %', expected, statement;
end;
$$;

do $$
declare
  ip text := repeat(md5(gen_random_uuid()::text), 2);
  rolling_ip text := repeat(md5(gen_random_uuid()::text), 2);
  history_ip text := repeat(md5(gen_random_uuid()::text), 2);
  request_id uuid;
  before_count integer;
  remaining integer;
  n integer;
begin
  perform pg_advisory_xact_lock(hashtext('public-web-demo-call-start'));
  if (select count(*) from public_web_call_requests where not is_rate_limit_exempt and created_at >= clock_timestamp() - interval '24 hours') > 5
    or (select count(*) from public_web_call_requests where is_rate_limit_exempt and created_at >= clock_timestamp() - interval '24 hours') > 9 then
    raise exception 'Run browser demo SQL verification during a quiet day (at most five public and nine owner attempts)';
  end if;
  if has_function_privilege('anon', 'create_public_web_call_request(text,boolean)', 'EXECUTE')
    or has_function_privilege('authenticated', 'create_public_web_call_request(text,boolean)', 'EXECUTE') then
    raise exception 'Browser demo request permissions are too broad';
  end if;
  if not has_function_privilege('service_role', 'create_public_web_call_request(text,boolean)', 'EXECUTE') then
    raise exception 'Service role cannot create browser demo requests';
  end if;
  if not (select relrowsecurity from pg_class where oid = 'public_web_call_requests'::regclass) then
    raise exception 'Browser demo storage must retain RLS';
  end if;
  perform pg_temp.expect_web_demo_error('select create_public_web_call_request(null,false)', 'invalid_request');
  perform pg_temp.expect_web_demo_error('select create_public_web_call_request(''short'',false)', 'invalid_request');
  perform pg_temp.expect_web_demo_error(format('select create_public_web_call_request(%L,null)', ip), 'invalid_request');

  -- Both starts are admitted, even when their provider attempts then fail.
  for n in 1..2 loop
    request_id := create_public_web_call_request(ip, false);
    if not exists (select 1 from public_web_call_requests where id = request_id and ip_hash = ip and not is_rate_limit_exempt and status = 'requested') then
      raise exception 'Public browser demo request did not persist';
    end if;
    update public_web_call_requests set status = 'failed' where id = request_id;
  end loop;
  perform pg_temp.expect_web_demo_error(format('select create_public_web_call_request(%L,false)', ip), 'rate_limit');
  if (select count(*) from public_web_call_requests where ip_hash = ip) <> 2 then
    raise exception 'IP cap did not preserve exactly two failed attempts';
  end if;

  -- A 23-hour-old failure counts; a 25-hour-old failure does not.
  insert into public_web_call_requests(ip_hash, status, created_at)
    values (rolling_ip, 'failed', now() - interval '23 hours'),
      (rolling_ip, 'failed', now() - interval '25 hours');
  request_id := create_public_web_call_request(rolling_ip, false);
  update public_web_call_requests set status = 'failed' where id = request_id;
  perform pg_temp.expect_web_demo_error(format('select create_public_web_call_request(%L,false)', rolling_ip), 'rate_limit');
  if (select count(*) from public_web_call_requests where ip_hash = rolling_ip) <> 3 then
    raise exception 'Rolling IP limit wrote a rejected request';
  end if;

  -- Fill the public pool to nine using older failures. The tenth start works.
  select 9 - count(*) into remaining from public_web_call_requests
    where not is_rate_limit_exempt and created_at >= clock_timestamp() - interval '24 hours';
  for n in 1..remaining loop
    insert into public_web_call_requests(ip_hash, status, created_at)
      values (history_ip, 'failed', now() - interval '23 hours');
  end loop;
  request_id := create_public_web_call_request(repeat(md5(gen_random_uuid()::text), 2), false);
  update public_web_call_requests set status = 'failed' where id = request_id;
  perform pg_temp.expect_web_demo_error(format('select create_public_web_call_request(%L,false)', repeat(md5(gen_random_uuid()::text),2)), 'global_rate_limit');
  if (select count(*) from public_web_call_requests where not is_rate_limit_exempt and created_at >= clock_timestamp() - interval '24 hours') <> 10 then
    raise exception 'Public global limit did not preserve exactly ten attempts';
  end if;

  -- Owner tests have a separate finite allowance, even when the public pool and
  -- this IP are exhausted. Old records outside the rolling day do not count.
  select 9 - count(*) into remaining from public_web_call_requests
    where is_rate_limit_exempt and created_at >= clock_timestamp() - interval '24 hours';
  for n in 1..remaining loop
    insert into public_web_call_requests(ip_hash, is_rate_limit_exempt, status, created_at)
      values (history_ip, true, 'failed', now() - interval '23 hours');
  end loop;
  insert into public_web_call_requests(ip_hash, is_rate_limit_exempt, status, created_at)
    values (ip, true, 'failed', now() - interval '25 hours');
  request_id := create_public_web_call_request(ip, true);
  if not exists (select 1 from public_web_call_requests where id = request_id and is_rate_limit_exempt) then
    raise exception 'Owner request did not use its separate allowance';
  end if;
  update public_web_call_requests set status = 'failed' where id = request_id;
  select count(*) into before_count from public_web_call_requests;
  perform pg_temp.expect_web_demo_error(format('select create_public_web_call_request(%L,true)', repeat(md5(gen_random_uuid()::text),2)), 'owner_test_rate_limit');
  if (select count(*) from public_web_call_requests) <> before_count
    or (select count(*) from public_web_call_requests where is_rate_limit_exempt and created_at >= clock_timestamp() - interval '24 hours') <> 10
    or (select count(*) from public_web_call_requests where not is_rate_limit_exempt and created_at >= clock_timestamp() - interval '24 hours') <> 10 then
    raise exception 'Owner or public quota was altered by a rejected start';
  end if;
  raise notice 'Browser demo SQL checks passed: permissions, validation, failed attempts counted, 2/IP/day, 10/public/day, 10/owner/day and rolling-day edges.';
end;
$$;
rollback;
