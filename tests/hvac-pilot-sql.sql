-- Run against a migrated test database. Everything is rolled back.
begin;
do $$
declare
  submission uuid := gen_random_uuid();
  ip text := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
  i integer;
begin
  perform submit_hvac_pilot_application(submission, ip, 'Pilot test', 'Test HVAC', 'pilot@example.test', 'https://example.test', 'Pilot details');
  perform submit_hvac_pilot_application(submission, ip, 'Pilot test', 'Test HVAC', 'pilot@example.test', 'https://example.test', 'Pilot details');
  assert (select count(*) from outreach_prospects where submission_id = submission) = 1, 'Retry must be idempotent';
  assert exists(select 1 from outreach_prospects where submission_id = submission and inbound_source = 'hvac_pilot' and notes like '%Email follow-up consent received:%'), 'Pilot source and consent must be recorded';
  assert not has_function_privilege('anon', 'public.submit_hvac_pilot_application(uuid,text,text,text,text,text,text)', 'execute'), 'Anonymous callers cannot bypass validation';
  assert not has_function_privilege('authenticated', 'public.submit_hvac_pilot_application(uuid,text,text,text,text,text,text)', 'execute'), 'Customer users cannot bypass validation';
  assert has_function_privilege('service_role', 'public.submit_hvac_pilot_application(uuid,text,text,text,text,text,text)', 'execute'), 'Server can save applications';
  for i in 1..4 loop
    perform submit_website_trial_request(gen_random_uuid(), ip, 'Trial test', 'Test HVAC', 'pilot@example.test', 'https://example.test', 'Standard trial');
  end loop;
  begin
    perform submit_hvac_pilot_application(gen_random_uuid(), ip, 'Pilot test', 'Test HVAC', 'pilot@example.test', 'https://example.test', 'Pilot details');
    raise exception 'Expected shared IP rate limit';
  exception when others then
    if sqlerrm <> 'rate_limit' then raise; end if;
  end;
  begin
    perform submit_hvac_pilot_application(gen_random_uuid(), repeat('b',64), 'Pilot test', 'Test HVAC', 'pilot@example.test', '', 'Pilot details');
    raise exception 'Expected required website';
  exception when others then
    if sqlerrm <> 'invalid_request' then raise; end if;
  end;
end;
$$;
rollback;
