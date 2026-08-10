# Raleigh Lead Recovery SaaS Architecture

Last updated: 2026-08-10

## Product promise

A service-business owner creates an account, teaches Mabel the business, receives a forwarding number, makes a test call, and sees the resulting lead in the dashboard without an operator editing Vapi or Supabase by hand.

## Customer lifecycle

```text
account created
  -> onboarding
  -> trialing / provisioning
  -> assistant ready
  -> number ready
  -> forwarding confirmed
  -> test call verified
  -> live trial
  -> active subscription | grace period | canceled
```

Each transition must be idempotent and retryable. Store the external Vapi, carrier, and Stripe identifiers before moving to the next transition. Never assume a timed-out API call failed; reconcile by external ID or workspace metadata before creating a duplicate.

## Signup and onboarding

1. Supabase Auth creates the user.
2. The app creates one client workspace linked by `clients.user_id`.
3. Onboarding collects business identity, services, coverage, hours, emergency rules, callback promise, timezone, and alert phone.
4. Completing onboarding starts the 14-day trial and queues provisioning.
5. The customer can edit these settings later. Saving settings patches the existing Vapi assistant rather than creating another one.

Before a public launch, evolve `clients.user_id` into `organizations` plus `organization_members` so owners can invite dispatchers and office staff. Enforce all customer access with organization-scoped RLS policies; the current server-side ownership check is appropriate for the first single-owner beta.

## Assistant provisioning

Provisioning is a state machine stored in `clients.provisioning_status`:

- `pending`: onboarding completed and work queued.
- `provisioning`: an API attempt is in progress.
- `ready`: both assistant and number exist.
- `needs_configuration`: required platform environment variables are missing.
- `error`: a provider call failed; retain the error and expose Retry.

The provisioning function is idempotent:

1. Load the workspace.
2. Create Mabel only if `vapi_assistant_id` is empty; otherwise patch her when settings change.
3. Create a number only if `vapi_phone_number_id` is empty.
4. Store each external ID immediately.
5. Mark ready only after both resources exist.

The prompt is generated from structured business data. Keep safety rules in the application-controlled section, not editable customer text. Mabel must not invent prices, arrival times, availability, or emergency dispatch.

## Phone-number strategy

### Beta: Vapi-provided numbers

Use Vapi's phone-number API with `provider: "vapi"`, the assistant ID, and the desired US area code. This is implemented and is the fastest way to activate the first trials. Vapi currently limits free numbers to five per account, so this is not the scale path.

### Production: Twilio-owned numbers imported into Vapi

Use a provider adapter with these steps:

1. Create or select a Twilio subaccount for the customer.
2. Search inventory by the customer's desired area code.
3. Purchase one local or toll-free number.
4. Register messaging/A2P requirements before relying on outbound SMS.
5. Create the corresponding Vapi phone-number resource using a Vapi credential for that Twilio subaccount.
6. Attach the customer's assistant.
7. Store the Twilio SID, subaccount SID, Vapi number ID, E.164 number, and provider.

A Twilio subaccount per customer improves cost attribution, incident isolation, credential rotation, and eventual number transfer. A shared master account is simpler for the first few paid customers but becomes operationally messy.

### Existing business numbers

Do not port the customer's main number during trial. Provision a separate recovery number and have the customer enable conditional forwarding for busy, no-answer, and after-hours calls. Carrier settings cannot be reliably automated across every provider, so the dashboard should show carrier-specific instructions and verify success with an inbound call.

Later options:

- Import a Twilio number the customer already owns.
- Port the business number after a successful trial.
- Use SIP trunking for larger phone systems.

## Activation and test call

The dashboard checklist is the source of truth:

1. Mabel configured.
2. Recovery number assigned.
3. Conditional forwarding confirmed by the owner.
4. Inbound test call received by the webhook.

The first inbound webhook automatically sets `test_call_completed_at` and verifies the routing path end to end: carrier -> Vapi -> webhook -> database -> owner alert.

## Call processing

1. Validate the Vapi webhook secret.
2. Accept only end-of-call reports.
3. Match the client by assistant ID or phone-number ID.
4. Upsert by Vapi call ID for idempotency.
5. Persist structured intake, summary, transcript, recording URL, and raw payload.
6. Claim the SMS notification before sending to prevent duplicates.
7. Alert `alert_phone`, falling back to the owner phone.
8. Release the SMS claim on failure so it can be retried.

Add a scheduled reconciliation job before launch to retry failed notifications, detect provisioning stuck longer than ten minutes, and compare provider resources against local records.

## Owner dashboard

The owner needs to answer four questions immediately:

1. What needs my attention now?
2. Who do I call and why?
3. What happened after the callback?
4. Is Mabel live and working?

The implemented dashboard includes:

- New, contacted, booked, lost, and spam lead states.
- Caller number, address, issue, urgency, timing, recording, transcript, and notes.
- Estimated opportunity and owner-confirmed booked value.
- Trial metrics and days remaining.
- Provisioning state, recovery number, forwarding confirmation, and test-call verification.
- Editable business, service, schedule, routing, emergency, and callback settings.

Next dashboard additions after live usage proves the workflow:

- Team invitations and role-based assignments.
- Callback reminders and overdue-lead queues.
- Search, date filters, and CSV export.
- Appointment/CRM sync.
- Per-call cost and monthly usage.
- Notification channels beyond SMS.

## Billing and trial expiration

Use Stripe Checkout, Customer Portal, and webhooks. Store customer, subscription, price, and current-period identifiers on the organization.

Recommended early offer:

- 14 days, no card.
- One trial per verified business phone.
- Usage cap to control abuse.
- Upgrade reminders on days 7, 11, 13, and 14.
- Three-day grace period after trial expiration.

Do not silently stop answering while a customer still forwards calls. During grace, continue handling calls and notify the owner prominently. Before suspension, require the owner to disable forwarding or provide a safe fallback destination. Billing webhooks—not browser redirects—must control subscription state.

## Security, privacy, and compliance

- Keep Supabase secret, Vapi private key, Twilio credentials, and Stripe secret server-only.
- Use RLS and organization membership for every customer-owned table before multi-user launch.
- Never expose public report URLs for real customer data.
- Apply retention controls to raw payloads, transcripts, and recordings.
- Give owners a recording toggle and approved disclosure language.
- Clearly disclose that Mabel is automated.
- Document emergency limitations; Mabel captures and escalates but does not promise dispatch.
- Obtain legal review for call recording, automated-call disclosure, SMS, healthcare, and state-specific requirements before broad rollout.

## Reliability and observability

Track these events with workspace and provider correlation IDs:

- signup completed
- onboarding completed
- provisioning started/succeeded/failed
- forwarding confirmed
- first call received
- webhook rejected/unmatched
- lead SMS sent/failed
- trial expiring/expired
- subscription activated/past due/canceled

Alert on unmatched webhooks, repeated provisioning failures, SMS failure rate, calls with missing structured data, and any active number without a matching client. Keep a manual admin override for retries, number replacement, and account suspension.

## Deployment gates

Before accepting public trials:

- Apply all Supabase migrations.
- Configure Supabase Auth email templates and production redirect URLs.
- Configure Vapi, Twilio, and public webhook secrets.
- Verify webhook authentication and idempotency in production.
- Decide beta Vapi-number capacity versus Twilio provider adapter.
- Add Stripe plans and subscription webhooks.
- Add Terms, Privacy, recording disclosure, and deletion/retention flows.
- Run one complete signup-to-test-call canary with no admin intervention.
