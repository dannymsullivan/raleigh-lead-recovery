alter table reactivation_contacts
  add column if not exists external_id text,
  add column if not exists company text,
  add column if not exists brand text,
  add column if not exists import_bucket text,
  add column if not exists import_metadata jsonb not null default '{}'::jsonb;

-- Contacts imported before bucket classification were already accepted as
-- callable leads. Preserve that behavior instead of letting SQL NULL semantics
-- hide them from qualified views and the outbound queue.
update reactivation_contacts
set import_bucket = 'ready_to_reengage'
where import_bucket is null;

alter table reactivation_contacts
  add constraint reactivation_contacts_import_bucket_check
  check (
    import_bucket is null or import_bucket in (
      'ready_to_reengage',
      'price_sensitive',
      'timing_or_capacity',
      'lost_elsewhere',
      'disrupted',
      'review',
      'exclude'
    )
  );

create index if not exists reactivation_contacts_external_id_idx
  on reactivation_contacts(client_id, external_id)
  where external_id is not null;

create index if not exists reactivation_contacts_bucket_idx
  on reactivation_contacts(campaign_id, import_bucket, status);
