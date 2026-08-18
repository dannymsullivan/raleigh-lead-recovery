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
  const message = Object.keys(record(root.message)).length ? record(root.message) : root;
  const call = record(message.call);
  const metadata = record(call.metadata);
  if (text(metadata.app) !== "lead-reactivation") return null;
  const analysis = record(message.analysis);
  const structured = record(analysis.structuredData ?? analysis.structured_data);
  const artifact = record(message.artifact ?? call.artifact);
  const recording = record(artifact.recording);
  const rawOutcome = text(structured.outcome);
  const endedReason = (text(call.endedReason) ?? "").toLowerCase();
  const transcript = text(message.transcript ?? artifact.transcript ?? call.transcript);
  const fallback: ReactivationOutcome = !transcript && (endedReason.includes("no-answer") || endedReason.includes("voicemail")) ? "no_answer" : "failed";
  const outcome = rawOutcome && outcomes.has(rawOutcome as ReactivationOutcome) ? rawOutcome as ReactivationOutcome : fallback;
  const duration = message.durationSeconds ?? call.durationSeconds ?? message.duration;
  return {
    eventType: text(message.type),
    callId: text(call.id ?? message.callId),
    clientId: text(metadata.clientId),
    campaignId: text(metadata.campaignId),
    contactId: text(metadata.contactId),
    outcome,
    projectType: text(structured.project_type),
    requestedTiming: text(structured.requested_timing),
    qualificationNotes: text(structured.qualification_notes),
    nextStep: text(structured.next_step),
    optOut: structured.opt_out === true || outcome === "do_not_call",
    summary: text(analysis.summary ?? message.summary),
    transcript,
    recordingUrl: text(recording.stereoUrl ?? recording.monoUrl ?? recording.url ?? artifact.recordingUrl ?? message.recordingUrl),
    durationSeconds: typeof duration === "number" && Number.isFinite(duration) ? duration : null,
    structuredData: structured
  };
}

export function buildInterestedLeadSms(businessName: string, contactName: string, phone: string, requestedTiming: string | null, dashboardUrl: string): string {
  return buildLeadAlertSms({ businessName, contactName, phone, requestedTiming, dashboardUrl });
}
