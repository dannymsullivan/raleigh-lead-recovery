import {
  type ExtractedVapiCall,
  type LeadType,
  leadTypeValues,
  type Urgency,
  urgencyValues,
  type ValueBand,
  valueBandValues
} from "./types";

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function recordAt(record: JsonRecord, key: string): JsonRecord | null {
  const value = record[key];
  return isRecord(value) ? value : null;
}

function stringAt(record: JsonRecord | null, key: string): string | null {
  if (!record) {
    return null;
  }

  const value = record[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function numberAt(record: JsonRecord | null, key: string): number | null {
  if (!record) {
    return null;
  }

  const value = record[key];
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) {
    return Number(value);
  }

  return null;
}

function firstString(...values: Array<string | null>): string | null {
  return values.find((value) => value !== null) ?? null;
}

function firstNumber(...values: Array<number | null>): number | null {
  return values.find((value) => value !== null) ?? null;
}

function firstRecord(...values: Array<JsonRecord | null>): JsonRecord | null {
  return values.find((value) => value !== null) ?? null;
}

function normalizeEnum<T extends readonly string[]>(value: string | null, allowed: T, fallback: T[number]): T[number] {
  if (!value) {
    return fallback;
  }

  return allowed.includes(value) ? value : fallback;
}

export function extractVapiCall(payload: unknown): ExtractedVapiCall {
  const root = isRecord(payload) ? payload : {};
  const message = recordAt(root, "message") ?? root;
  const call = firstRecord(recordAt(message, "call"), recordAt(root, "call")) ?? {};
  const analysis = firstRecord(recordAt(message, "analysis"), recordAt(call, "analysis"), recordAt(root, "analysis")) ?? {};
  const structured =
    firstRecord(
      recordAt(analysis, "structuredData"),
      recordAt(analysis, "structured_data"),
      recordAt(message, "structuredData"),
      recordAt(message, "structured_data")
    ) ?? {};
  const customer = firstRecord(recordAt(call, "customer"), recordAt(message, "customer")) ?? {};
  const artifact = firstRecord(recordAt(message, "artifact"), recordAt(call, "artifact")) ?? {};
  const phoneNumber = firstRecord(recordAt(call, "phoneNumber"), recordAt(message, "phoneNumber")) ?? {};

  const leadType = normalizeEnum<readonly LeadType[]>(
    stringAt(structured, "lead_type"),
    leadTypeValues,
    "other"
  );
  const urgency = normalizeEnum<readonly Urgency[]>(
    stringAt(structured, "urgency"),
    urgencyValues,
    "other"
  );
  const estimatedValueBand = normalizeEnum<readonly ValueBand[]>(
    firstString(stringAt(structured, "estimated_job_value_band"), stringAt(structured, "estimated_value_band")),
    valueBandValues,
    "unknown"
  );

  return {
    eventType: stringAt(message, "type"),
    vapiCallId: firstString(stringAt(call, "id"), stringAt(message, "callId"), stringAt(root, "callId")),
    assistantId: firstString(stringAt(call, "assistantId"), stringAt(message, "assistantId")),
    phoneNumberId: firstString(
      stringAt(call, "phoneNumberId"),
      stringAt(phoneNumber, "id"),
      stringAt(message, "phoneNumberId")
    ),
    callerNumber: firstString(
      stringAt(customer, "number"),
      stringAt(customer, "phoneNumber"),
      stringAt(customer, "numberE164"),
      stringAt(call, "customerNumber")
    ),
    callerName: stringAt(structured, "caller_name"),
    callbackNumber: stringAt(structured, "callback_number"),
    serviceAddress: stringAt(structured, "service_address"),
    issueDescription: stringAt(structured, "issue_description"),
    urgency,
    leadType,
    estimatedValueBand,
    requestedTiming: stringAt(structured, "requested_timing"),
    callbackPromisedBy: stringAt(structured, "callback_promised_by"),
    summary: firstString(stringAt(analysis, "summary"), stringAt(message, "summary")),
    transcript: firstString(stringAt(message, "transcript"), stringAt(artifact, "transcript"), stringAt(call, "transcript")),
    recordingUrl: firstString(
      stringAt(message, "recordingUrl"),
      stringAt(message, "recording_url"),
      stringAt(artifact, "recordingUrl"),
      stringAt(call, "recordingUrl")
    ),
    durationSeconds: firstNumber(
      numberAt(message, "durationSeconds"),
      numberAt(call, "durationSeconds"),
      numberAt(message, "duration")
    )
  };
}
