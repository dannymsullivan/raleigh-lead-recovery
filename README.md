# Snappy Leads

Website chat and voice-assistant software for service businesses. The homepage leads with website chat; `/voice` covers missed-call reception. Customer workspaces include chat analytics and an editable knowledge base; voice-enabled workspaces also use separate Retell voice agents. Supabase stores accounts, knowledge, conversations, attribution, leads, and call outcomes.

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

Core workspace variables:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY` or `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL`
- `ADMIN_PASSWORD`

Website chat also requires `CHAT_SESSION_SECRET` or `DEMO_CALL_HASH_SECRET`. Voice features require `RETELL_API_KEY`, and public voice demos require `DEMO_CALL_HASH_SECRET`. Set `CRON_SECRET` when enabling scheduled jobs. A chat-only workspace does not require Retell credentials.

For the receptionist browser demo, set `RETELL_RECEPTIONIST_DEMO_AGENT_ID` (fallback: `RETELL_WEB_DEMO_AGENT_ID` or `RETELL_DEMO_AGENT_ID`). Set `RETELL_REACTIVATION_DEMO_AGENT_ID` separately for the HVAC follow-up demo. Both require a published Retell agent, available Retell credits, `DEMO_CALL_HASH_SECRET`, and a reachable migrated Supabase database for abuse limits. Browser demos use a microphone and do not require a Twilio account or purchased phone number. For outbound phone demos, also set `RETELL_DEMO_PHONE_NUMBER`. Optional owner text alerts use `RETELL_SMS_AGENT_ID` and `RETELL_SMS_FROM_NUMBER` after Retell SMS/A2P approval.

Founder sales outreach uses `RETELL_OUTREACH_AGENT_ID` and `RETELL_OUTREACH_PHONE_NUMBER`. Run `npm run sync:outreach-agent` to create or update the transparent sales-qualification agent. Calls are initiated one at a time from the admin Outreach page and require a per-call business-number/eligibility confirmation; the app does not run an unattended cold-call batch. Opt-outs are stored by normalized phone number so duplicate prospect rows cannot bypass suppression.

## Website chat

Apply `supabase/migrations/20261027170000_website_chat.sql` after the existing migrations. Set `CHAT_SESSION_SECRET` to a cryptographically random value (or use the existing `DEMO_CALL_HASH_SECRET`). The database connection and customer authentication variables above are required for customer workspaces.

1. Use the existing Admin → Add customer flow with “Website chatbot” selected, or open an existing customer’s CRM. Existing workspaces, access links, authentication, and profiles are reused; chat-only setup does not provision Retell agents or campaigns.
2. In the customer CRM, use “Chatbot & knowledge.” Customers can manage the same knowledge at `/dashboard/knowledge-base`. Services, service area, and office hours come from the existing business profile when enabled; owner contacts and internal call rules are excluded. Published custom answers with the same topic title override those profile answers.
3. Add approved answers and search keywords. Keep incomplete entries as drafts.
4. Publish at least one answer or enable a populated business profile, then enable website chat.
5. Copy the install snippet onto the customer's site. It loads a hosted, isolated chat iframe from `/chat/{workspace-slug}`.
6. Review conversations and captured leads at `/dashboard/chats`. Update contacted/booked/lost outcomes and confirmed booked value there.

Admin CRM reports, customer reports, and the public `/dashboard-demo` preview reuse the same report component and analytics calculations. The admin and customer knowledge editors also share one manager and save logic.

The current chat engine retrieves published FAQ text using weighted keyword matching. It does not call an LLM, infer unsupported answers, run tools, or make real bookings. Each answer displays its source. The public homepage uses a fictional, browser-only chat demo; messages and contact details entered inside that demo are not persisted or sent to a business. The separate free-trial request form saves real requests as described below.

Production conversations store their initial landing page, referrer, and UTM source, medium, campaign, content, and term. Page URL queries/fragments are removed; only named UTM fields are retained separately. These are visitor-reported conversation-level attribution, not verified ad-platform conversions, cross-device identity, or sitewide visitor analytics. The widget captures them when loaded; preserve UTM tags on the page that loads it. Metrics cover the latest 1,000 conversations started in the last 30 days and explicitly display that cap. The transcript list is paginated. A lead means a submitted contact request with follow-up permission; booked value is manually confirmed by the owner.

Customer chat management checks the authenticated workspace owner; admin CRM management checks the admin session. Public requests resolve tenants from the hosted slug and use a random session capability whose hash is stored in the database. Database functions enforce session expiry, turn caps, and atomic start quotas. Raw IP addresses are not stored. No customer conversation, token hash, or knowledge draft is directly readable by anonymous/authenticated database roles. Pausing chat rejects new messages and contact submissions.

## Retell voice setup

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

1. A customer creates a website-chat workspace at `/signup`, or an admin creates a workspace and sends an invitation.
2. The owner signs in by email magic link at `/login`; signup, login, invitation, and resend all use email. Public sign-in does not require Twilio, SMS, or a phone number.
3. New chat customers complete their business profile in Settings, review and publish answers in Knowledge base, then enable their chatbot. Chat-only setup does not provision voice agents or request SMS consent. Existing voice workspaces retain their phone setup.

For voice customers:

1. The business profile supplies shared hours, services, service area, and handoff rules.
2. The Agents page configures and publishes the receptionist and/or lead-recovery jobs.
3. A qualified lead file can be previewed, normalized, segmented, and imported.
4. A reviewed campaign launches within its configured local calling window and daily limit.
5. Retell posts analyzed calls back to the app; the dashboard shows outcomes, transcripts, and authenticated recording playback.

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

For local email testing, allow `http://localhost:3000/auth/callback` and set `NEXT_PUBLIC_APP_URL=http://localhost:3000`. Open the emailed link in the same browser that requested it; the callback needs that browser's pending request and PKCE cookies. In production, set `NEXT_PUBLIC_APP_URL` to the deployed HTTPS origin and allow its callback URL.

## Verification

```bash
npm run typecheck
npm test
npm run lint
npm run build
```

### Website trial requests

Apply `supabase/migrations/20261027183000_website_trial_requests.sql` after the chat migration. The homepage and `/get-started` reuse the same form and `/api/trial-request` endpoint. Set `TRIAL_REQUEST_SECRET`, or reuse the configured `CHAT_SESSION_SECRET` / `DEMO_CALL_HASH_SECRET`, for hashed-IP abuse prevention.

Requests are saved to the existing `outreach_prospects` ledger with `inbound_source=website_trial`; review them at `/admin/outreach?source=website_trial`. Danny follows up by email manually. There is no automatic email or calendar booking. Database failure shows an error and the contact email; it does not report success.

### Public pages

The public navigation contains Chatbots, Voice agents, Sign in, and the trial CTA. Pricing and business-knowledge explanations live on the homepage; knowledge editing stays in `/dashboard/knowledge-base`. `/voice` explains phone coverage and `/dashboard-demo` previews chat reporting. `/get-started` handles trial requests; `/contact` provides support by email. Blog, legal pages, and the existing `/hvac` industry example remain available. Shared navigation and footer avoid duplicate menus. Retired public `/knowledge-base` and `/lead-recovery` pages redirect to the homepage knowledge section and `/voice`, respectively. Legacy `/demo`, `/hvac-demo`, and `/example-report` redirect directly to the appropriate demo. Account and admin routes remain separate workspaces.

Retell web calls now use the v3 create-web-call endpoint and pass all four connection fields to SDK 3. The existing Retell workspace must have a positive credit balance, and the quota database must be available, before the public voice demo can connect.

### Supporting documents

Asset sources and research: [illustration prompts](docs/illustration-prompts.md), [retro naming research](docs/retro-lead-naming-research.md). The product is now Snappy Leads at https://snappyleads.xyz, with support at danny@snappyleads.xyz. The repository and Vercel project retain their original internal names. Earlier sales material is retained for reference: [reactivation action plan](docs/dead-lead-reactivation-action-plan.md), [HVAC email sequence](docs/smartlead-hvac-website-sequence.md), [HVAC prospect list](docs/raleigh-hvac-call-list.md), and [voice-pilot lifecycle email drafts](docs/customer-lifecycle-email-templates.md). Those campaign notes and email drafts do not define the current chat-first onboarding or establish current campaign/service status.


### Shared public knowledge demo

The homepage and `/knowledge-base` use a real Retell chat agent through `/api/chat/demo`. The fictional Oak City handbook lives in `lib/demo-knowledge.ts`; its 38 published articles drive the searchable library, chat citations, and both channel prompts. Technical references are linked in the articles; prices and business policies are explicitly sample data.

Run `npm run sync:demo-knowledge` after editing the handbook. The script saves non-secret resource IDs in `config/demo-retell.json`, waits for all article sources to be indexed (rerun if indexing is still in progress), and publishes the dedicated chat agent and the existing Oak City receptionist voice demo against the same Retell knowledge base. Set `RETELL_CHAT_DEMO_AGENT_ID` to the resulting chat agent ID in the hosting environment. Existing phone bindings and other business/outreach agents are not changed. `npm run sync:public-demo` also preserves the shared handbook in the voice prompt.

Apply `supabase/migrations/20261028150000_public_demo_chat.sql` before serving the new endpoint. Its service-role-only session records contain hashes, counters, and the provider chat ID, not transcripts. Atomic claims enforce 40 turns per session, 60 per IP/hour, 400 globally/hour, and 10 new sessions per IP/hour before paid inference. Provider failures still consume an attempt. Run `tests/demo-chat-sql.sql` with psql and `ON_ERROR_STOP=1` to exercise protections inside a rolled-back transaction.

The public AI demo is separate from tenant website chat and private knowledge previews, which continue to use their own approved tenant entries. It does not book appointments, dispatch, or send leads. Demo chat history is processed by Retell with 7-day retention; disclosures appear in the widget and privacy page. The source content is versioned in this repository; the public library is browse/search only. Customer knowledge editing remains in each authenticated workspace.
