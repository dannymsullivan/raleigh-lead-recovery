create table if not exists customer_workspace_invitations (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  accepted_user_id uuid references auth.users(id) on delete set null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists customer_workspace_invitations_client_idx
  on customer_workspace_invitations(client_id, created_at desc);

create unique index if not exists customer_workspace_invitations_one_active_idx
  on customer_workspace_invitations(client_id)
  where accepted_at is null and revoked_at is null;

alter table customer_workspace_invitations enable row level security;

comment on table customer_workspace_invitations is
  'One-time, server-validated links that attach an authenticated customer owner to an existing admin-created workspace.';
