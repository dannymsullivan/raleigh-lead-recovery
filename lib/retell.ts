import "server-only";

import Retell from "retell-sdk";
import {
  type ExtractedRetellCall,
  type LeadType,
  leadTypeValues,
  type Urgency,
  urgencyValues,
  type ValueBand,
  valueBandValues
} from "./types";

type JsonRecord = Record<string, unknown>;

const record = (value: unknown): JsonRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value) ? value as JsonRecord : {};
const text = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;
const number = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

function enumValue<T extends readonly string[]>(value: unknown, allowed: T, fallback: T[number]): T[number] {
  return typeof value === "string" && allowed.includes(value) ? value : fallback;
}

export function requiredRetellApiKey(): string {
  const apiKey = process.env.RETELL_API_KEY?.trim();
  if (!apiKey) throw new Error("Missing RETELL_API_KEY");
  return apiKey;
}

export function getRetellClient(): Retell {
  return new Retell({ apiKey: requiredRetellApiKey(), timeout: 20_000, maxRetries: 2 });
}

export async function verifyRetellWebhook(rawBody: string, signature: string | null): Promise<boolean> {
  if (!signature) return false;
  return Retell.verify(rawBody, requiredRetellApiKey(), signature);
}

export function extractRetellCall(payload: unknown): ExtractedRetellCall {
  const root = record(payload);
  const call = record(root.call);
  const analysis = record(call.call_analysis);
  const structured = record(analysis.custom_analysis_data);
  const direction = text(call.direction);
  const durationMs = number(call.duration_ms);

  return {
    eventType: text(root.event),
    retellCallId: text(call.call_id),
    agentId: text(call.agent_id),
    phoneNumber: direction === "outbound" ? text(call.from_number) : text(call.to_number),
    callerNumber: direction === "outbound" ? text(call.to_number) : text(call.from_number),
    callerName: text(structured.caller_name),
    callbackNumber: text(structured.callback_number),
    serviceAddress: text(structured.service_address),
    issueDescription: text(structured.issue_description),
    urgency: enumValue<readonly Urgency[]>(structured.urgency, urgencyValues, "other"),
    leadType: enumValue<readonly LeadType[]>(structured.lead_type, leadTypeValues, "other"),
    estimatedValueBand: enumValue<readonly ValueBand[]>(
      structured.estimated_job_value_band ?? structured.estimated_value_band,
      valueBandValues,
      "unknown"
    ),
    requestedTiming: text(structured.requested_timing),
    callbackPromisedBy: text(structured.callback_promised_by),
    summary: text(analysis.call_summary),
    transcript: text(call.transcript),
    recordingUrl: text(call.recording_url),
    durationSeconds: durationMs === null ? null : Math.round(durationMs / 1000)
  };
}

export async function sendRetellSms(message: { to: string; body: string; from?: string }): Promise<void> {
  const fromNumber = message.from?.trim() || process.env.RETELL_SMS_FROM_NUMBER?.trim();
  const agentId = process.env.RETELL_SMS_AGENT_ID?.trim();
  if (!fromNumber || !agentId) {
    throw new Error("Missing RETELL_SMS_FROM_NUMBER or RETELL_SMS_AGENT_ID");
  }

  await getRetellClient().chat.createSMSChat({
    from_number: fromNumber,
    to_number: message.to,
    override_agent_id: agentId,
    retell_llm_dynamic_variables: { message_body: message.body }
  });
}
