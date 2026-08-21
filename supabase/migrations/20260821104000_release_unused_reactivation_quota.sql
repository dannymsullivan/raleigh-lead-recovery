create or replace function release_reactivation_daily_capacity(
  p_campaign_id uuid,
  p_unused int
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  campaign_record record;
  local_day date;
begin
  if p_unused is null or p_unused < 1 then
    return;
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_campaign_id::text, 0));

  select calling_timezone, daily_quota_date
  into campaign_record
  from reactivation_campaigns
  where id = p_campaign_id
  for update;

  if not found then
    return;
  end if;

  local_day := (now() at time zone campaign_record.calling_timezone)::date;
  if campaign_record.daily_quota_date = local_day then
    update reactivation_campaigns
    set daily_quota_reserved = greatest(daily_quota_reserved - p_unused, 0)
    where id = p_campaign_id;
  end if;
end;
$$;

revoke all on function release_reactivation_daily_capacity(uuid, int) from public, anon, authenticated;
grant execute on function release_reactivation_daily_capacity(uuid, int) to service_role;
