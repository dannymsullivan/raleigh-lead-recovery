# Raleigh Lead Recovery

Live demo for Raleigh plumbing businesses that answers missed calls through Vapi, logs captured leads in Supabase, texts the owner through Twilio, and shows a shareable 7-day report.

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
- `SUPABASE_SECRET_KEY` for new Supabase projects, or `SUPABASE_SERVICE_ROLE_KEY` for legacy projects
- `VAPI_WEBHOOK_SECRET`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_FROM_NUMBER`
- `ADMIN_PASSWORD`
- `NEXT_PUBLIC_APP_URL`

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

Open `http://localhost:3000` for the public Raleigh plumber landing page.

Open `http://localhost:3000/admin`, sign in with `ADMIN_PASSWORD`, or open the public sample at `http://localhost:3000/example-report`.

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

## Landing Page And Offer

The root route `/` is a public landing page tailored to Raleigh plumbers. The first offer is a 7-day missed-call audit:

- The plumber forwards busy/no-answer/after-hours calls for one week.
- Dana captures each missed job call and sends the owner an alert.
- The report page shows calls captured and estimated job value caught.
- The request form stores submissions in `pilot_requests`.

Public pricing copy:

- 7-day audit: `$0`, no card.
- Continue after the audit: quote privately based on missed-call volume and owner follow-up needs.

## Twilio Notes

US local long-code numbers need A2P 10DLC registration before outbound app SMS will reliably deliver. Error `30034` means Twilio blocked the message because the sender is unregistered.

For fast owner-alert testing, use a Twilio toll-free number as `TWILIO_FROM_NUMBER`. Trial Twilio projects are limited to one Twilio-owned number, so either upgrade the project or release the existing local Twilio sender before buying a toll-free sender.

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
      "transcript": "Dana: What is going on? Caller: There is water everywhere under the kitchen sink."
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
