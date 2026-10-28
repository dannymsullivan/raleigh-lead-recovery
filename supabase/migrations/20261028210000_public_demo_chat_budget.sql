-- Limit the public chat demo before any paid provider request is made.
-- Existing sessions retain their history; the function enforces the new six-turn
-- cap without changing the table constraint or rewriting historical counts.
-- All limits apply only to this public demo, not customer/tenant conversations.
create or replace function claim_public_demo_chat_turn(p_token_hash text, p_ip_hash text, p_claim_id uuid, p_message_hash text, p_create boolean)
returns jsonb language plpgsql security definer set search_path = public as $$
declare chat public_demo_chats; attempt_time timestamptz;
begin
  -- One global lock makes rolling global/IP quotas atomic across server instances.
  perform pg_advisory_xact_lock(hashtext('public-demo-chat-turn'));
  attempt_time := clock_timestamp();
  if p_token_hash is null or p_token_hash !~ '^[a-f0-9]{64}$'
    or p_ip_hash is null or p_ip_hash !~ '^[a-f0-9]{64}$'
    or p_message_hash is null or p_message_hash !~ '^[a-f0-9]{64}$'
    or p_claim_id is null or p_create is null then raise exception 'demo_invalid_request'; end if;
  select * into chat from public_demo_chats where token_hash = p_token_hash for update;
  if p_create then
    if found then raise exception 'demo_session_expired'; end if;
    if (select count(*) from public_demo_chats where ip_hash = p_ip_hash and created_at > attempt_time - interval '1 hour') >= 10 then raise exception 'demo_rate_limit'; end if;
  elsif not found or chat.expires_at <= attempt_time or chat.ip_hash <> p_ip_hash then
    raise exception 'demo_session_expired';
  end if;
  if chat.pending_until > attempt_time then raise exception 'demo_session_busy'; end if;
  if chat.turn_count >= 6 then raise exception 'demo_rate_limit_session'; end if;
  if exists (select 1 from public_demo_chat_turns where token_hash = p_token_hash and message_hash = p_message_hash and status = 'complete' and created_at > attempt_time - interval '30 seconds') then raise exception 'demo_message_replayed'; end if;
  -- Count every admitted attempt, including provider failures and stale leases.
  -- Rolling windows prevent a new session or midnight reset from bypassing caps.
  if (select count(*) from public_demo_chat_turns where ip_hash = p_ip_hash and created_at > attempt_time - interval '24 hours') >= 12 then raise exception 'demo_rate_limit_ip'; end if;
  if (select count(*) from public_demo_chat_turns where created_at > attempt_time - interval '24 hours') >= 100 then raise exception 'demo_rate_limit_global'; end if;
  if p_create then
    insert into public_demo_chats(token_hash, ip_hash, created_at, expires_at)
      values (p_token_hash, p_ip_hash, attempt_time, attempt_time + interval '24 hours') returning * into chat;
  elsif chat.pending_claim is not null then
    update public_demo_chat_turns set status = 'failed' where claim_id = chat.pending_claim and status = 'pending';
  end if;
  insert into public_demo_chat_turns(claim_id, token_hash, ip_hash, message_hash, created_at)
    values (p_claim_id, p_token_hash, p_ip_hash, p_message_hash, attempt_time);
  update public_demo_chats set turn_count = turn_count + 1, pending_claim = p_claim_id, pending_until = attempt_time + interval '90 seconds' where token_hash = p_token_hash;
  -- Metadata cleanup cannot remove active quota records (sessions live 24 hours).
  delete from public_demo_chats where expires_at < attempt_time - interval '7 days';
  return jsonb_build_object('chat_id', chat.chat_id);
end;
$$;

-- CREATE OR REPLACE retains grants; restate the intended boundary explicitly.
revoke all on function claim_public_demo_chat_turn(text, text, uuid, text, boolean) from public, anon, authenticated;
grant execute on function claim_public_demo_chat_turn(text, text, uuid, text, boolean) to service_role;
