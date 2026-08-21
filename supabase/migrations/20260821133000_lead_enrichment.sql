alter table reactivation_contacts
  add column if not exists event_date date,
  add column if not exists event_type text,
  add column if not exists event_location text,
  add column if not exists prior_reason text,
  add column if not exists priority_score int not null default 0,
  add column if not exists enrichment_version text;

alter table reactivation_contacts
  add constraint reactivation_contacts_event_type_check
  check (event_type is null or event_type in ('wedding', 'corporate', 'school', 'birthday', 'fundraiser', 'community', 'private_event', 'other', 'unknown')),
  add constraint reactivation_contacts_priority_score_check
  check (priority_score between 0 and 100);

create index if not exists reactivation_contacts_event_date_idx
  on reactivation_contacts(campaign_id, event_date, status)
  where import_bucket is null or import_bucket <> 'exclude';

create index if not exists reactivation_contacts_event_type_idx
  on reactivation_contacts(campaign_id, event_type, status)
  where import_bucket is null or import_bucket <> 'exclude';

create index if not exists reactivation_contacts_priority_idx_v2
  on reactivation_contacts(campaign_id, priority_score desc, event_date, created_at)
  where import_bucket is null or import_bucket <> 'exclude';

-- Best-effort normalization for lists imported before enrichment existed. New
-- imports use the application parser, which handles more date formats safely.
update reactivation_contacts
set
  event_date = case
    when coalesce(import_metadata->>'Job Date', import_metadata->>'Event Date', import_metadata->>'job_date', import_metadata->>'event_date') ~ '^\d{4}-\d{2}-\d{2}$'
      then coalesce(import_metadata->>'Job Date', import_metadata->>'Event Date', import_metadata->>'job_date', import_metadata->>'event_date')::date
    else event_date
  end,
  event_type = case
    when lower(concat_ws(' ', import_metadata->>'Job Type', import_metadata->>'Event Type', import_metadata->>'Job Name', notes)) ~ '\m(wedding|bride|groom|bridal|reception)\M' then 'wedding'
    when lower(concat_ws(' ', import_metadata->>'Job Type', import_metadata->>'Event Type', import_metadata->>'Job Name', notes)) ~ '\m(corporate|company|conference)\M' then 'corporate'
    when lower(concat_ws(' ', import_metadata->>'Job Type', import_metadata->>'Event Type', import_metadata->>'Job Name', notes)) ~ '\m(prom|homecoming|school|graduation)\M' then 'school'
    when lower(concat_ws(' ', import_metadata->>'Job Type', import_metadata->>'Event Type', import_metadata->>'Job Name', notes)) ~ '\m(birthday|quinceanera)\M' then 'birthday'
    when lower(concat_ws(' ', import_metadata->>'Job Type', import_metadata->>'Event Type', import_metadata->>'Job Name', notes)) ~ '\m(fundraiser|charity|nonprofit)\M' then 'fundraiser'
    when lower(concat_ws(' ', import_metadata->>'Job Type', import_metadata->>'Event Type', import_metadata->>'Job Name', notes)) ~ '\m(festival|community)\M' then 'community'
    when lower(concat_ws(' ', import_metadata->>'Job Type', import_metadata->>'Event Type', import_metadata->>'Job Name', notes)) ~ '\m(party|anniversary|reunion)\M' then 'private_event'
    when coalesce(import_metadata->>'Job Type', import_metadata->>'Event Type', import_metadata->>'Job Name') is not null then 'other'
    else 'unknown'
  end,
  event_location = nullif(coalesce(import_metadata->>'Address', import_metadata->>'Location', import_metadata->>'Venue'), ''),
  prior_reason = nullif(coalesce(import_metadata->>'Closed Reason', import_metadata->>'Status'), ''),
  enrichment_version = 'deterministic_v1_backfill'
where enrichment_version is null;
