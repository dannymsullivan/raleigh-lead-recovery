# Production vertical blueprint

The public demos intentionally qualify and demonstrate a handoff without accessing a real CRM or calendar. A customer deployment should add atomic tools only after the authoritative system and permissions are known.

## Recommended atomic tools

### `lookup_lead`

Use to retrieve the approved lead record and recent activity before discussing prior context. Input: stable lead ID. Return only the fields Mabel needs.

### `check_eligibility`

Use immediately before dialing or continuing outreach. It must deterministically reject opt-outs, manual holds, recent calls or messages, appointments, closed records, and records outside the calling window.

### `capture_lead_update`

Use incrementally after meaningful new details. Input: lead ID, outcome, notes, requested timing, and opt-out. Updates must be idempotent.

### `check_availability`

Use before offering any appointment. Input: service type, location or service area, and requested date range. Return no more than three valid slots. Configure a deterministic `request-start` message: “Let me check what’s available.”

### `book_appointment`

Use only after the caller chooses and confirms a slot returned by `check_availability`. Input: slot ID, lead ID, and required customer details. Never accept a free-form time as proof of availability.

### `request_owner_callback`

Use when a callback is more appropriate than calendar booking. Input: lead ID, preferred window, short summary, and urgency. Configure a deterministic `request-start` message: “I’ll pass that along now.”

### `transfer_call`

Use only when the customer explicitly asks for a person or the approved escalation rule applies. The destination is server-selected, not model-generated. Play: “I’ll connect you with the team. Please hold.” If it fails, offer a callback rather than claiming the transfer succeeded.

## Booking sequence

1. Establish intent and collect the minimum qualifying information.
2. Ask for the preferred day or window.
3. Call `check_availability`.
4. Offer two or three returned options.
5. Confirm the selected exact date and time.
6. Call `book_appointment` using the returned slot ID.
7. State that the appointment is booked only after a successful tool response.
8. Write the result and opt-out state back to the CRM.

## Transfer rules

- Transfer on an explicit human request, urgent approved escalation, or a question requiring human authorization.
- Do not resist a repeated human request.
- Do not transfer to a number produced by the model.
- Use warm transfer only when an operator summary and acceptance are valuable; otherwise use a simple transfer or callback.

## Voicemail

- Use Vapi voicemail detection with a short vertical-specific message.
- Do not include sensitive prior details.
- Make clear why Mabel called and what the recipient should do, if anything.
- Record voicemail as its own disposition so retry rules remain deterministic.

## Deployment gate

Before a customer goes live, pass the vertical test suite plus real CRM, calendar, transfer, voicemail, opt-out, recent-activity, and duplicate-call tests in a staging account.
