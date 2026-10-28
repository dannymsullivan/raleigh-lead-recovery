-- Run after 20261028220000_customer_retell_chat.sql with ON_ERROR_STOP=1.
-- Uses only fictional temporary workspaces; no provider calls or notifications.
begin;
set local statement_timeout = '20s';
create function pg_temp.expect_customer_chat_error(statement text, expected text)
returns void language plpgsql as $$
begin
  begin execute statement;
  exception when others then if sqlerrm = expected then return; end if; raise; end;
  raise exception 'Expected %', expected;
end;
$$;
do $$
declare
  a uuid := gen_random_uuid(); b uuid := gen_random_uuid(); article uuid := gen_random_uuid(); draft uuid := gen_random_uuid();
  token_a text := repeat(md5(gen_random_uuid()::text),2); token_b text := repeat(md5(gen_random_uuid()::text),2);
  token_new text := repeat(md5(gen_random_uuid()::text),2); token_b_new text := repeat(md5(gen_random_uuid()::text),2);
  ip text := repeat(md5(gen_random_uuid()::text),2); other_ip text := repeat(md5(gen_random_uuid()::text),2);
  hash_a text := repeat('a',64); hash_b text := repeat('b',64); message_hash text := repeat('c',64);
  sync_claim uuid := gen_random_uuid(); claim uuid := gen_random_uuid(); revision bigint; old_revision bigint; result jsonb; conversation uuid;
begin
  if has_table_privilege('anon','website_chat_agents','SELECT') or has_table_privilege('authenticated','website_chat_ai_turns','SELECT')
    or has_function_privilege('anon','claim_customer_chat_turn(uuid,text,text,uuid,text,text)','EXECUTE') then raise exception 'Customer AI storage permissions too broad'; end if;
  insert into clients(id,slug,business_name,trade,owner_name,owner_phone,pilot_start,pilot_end,product_mode,is_test_account)
    values(a,'sql-chat-'||a,'Fictional SQL A','test','Test','Not set',current_date,current_date+14,'website_chat',true),
          (b,'sql-chat-'||b,'Fictional SQL B','test','Test','Not set',current_date,current_date+14,'website_chat',true);
  insert into website_chat_settings(client_id,enabled,use_business_profile) values(a,true,false),(b,true,false);
  if (select engine from website_chat_settings where client_id=a) <> 'local' then raise exception 'Default engine was changed'; end if;
  insert into website_knowledge(id,client_id,title,content,published) values(article,a,'Hours','Open weekdays',true);
  perform pg_temp.expect_customer_chat_error(format('update website_knowledge set client_id=%L where id=%L',b,article),'chat_knowledge_tenant_immutable');
  revision := begin_customer_chat_sync(a,sync_claim,1000,1000);
  update website_chat_agents set retell_agent_id='test-agent-'||a,retell_llm_id='test-llm-'||a,retell_knowledge_base_id='test-kb-'||a where client_id=a;
  if not activate_customer_chat(a,sync_claim,revision,hash_a,1) then raise exception 'Explicit activation failed'; end if;
  sync_claim := gen_random_uuid(); revision := begin_customer_chat_sync(b,sync_claim,1,1);
  update website_chat_agents set retell_agent_id='test-agent-'||b,retell_llm_id='test-llm-'||b,retell_knowledge_base_id='test-kb-'||b where client_id=b;
  if not activate_customer_chat(b,sync_claim,revision,hash_b,1) then raise exception 'Second activation failed'; end if;
  insert into website_chats(client_id,access_token_hash,ip_hash,attribution,lead_name,lead_email,lead_request,lead_captured_at,contact_consent_at)
    values(a,token_a,ip,'{"utm_source":"test"}','Test','test@example.invalid','Callback',now(),now()) returning id into conversation;
  insert into website_chats(client_id,access_token_hash,ip_hash) values(b,token_b,ip);
  perform pg_temp.expect_customer_chat_error(format('select claim_customer_chat_turn(%L,%L,%L,%L,%L,%L)',b,token_a,ip,gen_random_uuid(),message_hash,hash_b),'chat_session_expired');
  perform pg_temp.expect_customer_chat_error(format('select claim_customer_chat_turn(%L,%L,%L,%L,%L,%L)',a,token_a,other_ip,gen_random_uuid(),message_hash,hash_a),'chat_session_expired');
  perform pg_temp.expect_customer_chat_error(format('select claim_customer_chat_turn(%L,%L,%L,%L,%L,%L)',a,token_a,ip,gen_random_uuid(),message_hash,hash_b),'chat_ai_not_ready');
  if exists(select 1 from website_chat_ai_turns where client_id in(a,b)) then raise exception 'Rejected calls consumed attempts'; end if;
  result := claim_customer_chat_turn(a,token_a,ip,claim,message_hash,hash_a);
  if result->>'agent_id' <> 'test-agent-'||a then raise exception 'Wrong tenant agent'; end if;
  perform pg_temp.expect_customer_chat_error(format('select claim_customer_chat_turn(%L,%L,%L,%L,%L,%L)',a,token_a,ip,gen_random_uuid(),message_hash,hash_a),'chat_session_busy');
  if attach_customer_chat(b,token_a,claim,'foreign') then raise exception 'Cross-tenant provider attach'; end if;
  if not attach_customer_chat(a,token_a,claim,'test-provider-'||a) then raise exception 'Provider attach failed'; end if;
  if finish_customer_chat_turn(a,token_a,gen_random_uuid(),true,'Hours?','Open weekdays','Hours') then raise exception 'Wrong claim finished'; end if;
  if not finish_customer_chat_turn(a,token_a,claim,true,'Hours?','Open weekdays','Hours') then raise exception 'Transcript save failed'; end if;
  if not exists(select 1 from website_chats where id=conversation and jsonb_array_length(messages)=2 and lead_email='test@example.invalid' and attribution->>'utm_source'='test' and contact_consent_at is not null) then raise exception 'Lead or attribution lost'; end if;
  perform pg_temp.expect_customer_chat_error(format('select claim_customer_chat_turn(%L,%L,%L,%L,%L,%L)',a,token_a,ip,gen_random_uuid(),message_hash,hash_a),'chat_message_replayed');

  -- Draft-only and excluded profile changes must not interrupt a published bot.
  select knowledge_revision into old_revision from website_chat_settings where client_id=a;
  insert into website_knowledge(id,client_id,title,content,published) values(draft,a,'Draft','Private draft',false);
  update website_knowledge set content='Changed private draft' where id=draft;
  update clients set services=array['A changed excluded profile service'] where id=a;
  if (select knowledge_revision from website_chat_settings where client_id=a) <> old_revision or (select status from website_chat_agents where client_id=a) <> 'ready' then raise exception 'Draft or excluded profile invalidated live knowledge'; end if;
  update website_knowledge set content='Now closed' where id=article;
  if (select status from website_chat_agents where client_id=a) <> 'stale' then raise exception 'Published edit failed to invalidate'; end if;
  perform pg_temp.expect_customer_chat_error(format('select claim_customer_chat_turn(%L,%L,%L,%L,%L,%L)',a,token_a,ip,gen_random_uuid(),repeat('d',64),hash_a),'chat_ai_not_ready');
  update website_chat_agents set status='ready',knowledge_revision=(select knowledge_revision from website_chat_settings where client_id=a),agent_version=2 where client_id=a;
  perform pg_temp.expect_customer_chat_error(format('select claim_customer_chat_turn(%L,%L,%L,%L,%L,%L)',a,token_a,ip,gen_random_uuid(),repeat('d',64),hash_a),'chat_session_restart');
  insert into website_chats(client_id,access_token_hash,ip_hash) values(a,token_new,ip);
  claim:=gen_random_uuid(); perform claim_customer_chat_turn(a,token_new,ip,claim,message_hash,hash_a);
  update website_knowledge set published=false where id=article;
  if finish_customer_chat_turn(a,token_new,claim,true,'Hours?','Stale fact','Hours') then raise exception 'In-flight stale answer escaped'; end if;
  if exists(select 1 from website_chats where access_token_hash=token_new and (jsonb_array_length(messages)>0 or not ai_failed)) then raise exception 'Failed answer state invalid'; end if;
  update website_chat_agents set status='ready',knowledge_revision=(select knowledge_revision from website_chat_settings where client_id=a) where client_id=a;
  perform pg_temp.expect_customer_chat_error(format('select claim_customer_chat_turn(%L,%L,%L,%L,%L,%L)',a,token_new,ip,gen_random_uuid(),message_hash,hash_a),'chat_session_restart');

  -- Failed provider attempts remain charged; a new conversation cannot reset the business cap.
  claim:=gen_random_uuid(); perform claim_customer_chat_turn(b,token_b,ip,claim,message_hash,hash_b);
  perform finish_customer_chat_turn(b,token_b,claim,false);
  insert into website_chats(client_id,access_token_hash,ip_hash) values(b,token_b_new,ip);
  perform pg_temp.expect_customer_chat_error(format('select claim_customer_chat_turn(%L,%L,%L,%L,%L,%L)',b,token_b_new,ip,gen_random_uuid(),message_hash,hash_b),'chat_rate_limit_business');
  if (select count(*) from website_chat_ai_turns where client_id=b) <> 1 then raise exception 'Failed attempt quota mismatch'; end if;

  -- Publishing is revision/claim checked and does not silently enable a paused widget.
  update website_chat_settings set enabled=false where client_id=a;
  sync_claim:=gen_random_uuid(); revision:=begin_customer_chat_sync(a,sync_claim,1000,1000);
  if activate_customer_chat(a,sync_claim,revision-1,hash_a,3) then raise exception 'Stale sync activated'; end if;
  if not activate_customer_chat(a,sync_claim,revision,hash_a,3) then raise exception 'Current sync failed'; end if;
  if (select enabled from website_chat_settings where client_id=a) then raise exception 'Sync enabled paused widget'; end if;
  perform pg_temp.expect_customer_chat_error(format('select claim_customer_chat_turn(%L,%L,%L,%L,%L,%L)',a,token_new,ip,gen_random_uuid(),message_hash,hash_a),'chat_disabled');
end;
$$;
rollback;
