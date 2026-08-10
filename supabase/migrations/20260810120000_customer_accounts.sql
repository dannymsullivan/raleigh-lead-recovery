alter table clients
  add column if not exists user_id uuid references auth.users(id) on delete set null;

create unique index if not exists clients_user_id_idx
  on clients(user_id);

comment on column clients.user_id is 'Supabase Auth owner for the self-serve customer dashboard.';
