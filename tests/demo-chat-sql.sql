-- Run once after the public demo migration using psql -v ON_ERROR_STOP=1 -f ... .
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
    if position(expected in sqlerrm) > 0 then return; end if;
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
begin
  perform pg_advisory_xact_lock(hashtext('public-demo-chat-turn'));
  if (select count(*) from public_demo_chat_turns where created_at > clock_timestamp() - interval '1 hour') > 300 then
    raise exception 'Run demo SQL verification during a quiet hour (less than 300 existing turns)';
  end if;
  if has_table_privilege('anon', 'public_demo_chats', 'SELECT')
    or has_table_privilege('authenticated', 'public_demo_chat_turns', 'SELECT')
    or has_function_privilege('anon', 'claim_public_demo_chat_turn(text,text,uuid,text,boolean)', 'EXECUTE')
    or has_function_privilege('authenticated', 'finish_public_demo_chat_turn(text,uuid,boolean)', 'EXECUTE') then
    raise exception 'Public demo storage permissions are too broad';
  end if;
  if not has_function_privilege('service_role', 'claim_public_demo_chat_turn(text,text,uuid,text,boolean)', 'EXECUTE') then
    raise exception 'Service role cannot claim turns';
  end if;

  result := claim_public_demo_chat_turn(token, ip, claim, message_hash, true);
  if result <> '{"chat_id":null}'::jsonb then raise exception 'Unexpected initial claim'; end if;
  if not exists (select 1 from public_demo_chats where token_hash = token and turn_count = 1 and pending_claim = claim and expires_at > now() + interval '23 hours') then raise exception 'Initial claim did not persist'; end if;
  perform pg_temp.expect_demo_error(format('select claim_public_demo_chat_turn(%L,%L,%L,%L,false)', token, ip, gen_random_uuid(), message_hash), 'demo_session_busy');
  perform pg_temp.expect_demo_error(format('select claim_public_demo_chat_turn(%L,%L,%L,%L,false)', repeat(md5(gen_random_uuid()::text),2), ip, gen_random_uuid(), message_hash), 'demo_session_expired');
  perform pg_temp.expect_demo_error(format('select claim_public_demo_chat_turn(%L,%L,%L,%L,false)', token, other_ip, gen_random_uuid(), message_hash), 'demo_session_expired');
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

  update public_demo_chats set turn_count = 40 where token_hash = token;
  perform pg_temp.expect_demo_error(format('select claim_public_demo_chat_turn(%L,%L,%L,%L,false)', token, ip, gen_random_uuid(), message_hash), 'demo_rate_limit');
  update public_demo_chats set turn_count = 4 where token_hash = token;
  for n in 1..9 loop
    insert into public_demo_chats(token_hash, ip_hash) values (repeat(md5(gen_random_uuid()::text), 2), ip);
  end loop;
  perform pg_temp.expect_demo_error(format('select claim_public_demo_chat_turn(%L,%L,%L,%L,true)', repeat(md5(gen_random_uuid()::text),2), ip, gen_random_uuid(), message_hash), 'demo_rate_limit');

  select 60 - count(*) into remaining from public_demo_chat_turns where ip_hash = ip and created_at > now() - interval '1 hour';
  for n in 1..remaining loop
    insert into public_demo_chat_turns(claim_id, token_hash, ip_hash, message_hash, status) values (gen_random_uuid(), token, ip, message_hash, 'failed');
  end loop;
  perform pg_temp.expect_demo_error(format('select claim_public_demo_chat_turn(%L,%L,%L,%L,false)', token, ip, gen_random_uuid(), message_hash), 'demo_rate_limit');
  select 400 - count(*) into remaining from public_demo_chat_turns where created_at > now() - interval '1 hour';
  for n in 1..remaining loop
    insert into public_demo_chat_turns(claim_id, token_hash, ip_hash, message_hash, status) values (gen_random_uuid(), token, other_ip, message_hash, 'failed');
  end loop;
  perform pg_temp.expect_demo_error(format('select claim_public_demo_chat_turn(%L,%L,%L,%L,true)', repeat(md5(gen_random_uuid()::text),2), repeat(md5(gen_random_uuid()::text),2), gen_random_uuid(), message_hash), 'demo_rate_limit');
  raise notice 'Public demo SQL checks passed: permissions, durable claims, replay, expiry, failure, stale lease and all quotas.';
end;
$$;
rollback;
