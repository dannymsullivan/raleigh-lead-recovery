# Website lead email alerts

This is an opt-in email alert for a consented website inquiry, not an automatic message to the visitor or an appointment booking. The captured lead remains in `website_chats` regardless of email-provider failure.

## Setup

1. Apply `supabase/migrations/20261028221000_chat_lead_notifications.sql` after the website-chat migrations. It creates settings, a durable outbox, an enqueue trigger, and delivery claim/finish functions. There is no backfill and existing customers remain opted out.
2. Connect an authorized existing Resend sender by setting `CHAT_LEAD_EMAIL_PROVIDER=resend`, `RESEND_API_KEY`, and `CHAT_LEAD_EMAIL_FROM` (one verified sender email address). No provider account or subscription is created by this implementation. Without all three, the UI explicitly says delivery is not configured and no outbound request is made.
3. A signed-in customer opens **Settings → Manage lead alerts** (`/dashboard/notifications`); an authenticated admin uses **Customer → Website chat → Lead alert destination & delivery status**. Enter one recipient or team inbox, confirm control or recipient permission, and enable alerts. No default recipient is inferred from an account or existing business email.
4. After a consented lead is saved, `/api/chat` schedules `processChatLeadNotification({ clientId, chatId })` using Next.js `after`. The DB trigger has already inserted one unique outbox row in the lead-save transaction. Run no real-recipient tests without the user's explicit permission; unit tests mock all network requests.

## Delivery and recovery

- Alerts contain bounded name/email/phone/request text and a normal `/dashboard/chats` link requiring customer sign-in. They do not include public access tokens, recordings, full transcripts, or invented booking information.
- The outbox retains the original destination and payload. Atomic claims prevent concurrent workers; each request uses `website-chat-lead/<outbox-id>` as its Resend idempotency key. The same payload and key are reused on retry.
- A successful provider response is recorded as `sent`; the UI deliberately says **Sent to provider**, not delivered. Inbox delivery/bounce tracking is not implemented.
- Failed and unprocessed alerts appear in the authorized alert history with **Retry alert**. This is a durable manual retry path; there is no scheduled retry job. A retry never changes or deletes the lead.
- Retries stop after five attempts or 23 hours from the first provider attempt, inside Resend's documented 24-hour idempotency window. Ambiguous older outcomes require an operator to check the provider rather than risking a duplicate email. An unconfigured sender does not consume an attempt or start that clock.
- Pausing alerts or changing the destination stops delivery to the previous address. Historical alerts are never silently redirected to a newly entered recipient. A worker already in flight may still complete.
- The service-role client is the only database role permitted to access settings/outbox or invoke delivery functions. Every customer/admin mutation resolves and authorizes its workspace on the server; submitted tenant IDs are ignored.

Provider documentation: [Send Email](https://resend.com/docs/api-reference/emails/send-email), [Idempotency Keys](https://resend.com/docs/dashboard/emails/idempotency-keys).
