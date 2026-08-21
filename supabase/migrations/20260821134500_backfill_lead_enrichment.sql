with raw_dates as (
  select
    id,
    trim(coalesce(import_metadata->>'Job Date', import_metadata->>'Event Date', import_metadata->>'job_date', import_metadata->>'event_date')) as raw_date
  from reactivation_contacts
  where event_date is null
)
update reactivation_contacts as contact
set event_date = case
  when raw_dates.raw_date ~ '^\d{4}-\d{2}-\d{2}' then substring(raw_dates.raw_date from 1 for 10)::date
  when raw_dates.raw_date ~ '^\d{1,2}/\d{1,2}/\d{4}$' then to_date(raw_dates.raw_date, 'MM/DD/YYYY')
  else contact.event_date
end
from raw_dates
where contact.id = raw_dates.id
  and (
    raw_dates.raw_date ~ '^\d{4}-\d{2}-\d{2}'
    or raw_dates.raw_date ~ '^\d{1,2}/\d{1,2}/\d{4}$'
  );

update reactivation_contacts
set priority_score = greatest(0, least(100,
  20
  + case
      when event_date > current_date and event_date <= current_date + 14 then 45
      when event_date > current_date + 14 and event_date <= current_date + 30 then 35
      when event_date > current_date + 30 and event_date <= current_date + 90 then 20
      when event_date > current_date + 90 then 5
      else 0
    end
  + case import_bucket
      when 'ready_to_reengage' then 20
      when 'price_sensitive' then 12
      when 'timing_or_capacity' then 8
      when 'lost_elsewhere' then -15
      when 'review' then -10
      else 0
    end
  + case when event_type not in ('unknown', 'other') then 5 else 0 end
  + case when lead_age_days between 0 and 30 then 8 else 0 end
));
