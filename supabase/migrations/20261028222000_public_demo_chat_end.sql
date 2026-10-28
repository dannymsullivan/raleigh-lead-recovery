-- Explicit close for the fictional public demo. Quota rows are retained, so a
-- browser reset cannot refund attempts or bypass rolling network/site limits.
create function end_public_demo_chat(p_token_hash text, p_ip_hash text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare chat public_demo_chats; ended_at timestamptz;
begin
  perform pg_advisory_xact_lock(hashtext('public-demo-chat-turn'));
  ended_at := clock_timestamp();
  if p_token_hash is null or p_token_hash !~ '^[a-f0-9]{64}$'
    or p_ip_hash is null or p_ip_hash !~ '^[a-f0-9]{64}$' then
    raise exception 'demo_invalid_request';
  end if;
  select * into chat from public_demo_chats where token_hash = p_token_hash for update;
  if not found or chat.ip_hash <> p_ip_hash then raise exception 'demo_session_expired'; end if;
  if chat.pending_until > ended_at then raise exception 'demo_session_busy'; end if;
  if chat.pending_claim is not null then
    update public_demo_chat_turns set status = 'failed' where claim_id = chat.pending_claim and status = 'pending';
  end if;
  update public_demo_chats set expires_at = least(expires_at, ended_at), pending_claim = null, pending_until = null
    where token_hash = p_token_hash;
  -- Return the same mapping on retries so a transient provider error can be
  -- retried after local expiration, without ever accepting a browser chat ID.
  return jsonb_build_object('chat_id', chat.chat_id);
end;
$$;
revoke all on function end_public_demo_chat(text, text) from public, anon, authenticated;
grant execute on function end_public_demo_chat(text, text) to service_role;
