import type { ReactivationOutcome } from "./reactivation";
import { buildLeadAlertSms } from "./messaging-consent";

type JsonRecord = Record<string, unknown>;
const outcomes = new Set<ReactivationOutcome>(["interested_now", "follow_up_later", "project_completed", "not_interested", "wrong_number", "do_not_call", "no_answer", "failed"]);
const record = (value: unknown): JsonRecord => typeof value === "object" && value !== null && !Array.isArray(value) ? value as JsonRecord : {};
const text = (value: unknown): string | null => typeof value === "string" && value.trim() ? value.trim() : null;

export type ReactivationReport = {
  eventType: string | null;
  callId: string | null;
  clientId: string | null;
  campaignId: string | null;
  contactId: string | null;
  outcome: ReactivationOutcome;
  projectType: string | null;
  requestedTiming: string | null;
  qualificationNotes: string | null;
  nextStep: string | null;
  optOut: boolean;
  summary: string | null;
  transcript: string | null;
  recordingUrl: string | null;
  durationSeconds: number | null;
  structuredData: JsonRecord;
};

export function extractReactivationReport(payload: unknown): ReactivationReport | null {
  const root = record(payload);
  const call = record(root.call);
  const metadata = record(call.metadata);
  if (text(metadata.app) !== "lead-reactivation") return null;
  const analysis = record(call.call_analysis);
  const structured = record(analysis.custom_analysis_data);
  const rawOutcome = text(structured.outcome);
  const endedReason = (text(call.disconnection_reason) ?? "").toLowerCase();
  const transcript = text(call.transcript);
  const fallback: ReactivationOutcome = !transcript && (endedReason.includes("no-answer") || endedReason.includes("voicemail") || endedReason.includes("dial_no_answer")) ? "no_answer" : "failed";
  const outcome = rawOutcome && outcomes.has(rawOutcome as ReactivationOutcome) ? rawOutcome as ReactivationOutcome : fallback;
  const durationMs = typeof call.duration_ms === "number" && Number.isFinite(call.duration_ms) ? call.duration_ms : null;
  return {
    eventType: text(root.event),
    callId: text(call.call_id),
    clientId: text(metadata.clientId),
    campaignId: text(metadata.campaignId),
    contactId: text(metadata.contactId),
    outcome,
    projectType: text(structured.project_type),
    requestedTiming: text(structured.requested_timing),
    qualificationNotes: text(structured.qualification_notes),
    nextStep: text(structured.next_step),
    optOut: structured.opt_out === true || outcome === "do_not_call",
    summary: text(analysis.call_summary),
    transcript,
    recordingUrl: text(call.recording_url),
    durationSeconds: durationMs === null ? null : Math.round(durationMs / 1000),
    structuredData: structured
  };
}

export function buildInterestedLeadSms(businessName: string, contactName: string, phone: string, requestedTiming: string | null, dashboardUrl: string): string {
  return buildLeadAlertSms({ businessName, contactName, phone, requestedTiming, dashboardUrl });
}
