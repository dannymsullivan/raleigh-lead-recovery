-- Pilot applications use the existing prospect inbox, with a distinct source and offer.
create function public.submit_hvac_pilot_application(
  p_submission_id uuid, p_ip_hash text, p_name text, p_business text,
  p_email text, p_website text, p_needs text
) returns void language plpgsql security definer set search_path = public as $$
begin
  if p_submission_id is null or length(coalesce(p_ip_hash, '')) <> 64
    or length(trim(coalesce(p_name, ''))) not between 1 and 100
    or length(trim(coalesce(p_business, ''))) not between 1 and 160
    or length(coalesce(p_email, '')) not between 3 and 200
    or length(trim(coalesce(p_website, ''))) not between 1 and 500
    or length(trim(coalesce(p_needs, ''))) not between 1 and 2000 then
    raise exception 'invalid_request';
  end if;
  -- Same lock and per-IP quota as standard trials; a separate global pilot quota.
  perform pg_advisory_xact_lock(hashtext('website_trial_requests'));
  if exists(select 1 from outreach_prospects where submission_id = p_submission_id) then return; end if;
  if (select count(*) from outreach_prospects where inbound_source = 'hvac_pilot' and created_at > now() - interval '1 hour') >= 100
    or (select count(*) from outreach_prospects where request_ip_hash = p_ip_hash and created_at > now() - interval '1 hour') >= 5 then
    raise exception 'rate_limit';
  end if;
  insert into outreach_prospects(company_name, contact_name, email, website, stage, next_follow_up_on, inbound_source, submission_id, request_ip_hash, notes)
    values(p_business, p_name, p_email, p_website, 'replied', current_date, 'hvac_pilot', p_submission_id, p_ip_hash,
      p_needs || E'\n\n' || 'Email follow-up consent received: ' || now()::text);
end;
$$;
revoke all on function public.submit_hvac_pilot_application(uuid,text,text,text,text,text,text) from public, anon, authenticated;
grant execute on function public.submit_hvac_pilot_application(uuid,text,text,text,text,text,text) to service_role;
