# Lead Reactivation Readiness Audit

Last checked: 2026-08-18

## Executive summary

Raleigh Lead Recovery has a working foundation for authentication, Vapi call ingestion, Supabase storage, Twilio alerts, and a private customer dashboard. That foundation currently implements **inbound missed-call recovery**.

The new homepage and public `/demo` route now show the intended **outbound old-lead reactivation** product. The demo is a complete customer-view prototype, but it uses clearly labeled sample data. A reusable roofing-demo Mabel assistant can now be provisioned with `npm run vapi:setup-reactivation`. A real customer campaign still needs campaign/contact tables, list eligibility controls, outbound call orchestration, and production canary testing.

## What is live and working

### Deployment

- The Vercel project is linked and its latest production deployment reports `Ready`.
- `https://www.raleighleadrecovery.com`, `/login`, and `/signup` returned HTTP 200 during this audit.
- Production variable names exist for Supabase, Vapi, Twilio, the authentication hook, the app URL, and the webhook URL.

### Authentication and customer workspaces

- Signup and login use Supabase phone OTP.
- A signed authentication hook at `/api/auth/send-sms` sends the OTP through the configured Twilio account.
- Signup creates one Supabase `clients` workspace per authenticated user.
- Incomplete customers are routed through onboarding before the authenticated dashboard opens.
- Auth cookies are refreshed through the Next.js proxy.

### Voice and logging foundation

- The locally configured Vapi account currently has one assistant and one Vapi-hosted phone number.
- That assistant is labeled for the legacy `missed-call-recovery` application.
- Vapi end-of-call reports are authenticated, normalized, matched to a customer by assistant/phone ID, and upserted idempotently into Supabase.
- Owner SMS delivery is claimed before sending to prevent duplicate alerts.
- Call summaries, transcripts, recordings, lead status, owner notes, and booked value are supported by the existing dashboard.

### Reactivation demo

- `/demo` is a public, noindex sample dashboard that requires no credentials.
- It shows the full intended customer story: uploaded records, attempts, conversations, interested leads, booked inspections, estimated pipeline, campaign settings, launch checks, lead dispositions, summaries, and transcript excerpts.
- Sample phone numbers are masked and every sample metric is labeled illustrative.
- Homepage and login both link to the demo.

## What does not exist yet

### 1. A real outbound reactivation campaign model

The database only has `clients` and inbound-style `calls`. Add:

- `campaigns`
- `campaign_contacts`
- `call_attempts`
- `appointments`
- `suppression_entries`
- `demo_call_requests`

The public demo should eventually read from those same concepts, while the current missed-call dashboard remains available as a separate product mode.

### 2. Production outbound Mabel configuration

The repository now includes a separate, reusable lead-reactivation demo assistant with recording, disclosure, roofing qualification, opt-out handling, and structured outcomes. Before customer campaigns, it still needs:

- Customer, lead-source, and prior-inquiry context.
- Appointment booking or controlled live transfer.
- Campaign-level voicemail and retry policies.
- A webhook/data path that maps its structured outcomes into the reactivation dashboard.

### 3. List upload and launch controls

Before calls can be placed, build:

- CSV import and phone normalization.
- Duplicate detection.
- Eligibility attestation by the customer.
- Internal and customer-level suppression matching.
- Calling-window/timezone enforcement.
- Attempt caps and pacing.
- A preflight preview and emergency stop.

### 4. Live reactivation reporting

The new `/demo` page is a product prototype, not a database-backed campaign. The production dashboard must calculate:

- Eligible records.
- Attempts and unique contacts attempted.
- Connections and meaningful conversations.
- Interested and qualified leads.
- Appointments and live transfers.
- Opt-outs, wrong numbers, and completed projects.
- Customer-confirmed pipeline and closed revenue.

### 5. Production canary coverage

Code, unit, build, and public-route checks pass, but this audit did not send an OTP or call a real consumer. Run one controlled canary using a phone number the owner controls:

1. Sign up on production.
2. Receive and verify the Twilio-backed Supabase OTP.
3. Complete onboarding.
4. Confirm Vapi provisioning completes.
5. Place a test call.
6. Confirm the webhook creates one record.
7. Confirm the owner SMS arrives once.
8. Confirm the authenticated dashboard displays the call.

Repeat the canary after the outbound campaign model exists using one explicitly opted-in test contact.

## Twilio decision

### What was verified

- Production Twilio variable names are present in Vercel.
- Vercel stores them as Sensitive values, so the CLI cannot retrieve them for an account-status API check.
- The current account tier therefore could not be proven from this environment.

### What is required

A paid Twilio account is required for the planned production flow. Twilio trial accounts expire, limit calling/messaging to verified recipients, and allow only one Twilio number. Trial accounts also cannot register for A2P 10DLC.

For SMS:

- A US local 10DLC sender needs an approved A2P 10DLC brand/campaign.
- A toll-free sender is outside A2P 10DLC but needs toll-free verification.
- OTP can alternatively move to Twilio Verify, but the current app uses the custom Supabase send-SMS hook and `TWILIO_FROM_NUMBER`.

Recommended next action: open Twilio Console, confirm the project shows a paid balance/account, identify the configured `TWILIO_FROM_NUMBER`, and verify its messaging registration status before the production canary.

Official references:

- Twilio trial limits: https://www.twilio.com/docs/usage/trials
- Twilio A2P 10DLC: https://www.twilio.com/docs/messaging/compliance/a2p-10dlc
- A2P registration quickstart: https://www.twilio.com/docs/messaging/compliance/a2p-10dlc/quickstart

## Email forwarding

The domain's public DNS is configured for Namecheap email forwarding:

- MX: `eforward1–5.registrar-servers.com`
- SPF: `include:spf.efwd.registrar-servers.com`

The site now uses `danny@raleighleadrecovery.com`. The Namecheap Email Forwarding control panel was checked during setup and the alias was confirmed as forwarding to `danny@raleighaiguy.com`. A final delivery test is still recommended before depending on it for a paid campaign.

## Recommended build order

1. Confirm paid Twilio status, sender type, and messaging registration.
2. Run the existing inbound signup-to-dashboard production canary.
3. Add the reactivation campaign schema and migrations.
4. Build CSV preflight, eligibility, suppression, and calling controls.
5. Create the separate outbound Mabel assistant and Vapi call trigger.
6. Connect real campaign events to the dashboard modeled by `/demo`.
7. Add calendar booking/live transfer and customer notifications.
8. Run an opted-in outbound canary and review every transcript/disposition.
9. Start one capped 250–500-record design-partner pilot after legal/compliance review.
