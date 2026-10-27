-- Tenant-owned website knowledge, conversations, lead capture, and first-touch attribution.
alter table clients drop constraint if exists clients_product_mode_check;
alter table clients add constraint clients_product_mode_check
  check (product_mode in ('website_chat', 'reactivation', 'missed_call_recovery'));

create table website_chat_settings (
  client_id uuid primary key references clients(id) on delete cascade,
  enabled boolean not null default false,
  use_business_profile boolean not null default true,
  updated_at timestamptz not null default now()
);
create table website_knowledge (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  title text not null check (length(title) between 1 and 120),
  content text not null check (length(content) between 1 and 3000),
  keywords text not null default '' check (length(keywords) <= 500),
  published boolean not null default true,
  updated_at timestamptz not null default now()
);
create index website_knowledge_client_idx on website_knowledge(client_id);
create table website_chats (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  access_token_hash text not null unique,
  ip_hash text not null,
  attribution jsonb not null default '{}',
  messages jsonb not null default '[]',
  turn_count integer not null default 0,
  lead_name text,
  lead_email text,
  lead_phone text,
  lead_request text check (length(lead_request) <= 2000),
  lead_captured_at timestamptz,
  contact_consent_at timestamptz,
  lead_status text not null default 'new' check (lead_status in ('new', 'contacted', 'booked', 'lost')),
  booked_value numeric(12,2) check (booked_value >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index website_chats_client_created_idx on website_chats(client_id, created_at desc);
create index website_chats_ip_created_idx on website_chats(ip_hash, created_at desc);
alter table website_chat_settings enable row level security;
alter table website_knowledge enable row level security;
alter table website_chats enable row level security;
-- Public traffic and customer mutations go through checked server routes/actions.
-- No anon/authenticated direct access, including session hashes and visitor PII.
revoke all on website_chat_settings, website_knowledge, website_chats from anon, authenticated;
grant all on website_chat_settings, website_knowledge, website_chats to service_role;

create function start_website_chat(p_client_id uuid, p_token_hash text, p_ip_hash text, p_attribution jsonb)
returns uuid language plpgsql security definer set search_path = public as $$
declare request_id uuid;
begin
  -- Global serialization makes the global quota safe across concurrent visitors.
  perform pg_advisory_xact_lock(hashtext('website-chat-start'));
  if not exists (select 1 from website_chat_settings where client_id = p_client_id and enabled) then raise exception 'chat_disabled'; end if;
  if length(p_token_hash) <> 64 or length(p_ip_hash) <> 64 then raise exception 'invalid_request'; end if;
  if (select count(*) from website_chats where ip_hash = p_ip_hash and created_at > now() - interval '1 hour') >= 20
    or (select count(*) from website_chats where created_at > now() - interval '1 hour') >= 500 then
    raise exception 'rate_limit';
  end if;
  insert into website_chats(client_id, access_token_hash, ip_hash, attribution)
    values (p_client_id, p_token_hash, p_ip_hash, p_attribution) returning id into request_id;
  return request_id;
end;
$$;

create function record_website_chat_turn(p_client_id uuid, p_token_hash text, p_user text, p_answer text, p_source text)
returns void language plpgsql security definer set search_path = public as $$
declare chat website_chats;
begin
  select * into chat from website_chats where client_id = p_client_id and access_token_hash = p_token_hash for update;
  if not found or chat.created_at < now() - interval '24 hours' then raise exception 'session_expired'; end if;
  if not exists (select 1 from website_chat_settings where client_id = p_client_id and enabled) then raise exception 'chat_disabled'; end if;
  if chat.turn_count >= 40 then raise exception 'rate_limit'; end if;
  if chat.turn_count > 0 and chat.updated_at > now() - interval '1 second' then raise exception 'rate_limit'; end if;
  if length(p_user) not between 1 and 1000 or length(p_answer) not between 1 and 3500 then raise exception 'invalid_request'; end if;
  update website_chats set messages = messages || jsonb_build_array(jsonb_build_object('role', 'user', 'content', p_user), jsonb_build_object('role', 'assistant', 'content', p_answer, 'source', p_source)), turn_count = turn_count + 1, updated_at = now() where id = chat.id;
end;
$$;
revoke all on function start_website_chat(uuid, text, text, jsonb), record_website_chat_turn(uuid, text, text, text, text) from public, anon, authenticated;
grant execute on function start_website_chat(uuid, text, text, jsonb), record_website_chat_turn(uuid, text, text, text, text) to service_role;
