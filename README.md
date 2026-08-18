# Raleigh Lead Recovery

Lead recovery software for service businesses. The production app supports authenticated customer workspaces, eligible-lead CSV imports, controlled outbound campaigns through Mabel and Vapi, call outcomes and recordings in Supabase, immediate Twilio alerts for interested leads, and a private lead-reactivation dashboard. The public `/demo` route shows the same workflow with clearly labeled sample data. The earlier inbound missed-call recovery flow remains available for legacy workspaces.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
cp .env.example .env.local
```

Required values:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY` for customer signup, login, and session refresh
- `SUPABASE_SECRET_KEY` for new Supabase projects, or `SUPABASE_SERVICE_ROLE_KEY` for legacy projects
- `VAPI_WEBHOOK_SECRET`
- `VAPI_API_KEY` for automatic assistant and trial-number provisioning
- `VAPI_OUTBOUND_ASSISTANT_ID` for the production Mabel reactivation assistant
- `VAPI_OUTBOUND_PHONE_NUMBER_ID` for the Twilio number imported into Vapi
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_FROM_NUMBER`
- `ADMIN_PASSWORD`
- `NEXT_PUBLIC_APP_URL`
- `CRON_SECRET` for the protected campaign runner

3. Run the Supabase migration:

```bash
supabase migration up
```

Or paste the SQL files in `supabase/migrations` into the Supabase SQL editor in timestamp order.

4. Seed the demo data:

```bash
npm run seed
```

5. Start local dev:

```bash
npm run dev
```

Open `http://localhost:3000` for the public landing page. Customer signup, guided setup, login, and the authenticated call board live at `/signup`, `/onboarding`, `/login`, and `/dashboard`.

Open `http://localhost:3000/demo` for the public lead-reactivation dashboard prototype. Open `http://localhost:3000/admin`, sign in with `ADMIN_PASSWORD`, or open the legacy missed-call sample at `http://localhost:3000/example-report`.

The current-state audit and final production gates are documented in [`docs/lead-reactivation-readiness-audit.md`](docs/lead-reactivation-readiness-audit.md).

## Production Lead Reactivation

The authenticated customer flow is:

1. Create an account and complete business onboarding.
2. Create a lead-reactivation campaign with calling hours, attempt limits, and a daily cap.
3. Upload a CSV containing `name`, `phone`, and optional `email`, `source`, `age_days`, and `notes` fields.
4. Attest that the contacts are eligible, previously inquired or otherwise provided permission, and have been checked against applicable suppression requirements.
5. Launch or pause the campaign from the dashboard.
6. Mabel calls in controlled batches through the imported Twilio number. Vapi sends the recording, transcript, summary, and structured outcome back to the application.
7. Interested contacts move to the priority queue and trigger an immediate owner SMS with a click-to-call number and dashboard link.
8. The owner can call, mark the lead contacted, or record a booking and estimated value from the dashboard.

Launching or resuming starts an immediate controlled batch. A protected Vercel cron continues running campaigns daily at `14:00 UTC` (9:00 a.m. Raleigh time in standard time and 10:00 a.m. in daylight time). Each run respects the campaign's calling window and daily limit, retries eligible no-answers after 24 hours, and stops after the configured maximum attempts. The runner caps any one batch at 50 calls even if a higher daily limit is configured.

Create or update the production Mabel assistant with:

```bash
npm run vapi:setup-outbound
```

## Mabel Reactivation Demo

Create or update the reusable roofing-demo assistant in the configured Vapi account:

```bash
npm run vapi:setup-reactivation
```

The command stores the assistant ID in `VAPI_REACTIVATION_ASSISTANT_ID`. In Vapi, open **Mabel — Lead Reactivation Demo**, choose **Talk to Assistant**, and play the homeowner in one of the scenarios in [`docs/vapi-roofing-demo-scenarios.md`](docs/vapi-roofing-demo-scenarios.md).

After the call ends, copy its call ID into `VAPI_REACTIVATION_DEMO_CALL_ID` and download the recording:

```bash
npm run vapi:download-demo
```

The downloader saves the approved recording as `public/mabel-lead-recovery-demo.mp3`. Set `NEXT_PUBLIC_REACTIVATION_DEMO_AUDIO_URL=/mabel-lead-recovery-demo.mp3` to show the audio player on the homepage. Review the entire recording and obtain permission from every participant before publishing it.

## Vapi Configuration

Set the assistant server URL to:

```text
https://your-domain.com/api/webhooks/vapi
```

Configure server messages to send only:

```text
end-of-call-report
```

Configure the Vapi auth credential to send:

```text
Header: X-Vapi-Secret
Value: VAPI_WEBHOOK_SECRET
Bearer prefix: disabled / empty
```

The webhook matches clients by `message.call.assistantId` first and `message.call.phoneNumberId` second, so store those IDs on the client record.

## Self-Serve Trial

The primary customer flow is:

1. Create an account with name, email, and password.
2. Complete the guided business setup: business details, services, service area, weekly hours, emergency rules, callback expectations, alert number, and timezone.
3. Start a 14-day no-card trial and enter the private dashboard.
4. Connect missed-call forwarding and make a test call.

Onboarding data is stored on the authenticated client's workspace. The dashboard redirects incomplete accounts back to `/onboarding`, so customers cannot skip required setup.

Completing onboarding queues idempotent Vapi provisioning. The app creates a business-specific Mabel assistant, requests a US trial number in the owner's area code, stores both external IDs, and exposes retryable provisioning status in the dashboard. The first inbound webhook marks the end-to-end test call complete.

The full production design—including the Twilio scale path, billing lifecycle, failure handling, security, and deployment gates—is documented in [`docs/saas-architecture.md`](docs/saas-architecture.md).

## Legacy Audit Offer

The earlier assisted-sales workflow remains available as a 7-day missed-call audit:

- The plumber forwards busy/no-answer/after-hours calls for one week.
- Mabel captures each missed job call and sends the owner an alert.
- The report page shows calls captured and estimated job value caught.
- The request form stores submissions in `pilot_requests`.

Public pricing copy:

- 7-day audit: `$0`, no card.
- Continue after the audit: quote privately based on missed-call volume and owner follow-up needs.

## Twilio Notes

The production Twilio account is upgraded and its `+1 984 253 8680` number is imported into Vapi as the outbound Mabel number. The Vapi number ID is stored as a sensitive production environment variable rather than committed to this repository.

US local long-code numbers need A2P 10DLC registration before application SMS will reliably deliver at production volume. Error `30034` means Twilio blocked the message because the sender is unregistered. Complete A2P registration (or use a verified toll-free sender) before relying on owner alerts and authentication SMS in a customer launch.

The application records the exact signup and alert consent disclosures in `messaging_consents`. Transactional alerts are blocked unless the current destination matches an active consent record on the customer workspace. Verification and alert messages identify Raleigh Lead Recovery and include STOP/HELP instructions. Twilio automatically handles the standard English opt-out keywords for long-code numbers. Public messaging disclosures are available at `/privacy` and `/terms`.

The current Twilio onboarding must use a **Sole Proprietor Brand** while Raleigh Lead Recovery has no EIN. Do not submit the draft business/EIN profile or its unrelated legacy website. Twilio requires the proprietor to personally complete identity/biometric verification before Brand and Campaign registration can continue.

Outbound automated calls must only use properly eligible contacts and must comply with applicable federal and state calling, disclosure, consent, time-of-day, recording, and opt-out rules. The in-app attestation and suppression list are operational safeguards, not a substitute for legal review.

## Webhook Test

Replace the values, then run:

```bash
curl -sS -X POST http://localhost:3000/api/webhooks/vapi \
  -H 'content-type: application/json' \
  -H 'x-vapi-secret: your-secret' \
  -d '{
    "message": {
      "type": "end-of-call-report",
      "call": {
        "id": "curl-test-001",
        "assistantId": "asst_demo_riley",
        "phoneNumberId": "pn_demo_raleigh",
        "customer": { "number": "+19195554821" },
        "durationSeconds": 119
      },
      "analysis": {
        "summary": "Caller has a burst pipe under the kitchen sink.",
        "structuredData": {
          "caller_name": "Tanya Mills",
          "callback_number": "+19195554821",
          "service_address": "123 Oak Valley Dr, Raleigh, NC",
          "issue_description": "Burst pipe under kitchen sink",
          "urgency": "emergency",
          "lead_type": "new_job",
          "estimated_job_value_band": "over_2000",
          "requested_timing": "Now",
          "callback_promised_by": "15 minutes"
        }
      },
      "transcript": "Mabel: What is going on? Caller: There is water everywhere under the kitchen sink."
    }
  }'
```

Expected result: the route returns `ok: true`, upserts one `calls` row by `vapi_call_id`, and sends one owner SMS unless Twilio credentials are missing or the lead is spam. Repeating the same payload updates the row and should not send a second SMS after `sms_sent_at` is set.

## Scripts

```bash
npm run typecheck
npm test
npm run build
npm run seed
```

## Version Policy

Dependencies are pinned to current npm stable versions where the current Next.js toolchain supports them. `typescript` is pinned to `6.0.3`, the newest TypeScript 6 release, because `typescript@7.0.2` currently breaks the Next.js production build in this app. `eslint` is pinned to `9.39.4`, the newest ESLint 9 release, because `eslint@10.6.0` crashes in the React lint plugin chain bundled by `eslint-config-next@16.2.10`. `npm outdated` should only report ESLint and TypeScript until Next's tooling supports those newer major versions.

Current audit note: `npm audit --omit=dev` reports a moderate PostCSS advisory through `next@16.2.10`'s bundled `postcss@8.4.31`. The app's direct PostCSS dependency is already patched at `8.5.16`; npm's suggested forced fix downgrades Next to `9.3.3`, so the right action is to upgrade Next when the next stable release carries patched PostCSS.

## Security Notes

- Supabase is accessed only from server code with a secret key.
- RLS is enabled with no public policies.
- The report page has `noindex, nofollow` metadata.
- Callback numbers are masked on the report page.
- Service addresses are shortened before rendering.
- The public report URL is acceptable for the pilot only; revisit auth before multi-client rollout.
