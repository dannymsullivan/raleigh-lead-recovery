-- Opt-in email routing. Visitor consent and the chosen destination are separate permissions.
create table website_chat_notification_settings (
  client_id uuid primary key references clients(id) on delete cascade,
  enabled boolean not null default false,
  destination_email text check (length(destination_email) <= 200 and destination_email ~ '^[^[:space:]@,;<>]+@[^[:space:]@,;<>]+\.[^[:space:]@,;<>]+$'),
  destination_label text not null default 'Your team' check (length(destination_label) between 1 and 80),
  consented_at timestamptz,
  configured_by text not null check (configured_by in ('customer', 'admin')),
  updated_at timestamptz not null default now(),
  check (not enabled or (destination_email is not null and consented_at is not null))
);

create table website_chat_notification_outbox (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null unique references website_chats(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade,
  destination_email text not null,
  destination_label text not null,
  lead_snapshot jsonb not null,
  status text not null default 'queued' check (status in ('queued', 'sending', 'sent', 'failed')),
  attempts integer not null default 0 check (attempts between 0 and 5),
  first_attempt_at timestamptz,
  last_attempt_at timestamptz,
  claim_token uuid,
  payload jsonb,
  provider_message_id text,
  last_error text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index website_chat_notification_outbox_client_idx on website_chat_notification_outbox(client_id, created_at desc);
alter table website_chat_notification_settings enable row level security;
alter table website_chat_notification_outbox enable row level security;
revoke all on website_chat_notification_settings, website_chat_notification_outbox from public, anon, authenticated;
grant all on website_chat_notification_settings, website_chat_notification_outbox to service_role;

create function enqueue_website_chat_notification() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.lead_captured_at is not null and new.contact_consent_at is not null
    and (tg_op = 'INSERT' or old.lead_captured_at is null) then
    insert into website_chat_notification_outbox(chat_id, client_id, destination_email, destination_label, lead_snapshot)
      select new.id, new.client_id, s.destination_email, s.destination_label,
        jsonb_build_object('business_name', left(c.business_name, 160), 'name', left(new.lead_name, 100),
          'email', left(new.lead_email, 200), 'phone', left(new.lead_phone, 40), 'request', left(new.lead_request, 2000))
      from website_chat_notification_settings s join clients c on c.id = s.client_id
      where s.client_id = new.client_id and s.enabled and s.consented_at is not null
      on conflict (chat_id) do nothing;
  end if;
  return new;
end;
$$;
create trigger website_chat_lead_notification after insert or update of lead_captured_at on website_chats
for each row execute function enqueue_website_chat_notification();

-- Serialize delivery and retain an immutable provider payload for idempotent retries.
-- Resend retains keys for 24h; stop at 23h if the outcome could be ambiguous.
create function claim_website_chat_notification(p_client_id uuid, p_chat_id uuid, p_payload jsonb)
returns setof website_chat_notification_outbox language plpgsql security definer set search_path = public as $$
declare item website_chat_notification_outbox;
begin
  select * into item from website_chat_notification_outbox where client_id = p_client_id and chat_id = p_chat_id for update;
  if not found or item.status = 'sent' then return; end if;
  if item.status = 'sending' and item.last_attempt_at > now() - interval '2 minutes' then return; end if;
  if item.attempts >= 5 or item.first_attempt_at <= now() - interval '23 hours' then
    update website_chat_notification_outbox set status = 'failed', last_error = 'review_required', updated_at = now() where id = item.id;
    return;
  end if;
  if not exists (select 1 from website_chat_notification_settings where client_id = p_client_id and enabled
    and consented_at is not null and destination_email = item.destination_email) then
    update website_chat_notification_outbox set status = 'failed', last_error = 'destination_paused_or_changed', updated_at = now() where id = item.id;
    return;
  end if;
  if jsonb_typeof(p_payload) is distinct from 'object' or p_payload->'to' is distinct from jsonb_build_array(item.destination_email)
    or jsonb_typeof(p_payload->'from') is distinct from 'string' or length(p_payload->>'from') not between 3 and 200
    or jsonb_typeof(p_payload->'text') is distinct from 'string' or length(p_payload->>'text') not between 1 and 4000
    or jsonb_typeof(p_payload->'subject') is distinct from 'string' or length(p_payload->>'subject') not between 1 and 200
    then raise exception 'invalid_payload'; end if;
  return query update website_chat_notification_outbox set status = 'sending', attempts = attempts + 1,
    first_attempt_at = coalesce(first_attempt_at, now()), last_attempt_at = now(), claim_token = gen_random_uuid(),
    payload = coalesce(payload, p_payload), last_error = null, updated_at = now()
    where id = item.id returning *;
end;
$$;

create function finish_website_chat_notification(p_id uuid, p_claim_token uuid, p_message_id text, p_error text)
returns void language plpgsql security definer set search_path = public as $$
begin
  update website_chat_notification_outbox set status = case when p_message_id is not null then 'sent' else 'failed' end,
    provider_message_id = p_message_id, sent_at = case when p_message_id is not null then now() else null end,
    last_error = left(p_error, 100), claim_token = null, updated_at = now()
    where id = p_id and claim_token = p_claim_token and status = 'sending';
end;
$$;
revoke all on function enqueue_website_chat_notification(), claim_website_chat_notification(uuid, uuid, jsonb), finish_website_chat_notification(uuid, uuid, text, text) from public, anon, authenticated;
grant execute on function claim_website_chat_notification(uuid, uuid, jsonb), finish_website_chat_notification(uuid, uuid, text, text) to service_role;
