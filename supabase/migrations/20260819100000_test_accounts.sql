alter table clients
  add column if not exists is_test_account boolean not null default false;

create index if not exists clients_test_account_idx
  on clients(is_test_account)
  where is_test_account = true;

comment on column clients.is_test_account is
  'Internal QA workspace. Calls are restricted to the account owner or alert phone.';
