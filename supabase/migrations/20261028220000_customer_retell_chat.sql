-- Opt-in customer AI. Existing workspaces retain their local approved-answer engine.
alter table website_chat_settings add column engine text not null default 'local' check (engine in ('local', 'retell'));
alter table website_chat_settings add column knowledge_revision bigint not null default 1;

create table website_chat_agents (
  client_id uuid primary key references clients(id) on delete cascade,
  status text not null default 'unconfigured' check (status in ('unconfigured', 'syncing', 'ready', 'stale', 'error')),
  retell_agent_id text unique,
  retell_llm_id text unique,
  retell_knowledge_base_id text unique,
  agent_version integer,
  knowledge_hash text check (knowledge_hash is null or knowledge_hash ~ '^[a-f0-9]{64}$'),
  knowledge_revision bigint,
  monthly_attempt_limit integer not null check (monthly_attempt_limit between 1 and 1000000),
  daily_attempt_limit integer not null check (daily_attempt_limit between 1 and 100000),
  sync_claim uuid,
  sync_until timestamptz,
  sync_error text,
  synced_at timestamptz,
  updated_at timestamptz not null default now(),
  check ((sync_claim is null) = (sync_until is null)),
  check (daily_attempt_limit <= monthly_attempt_limit)
);
alter table website_chats add column retell_chat_id text unique;
alter table website_chats add column retell_agent_id text;
alter table website_chats add column retell_agent_version integer;
alter table website_chats add column ai_knowledge_revision bigint;
alter table website_chats add column ai_pending_claim uuid;
alter table website_chats add column ai_pending_until timestamptz;
alter table website_chats add column ai_failed boolean not null default false;
alter table website_chats add constraint website_chats_ai_claim_check check ((ai_pending_claim is null) = (ai_pending_until is null));

create table website_chat_ai_turns (
  claim_id uuid primary key,
  client_id uuid not null references clients(id) on delete cascade,
  chat_id uuid not null references website_chats(id) on delete cascade,
  ip_hash text not null,
  message_hash text not null,
  status text not null default 'pending' check (status in ('pending', 'complete', 'failed')),
  created_at timestamptz not null default now()
);
create index website_chat_ai_turns_client_created on website_chat_ai_turns(client_id, created_at);
create index website_chat_ai_turns_ip_created on website_chat_ai_turns(client_id, ip_hash, created_at);
create index website_chat_ai_turns_chat_created on website_chat_ai_turns(chat_id, created_at);
alter table website_chat_agents enable row level security;
alter table website_chat_ai_turns enable row level security;
revoke all on website_chat_agents, website_chat_ai_turns from public, anon, authenticated;
grant all on website_chat_agents, website_chat_ai_turns to service_role;

-- Invalidating in the database covers customer forms, admin edits, and imports.
create function invalidate_website_chat_knowledge() returns trigger language plpgsql security definer set search_path = public as $$
declare target uuid;
begin
  if tg_table_name = 'website_knowledge' then
    if tg_op = 'UPDATE' and new.client_id is distinct from old.client_id then raise exception 'chat_knowledge_tenant_immutable'; end if;
    if tg_op = 'INSERT' and new.published is not true then return new; end if;
    if tg_op = 'DELETE' and old.published is not true then return old; end if;
    if tg_op = 'UPDATE' then
      if old.published is not true and new.published is not true then return new; end if;
      if row(new.title, new.content, new.keywords, new.published) is not distinct from row(old.title, old.content, old.keywords, old.published) then return new; end if;
    end if;
    target := case when tg_op = 'DELETE' then old.client_id else new.client_id end;
  else
    target := new.id;
    -- The public business name is always in the agent identity. Other profile
    -- fields matter only when this business explicitly includes its profile.
    if new.business_name is not distinct from old.business_name and (
      not exists(select 1 from website_chat_settings where client_id = target and use_business_profile)
      or row(new.services, new.service_area, new.business_hours, new.timezone) is not distinct from row(old.services, old.service_area, old.business_hours, old.timezone)
    ) then return new; end if;
  end if;
  update website_chat_settings set knowledge_revision = knowledge_revision + 1 where client_id = target;
  update website_chat_agents set status = 'stale', updated_at = now() where client_id = target;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;
create trigger website_knowledge_invalidate_ai after insert or update or delete on website_knowledge for each row execute function invalidate_website_chat_knowledge();
create trigger clients_invalidate_chat_ai after update on clients for each row execute function invalidate_website_chat_knowledge();

create function invalidate_website_chat_profile_setting() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.use_business_profile is distinct from old.use_business_profile then
    new.knowledge_revision := old.knowledge_revision + 1;
    update website_chat_agents set status = 'stale', updated_at = now() where client_id = new.client_id;
  end if;
  return new;
end;
$$;
create trigger website_chat_profile_invalidate_ai before update on website_chat_settings for each row execute function invalidate_website_chat_profile_setting();

create function begin_customer_chat_sync(p_client_id uuid, p_claim_id uuid, p_monthly_limit integer, p_daily_limit integer)
returns bigint language plpgsql security definer set search_path = public as $$
declare config website_chat_agents; revision bigint;
begin
  if p_claim_id is null or p_monthly_limit not between 1 and 1000000 or p_daily_limit not between 1 and 100000 or p_daily_limit > p_monthly_limit then raise exception 'chat_invalid_configuration'; end if;
  perform pg_advisory_xact_lock(hashtext('customer-chat-sync:' || p_client_id::text));
  insert into website_chat_settings(client_id) values (p_client_id) on conflict do nothing;
  select knowledge_revision into revision from website_chat_settings where client_id = p_client_id for update;
  select * into config from website_chat_agents where client_id = p_client_id for update;
  if config.sync_until > clock_timestamp() then raise exception 'chat_sync_busy'; end if;
  insert into website_chat_agents(client_id, status, monthly_attempt_limit, daily_attempt_limit, sync_claim, sync_until)
    values (p_client_id, 'syncing', p_monthly_limit, p_daily_limit, p_claim_id, clock_timestamp() + interval '10 minutes')
    on conflict (client_id) do update set status = 'syncing', monthly_attempt_limit = p_monthly_limit, daily_attempt_limit = p_daily_limit,
      sync_claim = p_claim_id, sync_until = clock_timestamp() + interval '10 minutes', sync_error = null, updated_at = now();
  return revision;
end;
$$;

create function activate_customer_chat(p_client_id uuid, p_claim_id uuid, p_revision bigint, p_hash text, p_agent_version integer)
returns boolean language plpgsql security definer set search_path = public as $$
declare config website_chat_agents; revision bigint;
begin
  select knowledge_revision into revision from website_chat_settings where client_id = p_client_id for update;
  select * into config from website_chat_agents where client_id = p_client_id for update;
  if revision is distinct from p_revision or config.sync_claim is distinct from p_claim_id or config.sync_until <= clock_timestamp()
    or config.retell_agent_id is null or config.retell_llm_id is null or config.retell_knowledge_base_id is null
    or p_hash is null or p_hash !~ '^[a-f0-9]{64}$' or p_agent_version is null or p_agent_version < 0 then return false; end if;
  update website_chat_agents set status = 'ready', knowledge_revision = p_revision, knowledge_hash = p_hash, agent_version = p_agent_version,
    sync_claim = null, sync_until = null, sync_error = null, synced_at = now(), updated_at = now() where client_id = p_client_id;
  -- Activation does not enable a paused widget. The owner still controls enabled.
  update website_chat_settings set engine = 'retell' where client_id = p_client_id;
  return true;
end;
$$;

create function claim_customer_chat_turn(p_client_id uuid, p_token_hash text, p_ip_hash text, p_claim_id uuid, p_message_hash text, p_knowledge_hash text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare chat website_chats; config website_chat_agents; settings website_chat_settings; attempted timestamptz := clock_timestamp();
begin
  if p_token_hash is null or p_token_hash !~ '^[a-f0-9]{64}$' or p_ip_hash is null or p_ip_hash !~ '^[a-f0-9]{64}$'
    or p_message_hash is null or p_message_hash !~ '^[a-f0-9]{64}$' or p_claim_id is null then raise exception 'chat_invalid_request'; end if;
  perform pg_advisory_xact_lock(hashtext('customer-chat-turn:' || p_client_id::text));
  select * into settings from website_chat_settings where client_id = p_client_id for share;
  if settings.enabled is not true then raise exception 'chat_disabled'; end if;
  select * into config from website_chat_agents where client_id = p_client_id for share;
  if settings.engine <> 'retell' or config.status is distinct from 'ready' or config.knowledge_revision is distinct from settings.knowledge_revision
    or config.knowledge_hash is distinct from p_knowledge_hash or config.retell_agent_id is null or config.agent_version is null then raise exception 'chat_ai_not_ready'; end if;
  select * into chat from website_chats where client_id = p_client_id and access_token_hash = p_token_hash for update;
  if not found or chat.created_at < attempted - interval '24 hours' or chat.ip_hash <> p_ip_hash then raise exception 'chat_session_expired'; end if;
  if chat.ai_pending_until > attempted then raise exception 'chat_session_busy'; end if;
  if chat.ai_failed or chat.ai_pending_claim is not null or (chat.turn_count > 0 and chat.ai_knowledge_revision is null)
    or (chat.ai_knowledge_revision is not null and (chat.ai_knowledge_revision <> settings.knowledge_revision or chat.retell_agent_id <> config.retell_agent_id or chat.retell_agent_version <> config.agent_version)) then raise exception 'chat_session_restart'; end if;
  if chat.turn_count >= 40 then raise exception 'chat_rate_limit_session'; end if;
  if exists(select 1 from website_chat_ai_turns where chat_id = chat.id and message_hash = p_message_hash and status = 'complete' and created_at > attempted - interval '30 seconds') then raise exception 'chat_message_replayed'; end if;
  if (select count(*) from website_chat_ai_turns where client_id = p_client_id and created_at >= date_trunc('month', attempted at time zone 'UTC') at time zone 'UTC') >= config.monthly_attempt_limit then raise exception 'chat_rate_limit_business'; end if;
  if (select count(*) from website_chat_ai_turns where client_id = p_client_id and created_at > attempted - interval '24 hours') >= config.daily_attempt_limit then raise exception 'chat_rate_limit_business'; end if;
  if (select count(*) from website_chat_ai_turns where client_id = p_client_id and ip_hash = p_ip_hash and created_at > attempted - interval '24 hours') >= 100 then raise exception 'chat_rate_limit_ip'; end if;
  insert into website_chat_ai_turns(claim_id, client_id, chat_id, ip_hash, message_hash, created_at) values(p_claim_id, p_client_id, chat.id, p_ip_hash, p_message_hash, attempted);
  update website_chats set turn_count = turn_count + 1, ai_pending_claim = p_claim_id, ai_pending_until = attempted + interval '90 seconds',
    ai_knowledge_revision = settings.knowledge_revision, retell_agent_id = config.retell_agent_id, retell_agent_version = config.agent_version where id = chat.id;
  return jsonb_build_object('chat_id', chat.retell_chat_id, 'agent_id', config.retell_agent_id, 'agent_version', config.agent_version, 'llm_id', config.retell_llm_id, 'knowledge_base_id', config.retell_knowledge_base_id);
end;
$$;

create function attach_customer_chat(p_client_id uuid, p_token_hash text, p_claim_id uuid, p_chat_id text)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if p_chat_id is null or length(p_chat_id) not between 1 and 200 then raise exception 'chat_invalid_request'; end if;
  update website_chats set retell_chat_id = p_chat_id where client_id = p_client_id and access_token_hash = p_token_hash
    and ai_pending_claim = p_claim_id and ai_pending_until > clock_timestamp() and retell_chat_id is null;
  return found;
end;
$$;

create function finish_customer_chat_turn(p_client_id uuid, p_token_hash text, p_claim_id uuid, p_success boolean, p_user text default null, p_answer text default null, p_source text default null)
returns boolean language plpgsql security definer set search_path = public as $$
declare chat website_chats; settings website_chat_settings; config website_chat_agents;
begin
  -- Same lock order as claims and publishing; knowledge changes invalidate in-flight replies.
  select * into settings from website_chat_settings where client_id = p_client_id for share;
  select * into config from website_chat_agents where client_id = p_client_id for share;
  select * into chat from website_chats where client_id = p_client_id and access_token_hash = p_token_hash for update;
  if not found or chat.ai_pending_claim is distinct from p_claim_id or chat.ai_pending_until <= clock_timestamp() then return false; end if;
  if p_success and (settings.enabled is not true or settings.engine is distinct from 'retell' or config.status is distinct from 'ready'
    or chat.ai_knowledge_revision is distinct from settings.knowledge_revision or chat.retell_agent_version is distinct from config.agent_version) then p_success := false; end if;
  if p_success and (p_user is null or length(p_user) not between 1 and 1000 or p_answer is null or length(p_answer) not between 1 and 3500) then raise exception 'chat_invalid_request'; end if;
  update website_chats set ai_pending_claim = null, ai_pending_until = null, ai_failed = not p_success, updated_at = now(),
    messages = case when p_success then messages || jsonb_build_array(jsonb_build_object('role','user','content',p_user), jsonb_build_object('role','assistant','content',p_answer,'source',p_source)) else messages end
    where id = chat.id;
  update website_chat_ai_turns set status = case when p_success then 'complete' else 'failed' end where claim_id = p_claim_id and client_id = p_client_id and chat_id = chat.id;
  return p_success;
end;
$$;

revoke all on function invalidate_website_chat_knowledge(), invalidate_website_chat_profile_setting(), begin_customer_chat_sync(uuid,uuid,integer,integer), activate_customer_chat(uuid,uuid,bigint,text,integer), claim_customer_chat_turn(uuid,text,text,uuid,text,text), attach_customer_chat(uuid,text,uuid,text), finish_customer_chat_turn(uuid,text,uuid,boolean,text,text,text) from public, anon, authenticated;
grant execute on function begin_customer_chat_sync(uuid,uuid,integer,integer), activate_customer_chat(uuid,uuid,bigint,text,integer), claim_customer_chat_turn(uuid,text,text,uuid,text,text), attach_customer_chat(uuid,text,uuid,text), finish_customer_chat_turn(uuid,text,uuid,boolean,text,text,text) to service_role;
