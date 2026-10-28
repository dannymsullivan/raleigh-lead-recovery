-- Public fictional-business demo only. No tenant knowledge, visitor messages, or
-- transcripts are stored here. Retell chat IDs never leave the server.
create table public_demo_chats (
  token_hash text primary key check (token_hash ~ '^[a-f0-9]{64}$'),
  ip_hash text not null check (ip_hash ~ '^[a-f0-9]{64}$'),
  chat_id text unique check (length(chat_id) between 1 and 200),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '24 hours',
  turn_count integer not null default 0 check (turn_count between 0 and 40),
  pending_claim uuid,
  pending_until timestamptz,
  check ((pending_claim is null) = (pending_until is null))
);
create index public_demo_chats_ip_created_idx on public_demo_chats(ip_hash, created_at desc);
create table public_demo_chat_turns (
  claim_id uuid primary key,
  token_hash text not null references public_demo_chats(token_hash) on delete cascade,
  ip_hash text not null check (ip_hash ~ '^[a-f0-9]{64}$'),
  message_hash text not null check (message_hash ~ '^[a-f0-9]{64}$'),
  created_at timestamptz not null default now(),
  status text not null default 'pending' check (status in ('pending', 'complete', 'failed'))
);
create index public_demo_chat_turns_created_idx on public_demo_chat_turns(created_at desc);
create index public_demo_chat_turns_ip_created_idx on public_demo_chat_turns(ip_hash, created_at desc);
create index public_demo_chat_turns_session_idx on public_demo_chat_turns(token_hash, created_at desc);
alter table public_demo_chats enable row level security;
alter table public_demo_chat_turns enable row level security;
revoke all on public_demo_chats, public_demo_chat_turns from public, anon, authenticated;
grant all on public_demo_chats, public_demo_chat_turns to service_role;

create function claim_public_demo_chat_turn(p_token_hash text, p_ip_hash text, p_claim_id uuid, p_message_hash text, p_create boolean)
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
  if chat.turn_count >= 40 then raise exception 'demo_rate_limit'; end if;
  if exists (select 1 from public_demo_chat_turns where token_hash = p_token_hash and message_hash = p_message_hash and status = 'complete' and created_at > attempt_time - interval '30 seconds') then raise exception 'demo_message_replayed'; end if;
  if (select count(*) from public_demo_chat_turns where created_at > attempt_time - interval '1 hour') >= 400
    or (select count(*) from public_demo_chat_turns where ip_hash = p_ip_hash and created_at > attempt_time - interval '1 hour') >= 60 then raise exception 'demo_rate_limit'; end if;
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

create function attach_public_demo_chat(p_token_hash text, p_claim_id uuid, p_chat_id text)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if p_chat_id is null or length(p_chat_id) not between 1 and 200 then raise exception 'demo_invalid_request'; end if;
  update public_demo_chats set chat_id = p_chat_id
    where token_hash = p_token_hash and pending_claim = p_claim_id and pending_until > clock_timestamp() and chat_id is null;
  return found;
end;
$$;

create function finish_public_demo_chat_turn(p_token_hash text, p_claim_id uuid, p_success boolean)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  -- The claim comparison prevents a late response from clearing a newer lease.
  update public_demo_chats set pending_claim = null, pending_until = null
    where token_hash = p_token_hash and pending_claim = p_claim_id and pending_until > clock_timestamp();
  if not found then return false; end if;
  update public_demo_chat_turns set status = case when p_success then 'complete' else 'failed' end
    where claim_id = p_claim_id and token_hash = p_token_hash;
  return true;
end;
$$;
revoke all on function claim_public_demo_chat_turn(text, text, uuid, text, boolean), attach_public_demo_chat(text, uuid, text), finish_public_demo_chat_turn(text, uuid, boolean) from public, anon, authenticated;
grant execute on function claim_public_demo_chat_turn(text, text, uuid, text, boolean), attach_public_demo_chat(text, uuid, text), finish_public_demo_chat_turn(text, uuid, boolean) to service_role;
