alter table clients
  add column if not exists slug text;

with normalized as (
  select
    id,
    coalesce(
      nullif(trim(both '-' from regexp_replace(lower(business_name), '[^a-z0-9]+', '-', 'g')), ''),
      'customer'
    ) as base_slug,
    row_number() over (
      partition by coalesce(
        nullif(trim(both '-' from regexp_replace(lower(business_name), '[^a-z0-9]+', '-', 'g')), ''),
        'customer'
      )
      order by created_at, id
    ) as duplicate_number
  from clients
), resolved as (
  select
    id,
    case
      when duplicate_number = 1 then base_slug
      else base_slug || '-' || duplicate_number::text
    end as resolved_slug
  from normalized
)
update clients
set slug = resolved.resolved_slug
from resolved
where clients.id = resolved.id
  and clients.slug is null;

alter table clients
  alter column slug set not null;

create unique index if not exists clients_slug_idx
  on clients(slug);

alter table clients
  add constraint clients_slug_format_check
  check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$');

comment on column clients.slug is
  'Stable human-readable identifier used in internal CRM URLs.';
