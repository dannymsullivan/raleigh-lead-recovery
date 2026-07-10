# Missed-Call Recovery Agent - Build And Test Plan

Last updated: 2026-07-09

## Goal

Build a live demo for trade businesses that answers missed calls, triages the lead, captures job details, texts the owner immediately, and produces a 7-day "money caught" report.

The demo should prove one thing: every missed call is either recovered revenue or a visible lost opportunity.

## Definition Of Done

- A Vapi phone number answers forwarded busy/no-answer calls.
- The assistant captures caller name, callback number, service address, issue, urgency, lead type, requested timing, and callback expectation.
- Vapi sends an end-of-call webhook to the Next.js webhook receiver.
- Calls are logged in Supabase with an idempotent `vapi_call_id`.
- Non-spam leads trigger an owner SMS.
- A seeded report page works before any real client data exists.
- A real call produces a report row within 60 seconds of hangup.
- The owner can open `/report/[clientId]` and see the captured-call value.

## Architecture

```text
Customer calls business
        |
        | no answer after about 4 rings, or line busy
        v
Conditional call forwarding
        |
        v
Vapi/Twilio phone number
        |
        v
Vapi voice assistant
        |
        | end-of-call report webhook
        v
Next.js webhook receiver: /api/webhooks/vapi
        |
        +--> Supabase: insert/update call log
        |
        +--> Twilio SMS: owner alert
        |
        +--> Scheduled report drip (deferred: n8n or cron route)
                 |
                 v
             Next.js report page: /report/[clientId]
```

## Why This Split

- Vapi handles real-time voice: latency, interruption handling, speech-to-text, text-to-speech, call state, and post-call analysis.
- Next.js handles post-call automation for the pilot: webhook receipt, Supabase upsert, and owner SMS live in one route so there is exactly one insert path and one secret to manage.
- Next.js plus Supabase owns the report dashboard because the report is the sales asset and will change often.
- n8n is deferred. Bring it in later for the daily report drip and QA notifications if a visual workflow beats a cron route; it is not in the pilot's critical path.

## External Docs Checked

Use these links when a UI label or payload shape differs from this plan:

- Vapi server URLs: https://docs.vapi.ai/server-url/setting-server-urls
- Vapi server events: https://docs.vapi.ai/server-url/events
- Vapi server authentication: https://docs.vapi.ai/server-url/server-authentication
- Vapi call analysis: https://docs.vapi.ai/assistants/call-analysis
- n8n Webhook node: https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/
- Twilio Messages API: https://www.twilio.com/docs/messaging/api/message-resource
- Supabase API keys: https://supabase.com/docs/guides/getting-started/api-keys

Notes from the source check:

- Vapi server URLs can be set at organization, phone number, assistant, or function level. For this pilot, set the assistant server URL unless a specific number needs a different receiver.
- Vapi end-of-call webhooks use `message.type == "end-of-call-report"`.
- Vapi stores call analysis summary and structured data on the call analysis object. Capture the first live payload and adjust the mapper if the exact nesting differs.
- Vapi now recommends credential objects for webhook auth. `X-Vapi-Secret` is still supported by configuring a Bearer Token credential with header name `X-Vapi-Secret` and no bearer prefix.
- Supabase now recommends server-side secret keys where available. The legacy `service_role` key is still common, but keep either key server-only and never expose it to client code.
- n8n Webhook nodes have test and production URLs. The production URL works after publishing the workflow.

## Build Sequence

### Phase 1 - Accounts And Secrets

- [ ] Create or confirm Vapi account.
- [ ] Create or confirm Twilio account.
- [ ] Create or confirm Supabase project.
- [ ] (Deferred) n8n workspace - only needed if/when the report drip moves to n8n.
- [ ] Decide inbound number path: Vapi-provisioned number (US-only, quickest) or import a Twilio number into Vapi.
- [ ] Decide pilot trade vertical for first demo: plumbing, garage door, tree service, HVAC, or roofing.
- [ ] Choose demo business name, owner name, owner phone, and local service area.
- [ ] Store all secrets in `.env.local` only.

Required environment variables for the app:

```bash
SUPABASE_URL=
SUPABASE_SECRET_KEY=
SUPABASE_SERVICE_ROLE_KEY=
VAPI_WEBHOOK_SECRET=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=
ADMIN_PASSWORD=
NEXT_PUBLIC_APP_URL=
```

Use `SUPABASE_SECRET_KEY` for new Supabase projects if available. Keep `SUPABASE_SERVICE_ROLE_KEY` available for legacy projects and scripts.

### Phase 2 - Supabase Schema

Create one migration under `supabase/migrations`.

```sql
create table clients (
  id uuid primary key default gen_random_uuid(),
  business_name text not null,
  trade text not null,
  owner_name text not null,
  owner_phone text not null,
  owner_email text,
  pilot_start date not null,
  pilot_end date not null,
  avg_job_value numeric not null default 500,
  close_rate numeric not null default 0.4,
  vapi_assistant_id text,
  vapi_phone_number_id text,
  created_at timestamptz not null default now()
);

create table calls (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  vapi_call_id text not null unique,
  caller_number text,
  caller_name text,
  callback_number text,
  service_address text,
  issue_description text,
  urgency text not null default 'other',
  lead_type text not null default 'other',
  estimated_value_band text not null default 'unknown',
  requested_timing text,
  callback_promised_by text,
  summary text,
  transcript text,
  recording_url text,
  duration_seconds int,
  raw_payload jsonb,
  sms_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index calls_client_created_at_idx on calls(client_id, created_at desc);
create index clients_vapi_assistant_id_idx on clients(vapi_assistant_id);
create index clients_vapi_phone_number_id_idx on clients(vapi_phone_number_id);

-- Lock the tables down: the app only ever touches them with the server-side
-- secret key, which bypasses RLS. With RLS on and zero policies, the public
-- anon/publishable key can read nothing.
alter table clients enable row level security;
alter table calls enable row level security;
```

### Phase 3 - Vapi Assistant

Assistant target:

- Name: `Riley - Missed Call Recovery`
- Model: Claude Sonnet via Anthropic, if available in the account.
- Voice: warm natural voice. Test 2 or 3 before choosing.
- Transcriber: Deepgram Nova or current Vapi default.
- Server URL: deployed Next.js `/api/webhooks/vapi`.
- Server messages: configure the assistant to send only `end-of-call-report` so the receiver isn't filtering noise it never needed.
- Authentication: configure a credential that sends `X-Vapi-Secret` with the `VAPI_WEBHOOK_SECRET` value.
- Call analysis: enable summary and structured data extraction.

First message:

```text
Thanks for calling {{business_name}} - this is Riley. Sorry we couldn't grab the phone, the team's out on jobs. What's going on?
```

System prompt for emergency plumbing:

```text
[Identity]
You are Riley, the after-hours assistant for {{business_name}}, a plumbing company in Raleigh, North Carolina. You answer when the team can't get to the phone, usually because they're on a job. You are warm, calm, efficient, and human-sounding. You never say you are an AI unless directly asked; if asked, answer honestly and briefly, then continue helping.

[Context]
- Callers may be stressed: water leaking, no hot water, sewage backup. Calm them down and move fast.
- Your job: (1) triage urgency, (2) capture complete lead details, (3) set the expectation that a real plumber will call back, (4) for emergencies, reassure and prioritize.
- You CANNOT quote prices. If asked, say pricing depends on the job and the plumber will confirm on the callback.
- You CANNOT dispatch anyone directly. You collect info and promise a callback within {{callback_window}}. Default: 15 minutes for emergencies, 2 hours otherwise.

[Style]
- Short sentences.
- One question at a time.
- Never ask for two pieces of info in the same breath.
- Mirror the caller's energy: urgent caller means brisk and reassuring; calm caller means friendly and unhurried.
- Use natural fillers sparingly: "Got it", "Okay, that helps".
- No corporate phrases.

[Conversation flow]
1. GREETING: "Thanks for calling {{business_name}} - this is Riley. Sorry we couldn't grab the phone, the guys are out on jobs. What's going on?"
2. TRIAGE - classify silently into:
   - EMERGENCY: active leak, burst pipe, flooding, sewage backup, no water to the house, gas smell.
   - URGENT: no hot water, clogged main drain, toilet not working in a one-bathroom home.
   - STANDARD: quotes, remodels, slow drains, dripping faucets, non-urgent repairs.
3. If EMERGENCY: "Okay - first thing, if you can, shut off the water at the main valve. It's usually near the water heater or where the line enters the house. I'm going to get your info to the on-call plumber right now."
4. If gas smell, carbon monoxide, or electrical fire: tell them to leave the house and call 911 or the utility company first, then continue capturing info only if safe.
5. CAPTURE, one at a time:
   - full name
   - callback number, then confirm digits back
   - service address
   - brief description of the problem
   - how soon they need someone
6. EXPECTATION: "You're on the board. {{on_call_name}} will call you back within {{callback_window}}. If anything changes, call this number back and I'll update your ticket."
7. CLOSE: thank them by name.

[Edge cases]
- Price shopper who only wants a number: capture name and number anyway, promise the callback with a quote. Do not lose the lead.
- Wrong number, solicitor, or robocall: politely end the call.
- Existing customer with a scheduling question: capture details, flag as "existing customer - scheduling".
- Angry caller about past work: apologize once, capture details, flag as "complaint - owner callback", and do not promise remedies.
- Caller asks for a specific plumber: note the name in the ticket.

[Hard rules]
- Never invent availability, prices, or arrival times.
- Never collect payment information.
- Safety instructions come before lead capture for gas smell, carbon monoxide, electrical fire, or immediate physical danger.
- Keep total call under 4 minutes when possible.
```

AI disclosure line, ready to enable per state requirements (see Client Activation Checklist):

```text
Just so you know, I'm {{business_name}}'s automated assistant - I'll get your details straight to the team.
```

Keep it out of the prompt for internal demo calls; it must be resolved (enabled or confirmed unnecessary) before any real customer call.

Structured data schema:

```json
{
  "type": "object",
  "properties": {
    "caller_name": { "type": "string" },
    "callback_number": { "type": "string" },
    "service_address": { "type": "string" },
    "issue_description": { "type": "string" },
    "urgency": {
      "type": "string",
      "enum": ["emergency", "urgent", "standard", "spam", "other"]
    },
    "lead_type": {
      "type": "string",
      "enum": ["new_job", "existing_customer", "complaint", "price_shopper", "spam"]
    },
    "estimated_job_value_band": {
      "type": "string",
      "enum": ["under_300", "300_800", "800_2000", "over_2000", "unknown"]
    },
    "requested_timing": { "type": "string" },
    "callback_promised_by": { "type": "string" }
  },
  "required": ["urgency", "lead_type"]
}
```

### Phase 4 - Backend And Report App

Build a Next.js app in this repo.

Stack:

- Next.js App Router
- TypeScript
- Tailwind
- Supabase JS in server code only
- Twilio Node SDK in server code only

API route: `POST /api/webhooks/vapi`

- Validate `x-vapi-secret` against `VAPI_WEBHOOK_SECRET`.
- Return 401 for missing or wrong secret.
- Ignore any payload where `message.type` is not `end-of-call-report` (belt-and-suspenders; the assistant is configured to send only that event).
- Find the client by `message.call.assistantId`, `message.call.phoneNumberId`, or equivalent live payload fields.
- If no client matches: log a warning with the IDs, store nothing (or stash the raw payload for debugging), and return 200 so Vapi does not retry forever.
- Extract:
  - `message.call.id`
  - call analysis summary
  - call analysis structured data (note: Vapi field `estimated_job_value_band` maps to DB column `estimated_value_band`)
  - transcript
  - recording URL
  - duration seconds
  - customer/caller number
- Upsert into `calls` on `vapi_call_id`, storing the full webhook body in `raw_payload` and setting `updated_at`.
- Send the owner SMS only when `lead_type != "spam"` AND `sms_sent_at` is null; set `sms_sent_at` when the send succeeds. This makes webhook retries idempotent for notifications, not just rows.
- Wrap SMS in `try/catch`; failed SMS logs an error, leaves `sms_sent_at` null, and still returns 200 to Vapi.
- Return 200 for all successfully authenticated Vapi events, including ignored non-report events.

Owner SMS format:

```text
CAUGHT MISSED CALL ({urgency}): {caller_name} - {issue_description}. Call: {callback_number}. Addr: {service_address}. Wants: {requested_timing}.
```

If using the original emoji version, keep SMS length in mind because non-GSM characters can increase SMS segment count.

Report data: server-side loader only, no public JSON API. The report page is a server component that queries Supabase directly with the secret key. Do not expose a `GET /api/report/[clientId]` endpoint - it would be a second unauthenticated surface serving raw caller PII.

The loader computes:

- client
- total calls
- non-spam leads
- count by urgency
- estimated job value captured
- calls list newest first

Value math - pipeline basis, applied consistently:

```ts
// "Estimated job value captured" = sum of band midpoints for countable leads.
// This is pipeline value (value of the jobs), NOT expected value - do not
// multiply by close_rate anywhere, including the unknown band.
const valueBandMidpoints = {
  under_300: 150,
  "300_800": 550,
  "800_2000": 1400,
  over_2000: 3000,
  unknown: client.avg_job_value
};
```

Exclusions: `spam` and `complaint` leads count $0 toward the hero number (a complaint is not captured revenue). `existing_customer` scheduling calls do count - a saved booking is real value. Label the number "estimated job value captured" on the page, never "revenue earned".

Report page: `/report/[clientId]`

- Server component querying Supabase directly (see loader above).
- Mobile-first.
- Shareable by UUID URL.
- No auth for pilot report URLs, with PII masking as the mitigation:
  - Mask callback numbers on the page, e.g. `(919) •••-4821`. The owner already received the full number via SMS; the report never needs it.
  - `noindex, nofollow` robots meta on the report route.
  - Do not render full service addresses in the timeline; street name or neighborhood is enough for the demo.
- Hero: `{business_name}, here's what you were missing.`
- Big number: estimated job value captured during the pilot (pipeline basis per the value math above).
- Stat cards:
  - calls answered
  - emergencies caught
  - leads captured
  - answer speed: `first ring after forwarding` (do not claim "under 1 second" - the caller sat through ~4 rings of forwarding first)
- Timeline:
  - relative time
  - urgency badge: red for emergency, amber for urgent, gray for standard/other
  - caller name
  - one-line issue
  - value band
  - expandable summary/transcript
- Footer CTA:
  - `Every one of these would have hit voicemail.`
  - Treat the "85% of voicemail callers never call back" claim as unverified until sourced before external sales use.

Admin page: `/`

- Minimal internal admin.
- Env password from `ADMIN_PASSWORD`.
- Cookie after successful login.
- List clients.
- Add client form.
- Link to report page for each client.

Seed script: `scripts/seed.ts`

- Insert one demo client.
- Insert 12 realistic calls across 7 days.
- Mix:
  - 3 emergencies
  - 3 urgent
  - 5 standard
  - 1 spam
- Include credible summaries and transcripts so the report looks real immediately.

README requirements:

- Setup steps.
- Supabase migration command.
- Seed command.
- Local dev command.
- How to point Vapi's server URL at `/api/webhooks/vapi`.
- How to configure Vapi auth credential for `X-Vapi-Secret`.
- Realistic `curl` command with sample Vapi `end-of-call-report` payload.

### Phase 5 - n8n Workflow A: Call Captured (DEFERRED)

Decision: the pilot loop runs entirely through the Next.js webhook (Phase 4). Keep this section as reference for a future migration; do not build it for the pilot.

Purpose: receive Vapi end-of-call reports and notify the owner.

Nodes:

1. Webhook
   - Method: POST
   - Use production URL after publishing.
   - Auth: header auth or Vapi credential if sending directly to n8n.
   - Respond: immediately, 200, no response body.
2. IF
   - Condition: `message.type == "end-of-call-report"`
3. Set
   - Extract:
     - `call.id`
     - assistant ID
     - phone number ID
     - summary
     - structured data fields
     - transcript
     - recording URL
     - duration seconds
     - caller number
4. Supabase
   - Insert or upsert row into `calls`.
5. IF
   - Condition: `lead_type != "spam"`
6. Twilio
   - Send SMS to owner.
7. Optional Slack or email
   - Send same payload to us for QA during pilot.

Pilot shortcut:

- If the Next.js webhook is ready first, let Next.js handle Supabase and Twilio directly.
- If n8n is ready first, use n8n for the loop and let Next.js only read Supabase for reports.
- Do not maintain two competing insert paths for the same pilot unless both use the same idempotent `vapi_call_id`.

### Phase 6 - Demo Report Drip (DEFERRED)

Decision: not needed for the initial demo. When the drip is wanted, implement as either an n8n workflow (below) or a Vercel cron route hitting the same Supabase queries - pick whichever is less to maintain at that point.

Purpose: daily SMS during the free pilot.

Nodes:

1. Schedule trigger
   - Daily at 7:00 AM local time.
   - Optional manual trigger for demo.
2. Supabase
   - Query calls for client where `created_at >= pilot_start`.
3. Code
   - Calculate:
     - total captured
     - non-spam leads
     - emergencies
     - estimated revenue
     - pilot day number
4. Twilio SMS or email
   - Send:

```text
Day {{day_number}} of your free pilot: {{lead_count}} missed calls answered, {{emergency_count}} emergencies, est. ${{estimated_revenue}} in jobs captured. Full report: {{report_url}}
```

## Test Plan For Today

### Local App Tests

- [ ] Install dependencies.
- [ ] Run Supabase migration.
- [ ] Run seed script.
- [ ] Open admin page and confirm demo client exists.
- [ ] Open `/report/[clientId]`.
- [ ] Confirm value math uses band midpoints with no close_rate multiplier.
- [ ] Confirm unknown value band uses `avg_job_value`.
- [ ] Send sample webhook with `curl`.
- [ ] Confirm duplicate webhook does not create duplicate calls.
- [ ] Confirm duplicate webhook does not re-send the owner SMS (`sms_sent_at` gate).
- [ ] Confirm spam and complaint leads count $0 toward the hero number.
- [ ] Confirm caller numbers render masked on the report page.
- [ ] Confirm webhook with an unknown assistant/phone-number ID logs a warning and returns 200.
- [ ] Confirm spam lead does not send SMS.
- [ ] Confirm non-spam lead attempts SMS and webhook still returns 200 if SMS fails.

### Voice Call Tests

Call the Vapi number 5 times:

1. Panicked burst pipe
   - Expected urgency: `emergency`
   - Expected lead type: `new_job`
   - Assistant should tell caller to shut off water if possible.
2. Price shopper
   - Expected urgency: `standard`
   - Expected lead type: `price_shopper`
   - Assistant should not quote price.
3. Wrong number
   - Expected urgency: `spam` or `other`
   - Expected lead type: `spam`
   - No owner SMS.
4. Angry past customer
   - Expected lead type: `complaint`
   - Assistant apologizes once and promises owner callback, not a remedy.
5. Gas smell
   - Expected urgency: `emergency`
   - Assistant tells caller to leave and call 911 or gas company before capturing details.

### End-To-End Success Criteria

- [ ] Call answered naturally.
- [ ] Caller can interrupt the assistant.
- [ ] Assistant asks one question at a time.
- [ ] Callback number is confirmed back.
- [ ] Vapi report appears after hangup.
- [ ] Supabase row created or updated.
- [ ] Owner SMS arrives.
- [ ] Report page updates.
- [ ] Transcript and summary are readable.

## Client Activation Checklist

Before touching a real client phone system:

- [ ] Get explicit permission from the business owner.
- [ ] Explain this is reversible in about 10 seconds.
- [ ] HARD GATE: resolve state AI-disclosure and call-recording consent requirements before the first real customer call. If disclosure is required, enable the ready-made disclosure line in the assistant prompt (Phase 3). "We'll check later" does not clear this gate.
- [ ] Confirm the client knows the assistant cannot dispatch, price jobs, or take payment.
- [ ] Test with the owner's phone first.
- [ ] Write down the deactivation code before activation.
- [ ] Verify carrier-specific forwarding codes in the live carrier portal or support docs.

Working assumptions to verify before use:

- Verizon: `*71` plus forwarding number for busy/no-answer, deactivate with `*73`.
- AT&T/GSM: `*61*<number>#` for no answer, `*67*<number>#` for busy, deactivate with `##61#` and `##67#`.
- T-Mobile/GSM: `**61*<number>**seconds#` for no answer, `**67*<number>#` for busy.
- Landline or VoIP: configure in carrier portal, PBX, or phone system.

## Demo Script

Opening:

```text
You missed calls this week. The question is whether those callers hit voicemail and moved on, or whether someone captured the job details and got them back to you in seconds.
```

Show:

1. The owner SMS from a real test call.
2. The report hero dollar number.
3. The emergency calls timeline.
4. One transcript summary.
5. The spam/wrong-number handling.

Close:

```text
This is what we caught while you were busy. Keep it on for the rest of the week and you will know exactly what your missed calls are worth.
```

## Risks And Guardrails

- Emergency language: the assistant gives basic safety guidance but never claims a technician is dispatched.
- Pricing: never quote prices.
- Payment: never collect card or bank details.
- Legal: verify call recording, AI disclosure, TCPA, and SMS consent before broader rollout.
- SMS delivery: Twilio trial accounts may only send to verified numbers. Production SMS may require A2P 10DLC or toll-free verification depending on sender type.
- Secrets: Supabase secret/service-role key, Twilio auth token, and Vapi webhook secret stay server-side only.
- Report PII: real caller names, numbers, and addresses land in this system as soon as a real client activates. Mitigations baked into the plan: RLS on all tables, no public JSON API, masked numbers and truncated addresses on the report page, noindex. Revisit before any multi-client rollout.
- Payload drift: capture the first real Vapi payload and keep a fixture in tests.
- Report claim: source or remove the voicemail callback percentage before showing it in sales material.

## Cost Model

Working assumption for pilot:

- Voice platform usage: about $0.10 to $0.15 per minute all-in.
- 7-day pilot with around 15 calls: about $8 to $12 in voice cost.
- Twilio number and SMS: about $2 to start.
- Total pilot cost target: under $15.

Verify current Vapi, model, voice, transcriber, Twilio phone number, SMS, and compliance fees before selling at scale.

## Next Work Session

1. Scaffold the Next.js app in this repo.
2. Add Supabase migration (including RLS) and seed script.
3. Build `/api/webhooks/vapi` with the `sms_sent_at` gate and unmatched-client handling.
4. Build the report page (server component, direct Supabase query, masked numbers) and admin page.
5. Add `.env.example` and README.
6. Run seed and local test webhook, including the duplicate-webhook SMS test.
7. Configure Vapi assistant (server messages limited to `end-of-call-report`).
8. Run the five live call tests.
