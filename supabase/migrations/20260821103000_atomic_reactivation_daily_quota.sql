alter table reactivation_campaigns
  add column if not exists daily_quota_date date,
  add column if not exists daily_quota_reserved int not null default 0
    check (daily_quota_reserved >= 0);

comment on column reactivation_campaigns.daily_quota_reserved is
  'Atomic call-cap reservations for daily_quota_date in the campaign calling timezone.';

create or replace function reserve_reactivation_daily_capacity(
  p_campaign_id uuid,
  p_requested int
) returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  campaign_record record;
  local_day date;
  local_day_start timestamptz;
  attempts_today int;
  already_reserved int;
  capacity int;
begin
  if p_requested is null or p_requested < 1 then
    return 0;
  end if;

  -- Serialize every reservation for a campaign, including overlapping cron,
  -- launch, and resume requests.
  perform pg_advisory_xact_lock(hashtextextended(p_campaign_id::text, 0));

  select calling_timezone, daily_limit, daily_quota_date, daily_quota_reserved
  into campaign_record
  from reactivation_campaigns
  where id = p_campaign_id
  for update;

  if not found then
    return 0;
  end if;

  local_day := (now() at time zone campaign_record.calling_timezone)::date;
  local_day_start := local_day::timestamp at time zone campaign_record.calling_timezone;

  select count(*)::int
  into attempts_today
  from reactivation_attempts
  where campaign_id = p_campaign_id
    and created_at >= local_day_start;

  already_reserved := case
    when campaign_record.daily_quota_date = local_day
      then greatest(campaign_record.daily_quota_reserved, attempts_today)
    else attempts_today
  end;

  capacity := least(
    greatest(p_requested, 0),
    greatest(campaign_record.daily_limit - already_reserved, 0)
  );

  update reactivation_campaigns
  set daily_quota_date = local_day,
      daily_quota_reserved = already_reserved + capacity
  where id = p_campaign_id;

  return capacity;
end;
$$;

revoke all on function reserve_reactivation_daily_capacity(uuid, int) from public, anon, authenticated;
grant execute on function reserve_reactivation_daily_capacity(uuid, int) to service_role;
