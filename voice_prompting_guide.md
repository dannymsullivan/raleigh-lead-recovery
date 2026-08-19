# Mabel voice prompting reference

This project uses the following production principles when creating or revising Vapi assistants.

## Core structure

1. Identity and personality
2. Spoken-response guidelines
3. Guardrails
4. Runtime context
5. Workflow and branches
6. Short examples

## Voice rules

- Optimize for a phone call, not a text chat.
- Keep most turns to one or two sentences and under roughly thirty words.
- Ask one primary question at a time.
- Confirm exact, consequential details; do not read back soft qualification data.
- Match the caller's pace. Keep routine replies clean and use only occasional natural hesitation.
- Stop and listen when interrupted. Do not restart the previous answer.
- Treat short acknowledgments differently from substantive interruptions.
- Give silence enough room before checking whether the caller is still there.

## Reliability rules

- The model decides what action is appropriate; authoritative systems decide what is true.
- Never invent availability, pricing, appointments, policies, or customer facts.
- Prefer small, atomic tools with explicit descriptions.
- Check availability before offering a time and confirm success before claiming a booking.
- Add deterministic request-start messages to slow tools so callers do not hear unexplained dead air.
- Keep tool responses small, structured, and free of unnecessary sensitive data.
- Use server-side checks for security and identity; prompts are not security boundaries.

## Human tone

- Warm, calm, observant, and concise beats overly enthusiastic.
- Rapport should react to something specific and last no more than a beat or two.
- Light banter is not the same as an out-of-scope request.
- Avoid prescribed filler quotas. Forced stutters and multiple disfluencies per turn can sound glitchy, especially in transactional calls.

## Testing

Evaluate changes across representative calls rather than one call. Track:

1. Caller stops speaking
2. Final transcript
3. Model first token
4. Tool duration, if any
5. TTS first audio
6. Audio heard by the caller

Change one major variable at a time when comparing prompts, models, voices, or endpointing.
