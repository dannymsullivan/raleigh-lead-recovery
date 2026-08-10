# Raleigh Lead Recovery Tool Finish Checklist

Use this before putting a real plumbing shop on a 7-day pilot. The goal is simple: a missed call should be answered, captured, delivered to the owner, and visible in a report without manual cleanup.

## Launch Gate

Do not start a real client pilot until these are true:

- A real missed-call test creates a call row in Supabase.
- The owner alert arrives reliably.
- The report page shows the captured call within a few minutes.
- The client has a unique routed number or clean client-matching setup.
- Danny gets notified when a landing-page audit request comes in.

## Priority 0: Owner Alerts

Status: Needs confirmation.

Why it matters: if the plumber does not get the lead quickly, the tool fails even if the call is recorded correctly.

Finish:

- Fix Twilio SMS deliverability for owner alerts.
- Confirm the Twilio sending number can text real mobile numbers outside a trial allowlist.
- Add a fallback alert path, ideally email to Danny and/or owner, when SMS fails.
- Add an admin view of failed SMS attempts.
- Add a manual retry button for failed owner alerts.

Acceptance test:

- Place 3 real test calls from different phones.
- Each call sends an owner alert within 60 seconds of the call ending.
- Failed SMS attempts are visible in admin with the Twilio error.

## Priority 0: Real End-To-End Test

Status: Needs one clean production run.

Finish:

- Call the live Vapi number.
- Pretend to be a homeowner with a realistic plumbing issue.
- Provide name, callback number, address, urgency, and timing.
- Confirm Vapi sends the end-of-call webhook.
- Confirm Supabase stores the call.
- Confirm owner alert sends.
- Confirm the report shows transcript, summary, value band, and audio if recording is enabled.
- Confirm the cost dashboard updates.

Acceptance test:

- One production test call completes with no manual database edits.
- The report can be shared with a plumber and makes sense without explanation.

## Priority 0: Client Routing

Status: Needs pilot decision.

Why it matters: multiple plumbers should not share the same production intake number unless the system can reliably identify which shop the call belongs to.

Preferred pilot setup:

- Keep `984-299-2155` as the public demo number.
- Provision or assign one unique Vapi number per real client.
- Match calls by `vapi_phone_number_id`.
- Add that Vapi phone number ID to the client row in admin.

Avoid:

- Forwarding 3 different plumbers into the same production number.
- Relying on the assistant to ask "which plumber were you calling?"
- Manually sorting calls after the fact.

Acceptance test:

- Test calls for Client A only appear in Client A's report.
- Test calls for Client B only appear in Client B's report.

## Priority 1: Audit Request Handling

Status: Form stores requests, but follow-up workflow needs improvement.

Finish:

- Add audit-request queue to admin.
- Show business name, owner name, phone, email, service area, notes, and created date.
- Add status: `new`, `contacted`, `qualified`, `not_fit`, `converted`.
- Send Danny an alert when a new request is submitted.
- Include the request details in the alert.

Acceptance test:

- Submit the landing-page form.
- Request appears in admin immediately.
- Danny receives an alert.
- Request can be marked contacted.

## Priority 1: Recording And Disclosure

Status: Report supports recordings if Vapi provides a `recording_url`.

Finish:

- Confirm recording is enabled or intentionally disabled in Vapi.
- Decide whether pilot reports should include audio playback.
- If storing recordings, update Mabel's opening language to disclose that the call may be recorded.
- Confirm the report audio player works on mobile.

Acceptance test:

- A test call either shows playable audio in the report or recording is intentionally absent.
- The caller disclosure matches what the system stores.

## Priority 1: Admin Pilot Checklist

Status: Needs a simple setup flow.

Finish:

- Add a per-client setup checklist in admin:
  - Client row created.
  - Owner phone verified.
  - Vapi phone number assigned.
  - Forwarding instructions sent.
  - First test call passed.
  - Report link shared.
  - Pilot start date confirmed.
- Show pilot start and end dates clearly.
- Add quick links for report and live number.

Acceptance test:

- A new plumber can be set up from the admin page without remembering hidden steps.

## Priority 2: Cost Guardrails

Status: Estimated cost dashboard exists.

Finish:

- Tune rate environment variables against actual Vapi and Twilio billing.
- Add monthly spend warning threshold.
- Show cost per client and cost per captured lead.
- Add a note when costs are estimated rather than invoice-backed.

Acceptance test:

- Admin shows current-month spend estimate.
- Admin flags when spend crosses the chosen warning threshold.

## Priority 2: Report Polish

Status: Report exists and is shareable.

Finish:

- Replace any demo/test names before showing prospects.
- Add a short "what this means" summary at the top.
- Make masked numbers consistent.
- Make value language conservative: pipeline value, not closed revenue.
- Add a print/save-friendly layout if plumbers ask for it.

Acceptance test:

- Send report link to a non-technical person.
- They can explain what was captured, what was urgent, and why it matters.

## First Pilot Runbook

1. Create client in admin.
2. Assign unique Vapi number to the client.
3. Verify owner phone and backup email.
4. Run one internal test call.
5. Confirm alert, report, recording, transcript, and cost dashboard.
6. Send forwarding instructions to the plumber.
7. Run one live forwarding test with the plumber.
8. Start 7-day pilot.
9. Check admin daily for failed SMS, unmatched calls, or weird transcripts.
10. Send end-of-week report and ask whether any captured calls turned into booked jobs.

## Definition Of Ready For Outreach

The tool is ready for heavier outreach when:

- SMS alerts are reliable.
- Demo number works consistently.
- One real pilot client can be set up in under 20 minutes.
- You can explain call forwarding in one paragraph.
- You can show a clean sample report.
- The admin page tells you what happened without checking provider dashboards.
