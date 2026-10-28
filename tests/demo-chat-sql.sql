-- Run after both public demo chat migrations using psql -v ON_ERROR_STOP=1 -f ... .
-- All rows below are isolated test data and the entire exercise is rolled back.
-- Run during a quiet period: the test holds the same quota lock as live requests.
begin;
set local statement_timeout = '20s';

create function pg_temp.expect_demo_error(statement text, expected text)
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
  token text := repeat(md5(gen_random_uuid()::text), 2);
  ip text := repeat(md5(gen_random_uuid()::text), 2);
  other_ip text := repeat(md5(gen_random_uuid()::text), 2);
  message_hash text := repeat(md5(gen_random_uuid()::text), 2);
  claim uuid := gen_random_uuid();
  previous_claim uuid;
  result jsonb;
  remaining integer;
  n integer;
  before_count integer;
  daily_ip text := repeat(md5(gen_random_uuid()::text), 2);
  history_token text := repeat(md5(gen_random_uuid()::text), 2);
  history_token_two text := repeat(md5(gen_random_uuid()::text), 2);
  daily_token text := repeat(md5(gen_random_uuid()::text), 2);
  global_token text := repeat(md5(gen_random_uuid()::text), 2);
  global_ip text := repeat(md5(gen_random_uuid()::text), 2);
begin
  perform pg_advisory_xact_lock(hashtext('public-demo-chat-turn'));
  if (select count(*) from public_demo_chat_turns where created_at > clock_timestamp() - interval '24 hours') > 70 then
    raise exception 'Run demo SQL verification during a quiet day (at most 70 existing turns)';
  end if;
  if has_table_privilege('anon', 'public_demo_chats', 'SELECT')
    or has_table_privilege('authenticated', 'public_demo_chat_turns', 'SELECT')
    or has_function_privilege('anon', 'claim_public_demo_chat_turn(text,text,uuid,text,boolean)', 'EXECUTE')
    or has_function_privilege('authenticated', 'claim_public_demo_chat_turn(text,text,uuid,text,boolean)', 'EXECUTE')
    or has_function_privilege('anon', 'attach_public_demo_chat(text,uuid,text)', 'EXECUTE')
    or has_function_privilege('authenticated', 'finish_public_demo_chat_turn(text,uuid,boolean)', 'EXECUTE') then
    raise exception 'Public demo storage permissions are too broad';
  end if;
  if not has_function_privilege('service_role', 'claim_public_demo_chat_turn(text,text,uuid,text,boolean)', 'EXECUTE') then
    raise exception 'Service role cannot claim turns';
  end if;
  if not (select relrowsecurity from pg_class where oid = 'public_demo_chats'::regclass)
    or not (select relrowsecurity from pg_class where oid = 'public_demo_chat_turns'::regclass) then
    raise exception 'Public demo storage must retain RLS';
  end if;
  perform pg_temp.expect_demo_error(format('select claim_public_demo_chat_turn(%L,%L,%L,%L,true)', 'invalid', ip, claim, message_hash), 'demo_invalid_request');

  result := claim_public_demo_chat_turn(token, ip, claim, message_hash, true);
  if result <> '{"chat_id":null}'::jsonb then raise exception 'Unexpected initial claim'; end if;
  if not exists (select 1 from public_demo_chats where token_hash = token and turn_count = 1 and pending_claim = claim and expires_at > now() + interval '23 hours') then raise exception 'Initial claim did not persist'; end if;
  perform pg_temp.expect_demo_error(format('select claim_public_demo_chat_turn(%L,%L,%L,%L,false)', token, ip, gen_random_uuid(), message_hash), 'demo_session_busy');
  perform pg_temp.expect_demo_error(format('select claim_public_demo_chat_turn(%L,%L,%L,%L,false)', repeat(md5(gen_random_uuid()::text),2), ip, gen_random_uuid(), message_hash), 'demo_session_expired');
  perform pg_temp.expect_demo_error(format('select claim_public_demo_chat_turn(%L,%L,%L,%L,false)', token, other_ip, gen_random_uuid(), message_hash), 'demo_session_expired');
  perform pg_temp.expect_demo_error(format('select claim_public_demo_chat_turn(%L,%L,%L,%L,true)', token, ip, gen_random_uuid(), message_hash), 'demo_session_expired');
  if attach_public_demo_chat(token, gen_random_uuid(), 'sql-test-provider-chat') then raise exception 'Wrong claim attached a provider chat'; end if;
  if not attach_public_demo_chat(token, claim, 'sql-test-' || claim::text) then raise exception 'Provider mapping failed'; end if;
  if finish_public_demo_chat_turn(token, gen_random_uuid(), true) then raise exception 'Wrong claim cleared a lease'; end if;
  if not finish_public_demo_chat_turn(token, claim, true) then raise exception 'Completion did not release lease'; end if;
  perform pg_temp.expect_demo_error(format('select claim_public_demo_chat_turn(%L,%L,%L,%L,false)', token, ip, gen_random_uuid(), message_hash), 'demo_message_replayed');

  update public_demo_chats set expires_at = now() - interval '1 second' where token_hash = token;
  perform pg_temp.expect_demo_error(format('select claim_public_demo_chat_turn(%L,%L,%L,%L,false)', token, ip, gen_random_uuid(), message_hash), 'demo_session_expired');
  update public_demo_chats set expires_at = now() + interval '24 hours' where token_hash = token;
  message_hash := repeat(md5(gen_random_uuid()::text), 2);
  claim := gen_random_uuid();
  result := claim_public_demo_chat_turn(token, ip, claim, message_hash, false);
  if result->>'chat_id' is null then raise exception 'Existing provider mapping was lost'; end if;
  if not finish_public_demo_chat_turn(token, claim, false) then raise exception 'Failure did not clear lease'; end if;
  if (select turn_count from public_demo_chats where token_hash = token) <> 2 then raise exception 'Failure incorrectly refunded quota'; end if;
  -- A failed answer can retry immediately, while a successful replay is blocked.
  claim := gen_random_uuid();
  perform claim_public_demo_chat_turn(token, ip, claim, message_hash, false);
  previous_claim := claim;
  update public_demo_chats set pending_until = now() - interval '1 second' where token_hash = token;
  claim := gen_random_uuid();
  perform claim_public_demo_chat_turn(token, ip, claim, message_hash, false);
  if (select status from public_demo_chat_turns where claim_id = previous_claim) <> 'failed' then raise exception 'Stale attempt was not closed'; end if;
  if finish_public_demo_chat_turn(token, previous_claim, true) then raise exception 'Old request cleared a newer lease'; end if;
  if not exists (select 1 from public_demo_chats where token_hash = token and pending_claim = claim) then raise exception 'New lease was disturbed'; end if;
  perform finish_public_demo_chat_turn(token, claim, false);

  -- The sixth admitted attempt works; the seventh is rejected without any write.
  for n in 5..6 loop
    claim := gen_random_uuid();
    perform claim_public_demo_chat_turn(token, ip, claim, message_hash, false);
    perform finish_public_demo_chat_turn(token, claim, false);
  end loop;
  select count(*) into before_count from public_demo_chat_turns where token_hash = token;
  perform pg_temp.expect_demo_error(format('select claim_public_demo_chat_turn(%L,%L,%L,%L,false)', token, ip, gen_random_uuid(), message_hash), 'demo_rate_limit_session');
  if before_count <> 6 or (select count(*) from public_demo_chat_turns where token_hash = token) <> before_count
    or not exists (select 1 from public_demo_chats where token_hash = token and turn_count = 6 and pending_claim is null) then
    raise exception 'Session limit did not preserve six charged attempts';
  end if;
  -- Previously valid historical counts remain valid data but cannot spend more.
  update public_demo_chats set turn_count = 40 where token_hash = token;
  perform pg_temp.expect_demo_error(format('select claim_public_demo_chat_turn(%L,%L,%L,%L,false)', token, ip, gen_random_uuid(), message_hash), 'demo_rate_limit_session');
  update public_demo_chats set turn_count = 6 where token_hash = token;
  for n in 1..9 loop
    insert into public_demo_chats(token_hash, ip_hash) values (repeat(md5(gen_random_uuid()::text), 2), ip);
  end loop;
  perform pg_temp.expect_demo_error(format('select claim_public_demo_chat_turn(%L,%L,%L,%L,true)', repeat(md5(gen_random_uuid()::text),2), ip, gen_random_uuid(), message_hash), 'demo_rate_limit');

  -- Eleven failed attempts from 23 hours ago must still count against the IP,
  -- across sessions. Three older than 24 hours must not consume today's quota.
  insert into public_demo_chats(token_hash, ip_hash, created_at, turn_count)
    values (history_token, daily_ip, now() - interval '23 hours', 6),
      (history_token_two, daily_ip, now() - interval '23 hours', 5);
  for n in 1..11 loop
    insert into public_demo_chat_turns(claim_id, token_hash, ip_hash, message_hash, status, created_at)
      values (gen_random_uuid(), case when n <= 6 then history_token else history_token_two end,
        daily_ip, message_hash, 'failed', now() - interval '23 hours');
  end loop;
  for n in 1..3 loop
    insert into public_demo_chat_turns(claim_id, token_hash, ip_hash, message_hash, status, created_at)
      values (gen_random_uuid(), history_token, daily_ip, message_hash, 'failed', now() - interval '25 hours');
  end loop;
  claim := gen_random_uuid();
  perform claim_public_demo_chat_turn(daily_token, daily_ip, claim, message_hash, true);
  perform finish_public_demo_chat_turn(daily_token, claim, false);
  select count(*) into before_count from public_demo_chat_turns where ip_hash = daily_ip;
  perform pg_temp.expect_demo_error(format('select claim_public_demo_chat_turn(%L,%L,%L,%L,false)', daily_token, daily_ip, gen_random_uuid(), message_hash), 'demo_rate_limit_ip');
  perform pg_temp.expect_demo_error(format('select claim_public_demo_chat_turn(%L,%L,%L,%L,true)', repeat(md5(gen_random_uuid()::text),2), daily_ip, gen_random_uuid(), message_hash), 'demo_rate_limit_ip');
  if before_count <> 15 or (select count(*) from public_demo_chat_turns where ip_hash = daily_ip) <> before_count
    or not exists (select 1 from public_demo_chats where token_hash = daily_token and turn_count = 1 and pending_claim is null) then
    raise exception 'Daily IP limit did not preserve attempts across sessions';
  end if;

  -- Fill the global rolling day to 99 with failures older than one hour.
  -- The 100th is allowed; the 101st is blocked even for a fresh IP/session.
  select 99 - count(*) into remaining from public_demo_chat_turns where created_at > clock_timestamp() - interval '24 hours';
  for n in 1..remaining loop
    insert into public_demo_chat_turns(claim_id, token_hash, ip_hash, message_hash, status, created_at)
      values (gen_random_uuid(), token, other_ip, message_hash, 'failed', now() - interval '23 hours');
  end loop;
  claim := gen_random_uuid();
  perform claim_public_demo_chat_turn(global_token, global_ip, claim, message_hash, true);
  perform finish_public_demo_chat_turn(global_token, claim, false);
  perform pg_temp.expect_demo_error(format('select claim_public_demo_chat_turn(%L,%L,%L,%L,true)', repeat(md5(gen_random_uuid()::text),2), repeat(md5(gen_random_uuid()::text),2), gen_random_uuid(), message_hash), 'demo_rate_limit_global');
  if (select count(*) from public_demo_chat_turns where created_at > clock_timestamp() - interval '24 hours') <> 100 then
    raise exception 'Global limit did not preserve the 100-attempt rolling-day ceiling';
  end if;
  raise notice 'Public demo SQL checks passed: permissions, durable claims, replay, expiry, failure, stale lease, six/session, 12/IP/day, 100/global/day and session creation quota.';
end;
$$;
rollback;
