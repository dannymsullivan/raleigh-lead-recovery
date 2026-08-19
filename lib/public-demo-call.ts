import { normalizePhoneNumber } from "./phone";

type JsonRecord = Record<string, unknown>;

export const PUBLIC_DEMO_CONSENT_VERSION = "demo-call-v1-2026-08-19";
export const PUBLIC_DEMO_CONSENT_TEXT = "I confirm I control this number or am authorized to use it. I request one automated demo call from Mabel and consent to the call being recorded and transcribed for demonstration and quality purposes. Consent is not a condition of purchase.";

export type PublicDemoCallInput = {
  name: string;
  businessName: string;
  phoneE164: string;
};

export type PublicDemoCallRequest = {
  assistantId: string;
  phoneNumberId: string;
  customer: { number: string; name: string };
  metadata: { app: "public-demo"; requestId: string };
  assistantOverrides: {
    variableValues: {
      business_name: string;
      owner_name: string;
      contact_name: string;
      service_type: string;
      lead_source: string;
      lead_age_context: string;
      prior_context: string;
      callback_expectation: string;
    };
  };
};

function cleanText(value: unknown, field: string, maxLength: number): string {
  if (typeof value !== "string") throw new Error(`${field}_required`);
  const cleaned = value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
  if (cleaned.length < 2) throw new Error(`${field}_required`);
  if (cleaned.length > maxLength) throw new Error(`${field}_too_long`);
  return cleaned;
}

export function parsePublicDemoCallInput(value: unknown): PublicDemoCallInput {
  const input: JsonRecord = typeof value === "object" && value !== null && !Array.isArray(value) ? value as JsonRecord : {};
  const name = cleanText(input.name, "name", 70);
  const businessName = cleanText(input.businessName, "business_name", 100);
  if (input.consent !== true) throw new Error("consent_required");
  const phoneE164 = normalizePhoneNumber(typeof input.phone === "string" ? input.phone : "");
  if (!phoneE164 || !/^\+1[2-9]\d{2}[2-9]\d{6}$/.test(phoneE164)) throw new Error("phone_invalid");
  return { name, businessName, phoneE164 };
}

export function isPublicDemoCallingWindow(date = new Date()): boolean {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
    hour: "2-digit",
    hourCycle: "h23"
  }).formatToParts(date);
  const weekday = parts.find((part) => part.type === "weekday")?.value;
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? -1);
  return weekday !== "Sat" && weekday !== "Sun" && hour >= 12 && hour < 19;
}

export function buildPublicDemoCallRequest(
  input: PublicDemoCallInput,
  identifiers: { assistantId: string; phoneNumberId: string; requestId: string }
): PublicDemoCallRequest {
  return {
    assistantId: identifiers.assistantId,
    phoneNumberId: identifiers.phoneNumberId,
    customer: { number: input.phoneE164, name: input.name },
    metadata: { app: "public-demo", requestId: identifiers.requestId },
    assistantOverrides: {
      variableValues: {
        business_name: input.businessName,
        owner_name: `${input.businessName} team`,
        contact_name: input.name,
        service_type: "quote",
        lead_source: "a previous inquiry",
        lead_age_context: "a few weeks ago",
        prior_context: "You requested information but did not make a decision at the time.",
        callback_expectation: "during normal business hours"
      }
    }
  };
}
