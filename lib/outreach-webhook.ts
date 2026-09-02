import type { OutreachCallOutcome, OutreachPotentialCustomer } from "./outreach";
import { outreachCallUpdate } from "./outreach";
import { normalizePhoneNumber } from "./phone";

type JsonRecord = Record<string, unknown>;
const record = (value: unknown): JsonRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value) ? value as JsonRecord : {};
const text = (value: unknown, maxLength = 4_000): string | null =>
  typeof value === "string" && value.trim() ? value.trim().slice(0, maxLength) : null;
const httpsUrl = (value: unknown): string | null => {
  const candidate = text(value, 2_000);
  if (!candidate) return null;
  try {
    return new URL(candidate).protocol === "https:" ? candidate : null;
  } catch {
    return null;
  }
};

const outcomes = new Set<OutreachCallOutcome>([
  "interested",
  "follow_up",
  "not_interested",
  "do_not_call",
  "voicemail",
  "no_answer",
  "busy",
  "wrong_number",
  "failed",
]);

export type OutreachCallReport = {
  eventType: string | null;
  callId: string | null;
  phoneE164: string | null;
  prospectId: string | null;
  attemptId: string | null;
  outcome: OutreachCallOutcome;
  potentialCustomer: OutreachPotentialCustomer;
  contactName: string | null;
  contactRole: string | null;
  interestReason: string | null;
  objection: string | null;
  requestedFollowUp: string | null;
  optOut: boolean;
  summary: string | null;
  transcript: string | null;
  recordingUrl: string | null;
  durationSeconds: number | null;
  structuredData: JsonRecord;
};

function fallbackOutcome(disconnectionReason: string): OutreachCallOutcome {
  if (disconnectionReason === "voicemail_reached") return "voicemail";
  if (disconnectionReason === "dial_no_answer" || disconnectionReason === "user_declined") return "no_answer";
  if (disconnectionReason === "dial_busy") return "busy";
  if (disconnectionReason === "invalid_destination") return "wrong_number";
  return "failed";
}

export function extractOutreachCallReport(payload: unknown): OutreachCallReport | null {
  const root = record(payload);
  const call = record(root.call);
  const metadata = record(call.metadata);
  if (text(metadata.app) !== "sales-outreach") return null;

  const analysis = record(call.call_analysis);
  const structured = record(analysis.custom_analysis_data);
  const rawOutcome = text(structured.outcome);
  const optOut = structured.opt_out === true || rawOutcome === "do_not_call";
  const outcome = optOut
    ? "do_not_call"
    : rawOutcome && outcomes.has(rawOutcome as OutreachCallOutcome)
      ? rawOutcome as OutreachCallOutcome
      : fallbackOutcome(text(call.disconnection_reason) ?? "");
  const potentialCustomer: OutreachPotentialCustomer = outcome === "interested"
    ? "yes"
    : outcome === "follow_up"
      ? "maybe"
      : "no";
  const durationMs = typeof call.duration_ms === "number" && Number.isFinite(call.duration_ms)
    ? call.duration_ms
    : null;

  return {
    eventType: text(root.event),
    callId: text(call.call_id, 160),
    phoneE164: normalizePhoneNumber(text(call.to_number, 60) ?? ""),
    prospectId: text(metadata.prospectId, 160),
    attemptId: text(metadata.attemptId, 160),
    outcome,
    potentialCustomer,
    contactName: text(structured.contact_name, 160),
    contactRole: text(structured.contact_role, 120),
    interestReason: text(structured.interest_reason, 1_000),
    objection: text(structured.objection, 1_000),
    requestedFollowUp: text(structured.requested_follow_up, 500),
    optOut,
    summary: text(analysis.call_summary, 4_000),
    transcript: text(call.transcript, 100_000),
    recordingUrl: httpsUrl(call.recording_url),
    durationSeconds: durationMs === null ? null : Math.round(durationMs / 1000),
    structuredData: {
      outcome,
      potential_customer: potentialCustomer,
      contact_name: text(structured.contact_name, 160),
      contact_role: text(structured.contact_role, 120),
      interest_reason: text(structured.interest_reason, 1_000),
      objection: text(structured.objection, 1_000),
      requested_follow_up: text(structured.requested_follow_up, 500),
      opt_out: optOut,
    },
  };
}

type OutreachWebhookStore = {
  completeAttempt(
    attemptId: string,
    prospectId: string,
    callId: string,
    values: Record<string, unknown>,
  ): Promise<string | null>;
  updateProspect(
    prospectId: string,
    eligibilityAttestedAt: string,
    values: Record<string, unknown>,
  ): Promise<boolean>;
  suppressPhone(phoneE164: string, prospectId: string, callId: string): Promise<void>;
};

export async function processOutreachCallReport(
  report: OutreachCallReport,
  rawPayload: unknown,
  store: OutreachWebhookStore,
  now = new Date(),
): Promise<string> {
  if (report.eventType !== "call_analyzed") return "ignored_outreach_event";
  if (!report.callId || !report.prospectId || !report.attemptId) return "invalid_outreach_event";

  if (report.optOut && report.phoneE164) {
    await store.suppressPhone(report.phoneE164, report.prospectId, report.callId);
  }
  const eligibilityAttestedAt = await store.completeAttempt(report.attemptId, report.prospectId, report.callId, {
    status: report.outcome === "failed" ? "failed" : "completed",
    outcome: report.outcome,
    potential_customer: report.potentialCustomer,
    contact_name: report.contactName,
    contact_role: report.contactRole,
    interest_reason: report.interestReason,
    objection: report.objection,
    requested_follow_up: report.requestedFollowUp,
    summary: report.summary,
    transcript: report.transcript,
    recording_url: report.recordingUrl,
    duration_seconds: report.durationSeconds,
    structured_data: report.structuredData,
    raw_payload: rawPayload,
    error: report.outcome === "failed" ? "Retell could not complete the call." : null,
  });
  if (!eligibilityAttestedAt) return "stale_outreach_event";

  const callUpdate = outreachCallUpdate(report.outcome, now.toISOString().slice(0, 10));
  const stage = report.outcome === "interested"
    ? "replied"
    : report.outcome === "follow_up"
      ? "call_scheduled"
      : ["not_interested", "do_not_call", "wrong_number"].includes(report.outcome)
        ? "not_interested"
        : undefined;
  await store.updateProspect(report.prospectId, eligibilityAttestedAt, {
    ...callUpdate,
    ...(stage ? { stage } : {}),
    last_retell_call_id: report.callId,
    potential_customer: report.potentialCustomer,
    last_call_summary: report.summary,
    call_in_progress_at: null,
    ...(report.optOut ? { do_not_call_at: now.toISOString() } : {}),
  });

  return "outreach_call_processed";
}
