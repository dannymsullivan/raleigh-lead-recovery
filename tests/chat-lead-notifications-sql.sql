-- Run after the migration inside an isolated test transaction. No provider calls occur.
begin;
do $$
declare
  customer uuid := gen_random_uuid();
  chat uuid := gen_random_uuid();
  no_consent uuid := gen_random_uuid();
  item website_chat_notification_outbox;
  again website_chat_notification_outbox;
  payload jsonb := jsonb_build_object('from', 'alerts@example.test', 'to', jsonb_build_array('team@example.test'), 'subject', 'New inquiry', 'text', 'Test request');
  total integer;
begin
  insert into clients(id, slug, business_name, trade, owner_name, owner_phone, pilot_start, pilot_end, is_test_account)
    values(customer, 'internal-notification-test-' || customer::text, 'Notification test', 'service business', 'Test', 'Not set', current_date, current_date + 14, true);
  insert into website_chat_notification_settings(client_id, enabled, destination_email, destination_label, consented_at, configured_by)
    values(customer, true, 'team@example.test', 'Dispatch', now(), 'admin');
  insert into website_chats(id, client_id, access_token_hash, ip_hash, lead_name, lead_email, lead_request, lead_captured_at, contact_consent_at)
    values(chat, customer, encode(gen_random_bytes(32), 'hex'), repeat('a', 64), 'Visitor', 'visitor@example.test', 'Help with a repair', now(), now());
  insert into website_chats(id, client_id, access_token_hash, ip_hash, lead_captured_at)
    values(no_consent, customer, encode(gen_random_bytes(32), 'hex'), repeat('a', 64), now());
  select count(*) into total from website_chat_notification_outbox where client_id = customer;
  assert total = 1, 'Only consented captured leads enqueue';
  update website_chats set lead_captured_at = now() where id = chat;
  select count(*) into total from website_chat_notification_outbox where client_id = customer;
  assert total = 1, 'Repeated capture does not duplicate alerts';

  select count(*) into total from claim_website_chat_notification(gen_random_uuid(), chat, payload);
  assert total = 0, 'A different tenant cannot claim an alert';
  select * into item from claim_website_chat_notification(customer, chat, payload);
  assert item.status = 'sending' and item.attempts = 1, 'First worker receives a claim';
  select count(*) into total from claim_website_chat_notification(customer, chat, payload);
  assert total = 0, 'Concurrent worker cannot send the same alert';
  perform finish_website_chat_notification(item.id, gen_random_uuid(), 'forged-message', null);
  select * into again from website_chat_notification_outbox where id = item.id;
  assert again.status = 'sending', 'An obsolete token cannot finish a claim';
  perform finish_website_chat_notification(item.id, item.claim_token, null, 'provider_request_failed');
  assert exists(select 1 from website_chats where id = chat and lead_captured_at is not null), 'Provider failure preserves captured lead';
  select * into item from claim_website_chat_notification(customer, chat, payload || '{"text":"changed body"}'::jsonb);
  assert item.payload->>'text' = 'Test request', 'Retry retains original provider payload';
  assert item.attempts = 2, 'Retry increments attempts once';
  perform finish_website_chat_notification(item.id, item.claim_token, 'provider-message-1', null);
  select count(*) into total from claim_website_chat_notification(customer, chat, payload);
  assert total = 0, 'Sent alerts never resend';

  -- Simulate ambiguous old/stale and paused delivery records without invoking any email provider.
  update website_chat_notification_outbox set status = 'failed', first_attempt_at = now() - interval '23 hours', sent_at = null, provider_message_id = null where id = item.id;
  select count(*) into total from claim_website_chat_notification(customer, chat, payload);
  assert total = 0, 'Expired idempotency safety window stops retry';
  assert exists(select 1 from website_chat_notification_outbox where id = item.id and last_error = 'review_required');
  update website_chat_notification_outbox set first_attempt_at = now(), attempts = 5 where id = item.id;
  select count(*) into total from claim_website_chat_notification(customer, chat, payload);
  assert total = 0, 'Attempt budget stops retry';
  update website_chat_notification_outbox set attempts = 0, first_attempt_at = null where id = item.id;
  update website_chat_notification_settings set enabled = false where client_id = customer;
  select count(*) into total from claim_website_chat_notification(customer, chat, payload);
  assert total = 0, 'Paused recipient cannot receive queued mail';
  update website_chat_notification_settings set enabled = true, destination_email = 'changed@example.test' where client_id = customer;
  select count(*) into total from claim_website_chat_notification(customer, chat, payload);
  assert total = 0, 'Recipient changes never redirect old alerts';

  assert not has_table_privilege('anon', 'website_chat_notification_outbox', 'select'), 'Anonymous users cannot read visitor data';
  assert not has_table_privilege('authenticated', 'website_chat_notification_settings', 'update'), 'Settings require checked server actions';
  assert not has_function_privilege('authenticated', 'claim_website_chat_notification(uuid,uuid,jsonb)', 'execute'), 'Clients cannot directly dispatch email';
end;
$$;
rollback;
