create table customer_agents (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  agent_type text not null check (agent_type in ('receptionist', 'lead_reactivation')),
  name text not null,
  is_default boolean not null default true,
  status text not null default 'draft' check (status in ('draft', 'provisioning', 'ready', 'needs_configuration', 'error', 'disabled')),
  vapi_assistant_id text,
  vapi_phone_number_id text,
  provisioned_phone_number text,
  voice_id text not null default 'Savannah',
  first_message text,
  offer_details text,
  handoff_rules text,
  custom_instructions text,
  provisioning_error text,
  last_provision_attempt_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(id, client_id)
);

create unique index customer_agents_default_type_idx
  on customer_agents(client_id, agent_type)
  where is_default;

create unique index customer_agents_vapi_assistant_idx
  on customer_agents(vapi_assistant_id)
  where vapi_assistant_id is not null;

create index customer_agents_client_idx
  on customer_agents(client_id, agent_type, created_at);

create trigger customer_agents_set_updated_at
before update on customer_agents
for each row execute function set_updated_at();

alter table customer_agents enable row level security;

alter table reactivation_campaigns
  add column agent_id uuid;

insert into customer_agents (
  client_id,
  agent_type,
  name,
  status,
  vapi_assistant_id,
  vapi_phone_number_id,
  provisioned_phone_number
)
select
  id,
  'receptionist',
  'Mabel 24/7 Receptionist',
  case
    when vapi_assistant_id is not null and vapi_phone_number_id is not null then 'ready'
    else 'draft'
  end,
  vapi_assistant_id,
  vapi_phone_number_id,
  provisioned_phone_number
from clients
where product_mode = 'missed_call_recovery'
   or vapi_assistant_id is not null
   or vapi_phone_number_id is not null
on conflict do nothing;

insert into customer_agents (client_id, agent_type, name, status)
select id, 'lead_reactivation', 'Mabel Lead Recovery', 'draft'
from clients
on conflict do nothing;

update reactivation_campaigns campaign
set agent_id = agent.id
from customer_agents agent
where campaign.agent_id is null
  and agent.client_id = campaign.client_id
  and agent.agent_type = 'lead_reactivation'
  and agent.is_default;

alter table reactivation_campaigns
  add constraint reactivation_campaigns_agent_client_fk
  foreign key (agent_id, client_id)
  references customer_agents(id, client_id)
  on delete restrict;

create index reactivation_campaigns_agent_idx
  on reactivation_campaigns(agent_id);

comment on table customer_agents is
  'Customer-owned Mabel configurations. Vapi is the execution layer; this table is the application source of truth.';

comment on column reactivation_campaigns.agent_id is
  'The customer-owned lead-recovery agent used to place this campaign''s calls.';
