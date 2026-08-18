# Lead Reactivation Readiness Audit

Last checked: 2026-08-18

## Executive summary

Raleigh Lead Recovery now has the production software path for **outbound prior-lead reactivation**: authentication, customer workspaces, CSV imports, eligibility controls, campaign pacing, outbound calls through Mabel, Vapi webhook ingestion, Supabase reporting, suppression handling, immediate Twilio owner alerts, and a private customer dashboard.

The upgraded Twilio number is imported into the correct Vapi organization and the production assistant and phone-number IDs are configured in Vercel. The remaining gates are operational rather than missing core product code: redeploy the new build, run an explicitly opted-in end-to-end canary, complete the appropriate Twilio messaging registration, and obtain compliance review before calling a real customer list.

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

### Voice and logging

- Vapi contains separate demo and production Mabel lead-reactivation assistants.
- The upgraded Twilio number `+1 984 253 8680` is imported into Vapi for outbound calling.
- Vapi end-of-call reports are authenticated, normalized, matched to a customer by assistant/phone ID, and upserted idempotently into Supabase.
- Reactivation metadata maps each report to its customer, campaign, contact, and attempt.
- Opt-outs are added to the suppression list, no-answers can be retried, and interested leads trigger idempotent owner alerts.
- Call summaries, transcripts, recordings, outcomes, lead status, owner handoff, appointments, and estimated booked value are supported by the live dashboard.

### Reactivation demo

- `/demo` is a public, noindex sample dashboard that requires no credentials.
- It shows the full intended customer story: uploaded records, attempts, conversations, interested leads, booked inspections, estimated pipeline, campaign settings, launch checks, lead dispositions, summaries, and transcript excerpts.
- Sample phone numbers are masked and every sample metric is labeled illustrative.
- Homepage and login both link to the demo.

## Production capabilities now implemented

### 1. Outbound campaign model

The production database includes `reactivation_campaigns`, `reactivation_contacts`, `reactivation_attempts`, `reactivation_appointments`, and `suppression_entries`, with tenant-scoped constraints, indexes, RLS, and timestamps. The legacy missed-call dashboard remains available as a separate product mode.

### 2. Production outbound Mabel

The production assistant receives customer, source, lead-age, service, and prior-inquiry context as call variables. It discloses that it is automated, qualifies current interest, records opt-outs, requests an owner callback or inspection, and returns structured outcomes with recordings and transcripts. It does not invent or directly confirm calendar availability.

### 3. List and launch controls

CSV parsing, US phone normalization, invalid-row filtering, duplicate detection, eligibility attestation, customer-level suppression matching, calling-window enforcement, attempt caps, daily caps, controlled batch size, retry timing, and pause/resume controls are implemented. Launch and resume start an immediate batch; a plan-compatible daily Vercel runner continues active Raleigh campaigns at 9:00 a.m. EST / 10:00 a.m. EDT. Campaign launch remains locked unless all production telephony environment variables exist.

### 4. Live reactivation reporting and handoff

The authenticated `/dashboard/reactivation` route reads live campaign data and shows records, attempts, outcomes, recordings, transcripts, interested leads, bookings, and estimated pipeline. Interested leads appear first, trigger an immediate owner SMS, and provide click-to-call, contacted, and booking actions. Direct calendar-slot confirmation and live call transfer are future enhancements, not requirements for the owner-callback pilot flow.

## Remaining production gates

### 1. Production canary

Code, unit, lint, and production build checks pass, but this audit has not placed an outbound call. Run one controlled canary using an explicitly opted-in phone number the owner controls:

1. Sign up on production and complete onboarding.
2. Create a campaign with a daily limit of one.
3. Import one eligible test contact and launch it during the configured calling window.
4. Confirm the call originates from the Twilio number and Mabel receives the expected variables.
5. Complete an interested conversation and confirm one attempt, transcript, recording, and structured outcome appear.
6. Confirm the interested lead moves to the priority queue and exactly one owner SMS arrives.
7. Use the dashboard to call the lead, mark it contacted, and record a booking.
8. Test an opt-out with a second controlled number and confirm it cannot be called again.

## Twilio decision

### What was verified

- The Twilio account is upgraded, active, and funded.
- The active local number is `+1 984 253 8680` with voice and SMS capability.
- The number is imported into Vapi as **Raleigh Lead Recovery Outbound**.
- Production Vercel contains the outbound assistant ID, outbound phone-number ID, and protected cron secret as sensitive values.

### What is required

A paid Twilio account is required for the planned production flow. Twilio trial accounts expire, limit calling/messaging to verified recipients, and allow only one Twilio number. Trial accounts also cannot register for A2P 10DLC.

For SMS:

- A US local 10DLC sender needs an approved A2P 10DLC brand/campaign.
- A toll-free sender is outside A2P 10DLC but needs toll-free verification.
- OTP can alternatively move to Twilio Verify, but the current app uses the custom Supabase send-SMS hook and `TWILIO_FROM_NUMBER`.

Required next action: verify or complete the appropriate A2P 10DLC or toll-free registration for the number used by `TWILIO_FROM_NUMBER` before relying on production SMS delivery.

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

1. Commit, push, and confirm the production deployment is ready.
2. Verify Twilio messaging registration for the configured SMS sender.
3. Run the one-contact opted-in outbound canary above and review the full transcript, recording, outcome, and SMS handoff.
4. Tune Mabel's prompt and voice from the canary rather than from simulation alone.
5. Obtain compliance review for the selected niche, lead source, consent basis, states, recording disclosure, and calling windows.
6. Start with a capped design-partner pilot and manually review every disposition before increasing volume.
7. Add direct calendar availability or live transfer only after the owner-callback workflow proves demand.
