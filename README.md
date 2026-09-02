# Raleigh Lead Recovery

Voice-assistant software for service businesses. One customer workspace can run separate Retell agents for 24/7 inbound reception and controlled lead recovery. Supabase stores accounts, business rules, campaigns, leads, outcomes, and call summaries.

## Stack

- Next.js 16 / React 19
- Supabase database and email magic-link authentication
- Retell voice agents, managed phone numbers, web calls, recordings, and optional SMS alerts
- Vercel deployment and cron

The application uses Retell as its only telephony and voice-agent provider.

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Required variables:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY` or `SUPABASE_SERVICE_ROLE_KEY`
- `RETELL_API_KEY`
- `NEXT_PUBLIC_APP_URL`
- `DEMO_CALL_HASH_SECRET`
- `ADMIN_PASSWORD`
- `CRON_SECRET`

For the browser demo, set `RETELL_WEB_DEMO_AGENT_ID` (or `RETELL_DEMO_AGENT_ID`). For outbound phone demos, also set `RETELL_DEMO_PHONE_NUMBER`. Optional owner text alerts use `RETELL_SMS_AGENT_ID` and `RETELL_SMS_FROM_NUMBER` after Retell SMS/A2P approval.

Founder sales outreach uses `RETELL_OUTREACH_AGENT_ID` and `RETELL_OUTREACH_PHONE_NUMBER`. Run `npm run sync:outreach-agent` to create or update the transparent sales-qualification agent. Calls are initiated one at a time from the admin Outreach page and require a per-call business-number/eligibility confirmation; the app does not run an unattended cold-call batch. Opt-outs are stored by normalized phone number so duplicate prospect rows cannot bypass suppression.

## Retell setup

Point the Retell webhook at:

```text
https://your-domain.com/api/webhooks/retell
```

Select the `call_analyzed` event. Retell signs the raw webhook body with `x-retell-signature`; the route verifies it using `RETELL_API_KEY`.

Customer provisioning is handled from the Agents page. The app creates and publishes separate Retell agents for:

- 24/7 receptionist: inbound answering, qualification, and handoff
- Lead recovery: outbound calls using the selected campaign audience and pacing rules

The app reuses one Retell-managed number per customer where possible, binding inbound and outbound agents to their respective directions.

## Customer flow

1. An admin creates a customer workspace.
2. The owner opens the invitation and signs in by email magic link.
3. The business profile supplies shared hours, services, service area, and handoff rules.
4. The Agents page configures and publishes the receptionist and/or lead-recovery jobs.
5. A qualified lead file can be previewed, normalized, segmented, and imported.
6. A reviewed campaign launches within its configured local calling window and daily limit.
7. Retell posts analyzed calls back to the app; the dashboard shows outcomes, transcripts, and authenticated recording playback.

Only eligible uploaded contacts are stored. Files over 25,000 rows are rejected instead of being partially imported or used to replace an existing list.

## Supabase

Apply migrations with:

```bash
npx supabase db push
```

The Retell cutover migration intentionally deletes test call, attempt, and public-demo request history. Customer records, campaign configuration, lead lists, and suppression records remain.

Production Supabase Auth must allow this redirect URL:

```text
https://your-domain.com/auth/callback
```

Configure a production SMTP provider before inviting customers; Supabase’s built-in email sender is suitable only for limited testing.

## Verification

```bash
npm run typecheck
npm test
npm run lint
npm run build
```
