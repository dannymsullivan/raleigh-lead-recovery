# Customer AI chat setup

Customer AI is opt-in. Applying `20261028220000_customer_retell_chat.sql` leaves existing and new workspaces on the local approved-answer engine until an operator explicitly provisions a named customer. The public Oak City demo is separate and is never a customer fallback.

## Prepare and activate one customer

1. Apply the migration. Run `tests/customer-chat-sql.sql` with `psql -v ON_ERROR_STOP=1`; it creates fictional workspaces and rolls everything back without contacting Retell.
2. Create the customer workspace, enter approved knowledge, and choose whether its public business profile belongs in the assistant. Agree on usage and provider processing with the customer. Do not include internal owner contact information or unpublished material.
3. Set server-only `RETELL_API_KEY`, `SUPABASE_URL`, `SUPABASE_SECRET_KEY` (or `SUPABASE_SERVICE_ROLE_KEY`), and `CHAT_SESSION_SECRET` (or the existing `DEMO_CALL_HASH_SECRET`). Resource IDs are stored in the tenant-scoped database, never public environment variables or browser requests.
4. Review a read-only plan with an explicit slug and allowance:

   ```sh
   npx tsx scripts/sync-customer-chat.ts --workspace example-repair --monthly-attempts 1000 --daily-attempts 100 --dry-run
   ```

   These numbers illustrate the command; they are not a published customer package.

5. Replace `--dry-run` with `--activate` to create or sync only that customer's agent and knowledge base. This performs provider writes and may incur provider charges. If indexing is still running, rerun the same command after it finishes. The saved KB is reused; edited text sources are reconciled inside it, so edits do not accumulate billable KBs. An unexpected manual source or conflicting resource is rejected for operator review.
6. Enable the customer's widget through its existing knowledge settings if ready. Activation never turns on a paused widget. Test that customer's hosted chat, source citations, follow-up form, transcript, and source attribution before installing the widget. Do not count a submitted request as a confirmed appointment.

Each business has a unique dedicated agent, LLM and KB mapping. The agent is published only when its indexed text-source set matches the approved knowledge. Resource names and unique database constraints prevent accidental reuse; known demo resources are expressly rejected. Provider contact memory and action tools are disabled. Retell retains provider chat data for up to seven days; the app retains its own business transcript and consented lead record.

## Changes and failures

Publishing, editing or unpublishing an approved article marks AI knowledge stale and immediately blocks new generated answers until the operator resyncs. Draft-only edits do not interrupt the live assistant. Public profile changes invalidate when profile inclusion is enabled; business name changes always invalidate the assistant identity. The consented follow-up form remains usable. Sync is explicit so ordinary customer edits cannot create unapproved provider resources or spend.

New sessions pin the published agent version and knowledge revision. Existing sessions must restart after either changes. Revisions are checked before spending and again before saving/returning the answer. A failed/uncertain provider turn requires a new conversation so a mismatched provider history is not silently reused. Earlier saved leads and transcripts remain intact. Provider IDs never leave the server.

Usage limits count AI attempts before provider calls, including provider failures: 40 per conversation, 100 per IP/business over 24 hours, plus the explicitly configured business rolling-day and calendar-month (UTC) allowances. Existing session-start abuse controls still apply. These are spend controls, not a dollar ceiling or billable customer usage contract. Concurrency claims and a 90-second lease prevent overlapping questions; provider calls disable automatic retries.

To pause service, use the existing enable/disable control. To return to the local engine, an operator can change that customer's `website_chat_settings.engine` to `local`; this does not delete provider resources or past conversations. Do not automatically fall back to another customer or the public demo on provider errors.

## Verification

Run `tests/customer-chat.test.ts`, `tests/customer-chat-provisioning.test.ts`, `tests/chat-route.test.ts`, the SQL fixture, TypeScript, and lint before activation. No real customer or provider resources are created by the unit tests. The dry run reads only the explicitly named workspace and prints counts and configuration intent, not article contents or credentials.
