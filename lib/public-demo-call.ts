import { normalizePhoneNumber } from "./phone";

type JsonRecord = Record<string, unknown>;
export type DemoType = "general" | "hvac" | "plumbing" | "roofing" | "real_estate" | "home_services" | "events";

export const PUBLIC_DEMO_CONSENT_VERSION = "demo-call-v1-2026-08-19";
export const PUBLIC_DEMO_CONSENT_TEXT = "I confirm I control this number or am authorized to use it. I request one automated demo call from Mabel and consent to the call being recorded and transcribed for demonstration and quality purposes. Consent is not a condition of purchase.";

export type PublicDemoCallInput = {
  name: string;
  businessName: string;
  phoneE164: string;
  demoType: DemoType;
};

export type PublicDemoCallRequest = {
  assistantId: string;
  phoneNumberId: string;
  customer: { number: string; name: string };
  metadata: { app: "public-demo"; requestId: string; variant: DemoType };
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
  const demoType: DemoType = input.demoType === "hvac" || input.demoType === "plumbing" || input.demoType === "roofing" || input.demoType === "real_estate" || input.demoType === "home_services" || input.demoType === "events"
    ? input.demoType
    : "general";
  if (input.consent !== true) throw new Error("consent_required");
  const phoneE164 = normalizePhoneNumber(typeof input.phone === "string" ? input.phone : "");
  if (!phoneE164 || !/^\+1[2-9]\d{2}[2-9]\d{6}$/.test(phoneE164)) throw new Error("phone_invalid");
  return { name, businessName, phoneE164, demoType };
}

export function isPublicDemoCallingWindow(date = new Date()): boolean {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "2-digit",
    hourCycle: "h23"
  }).formatToParts(date);
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? -1);
  return hour >= 9 && hour < 20;
}

export function buildPublicDemoCallRequest(
  input: PublicDemoCallInput,
  identifiers: { assistantId: string; phoneNumberId: string; requestId: string }
): PublicDemoCallRequest {
  const scenario = {
    general: {
      serviceType: "quote",
      leadSource: "a previous inquiry",
      priorContext: "You requested information but did not make a decision at the time."
    },
    hvac: {
      serviceType: "HVAC estimate",
      leadSource: "a previous heating and cooling inquiry",
      priorContext: "You asked about heating or cooling service but did not schedule at the time. The exact equipment and issue are not known in this instant demo."
    },
    plumbing: {
      serviceType: "plumbing estimate",
      leadSource: "a previous plumbing inquiry",
      priorContext: "You previously asked about a plumbing repair or project but did not schedule at the time. The exact fixture and issue are not known in this instant demo."
    },
    roofing: {
      serviceType: "roofing estimate",
      leadSource: "a previous roofing inquiry",
      priorContext: "You previously asked about a roof repair, replacement, or inspection but did not schedule at the time. The exact roof and issue are not known in this instant demo."
    },
    real_estate: {
      serviceType: "real estate inquiry",
      leadSource: "a previous property inquiry",
      priorContext: "You previously asked about buying, selling, or investing in property but did not move forward at the time. The exact property and goal are not known in this instant demo."
    },
    home_services: {
      serviceType: "home service estimate",
      leadSource: "a previous home service inquiry",
      priorContext: "You previously requested information or an estimate for work at your home but did not schedule at the time. The exact service and project are not known in this instant demo."
    },
    events: {
      serviceType: "event service quote",
      leadSource: "a previous event services inquiry",
      priorContext: "You previously requested information or a quote for an event service but did not book at the time. The exact event, date, and service are not known in this instant demo."
    }
  }[input.demoType];
  return {
    assistantId: identifiers.assistantId,
    phoneNumberId: identifiers.phoneNumberId,
    customer: { number: input.phoneE164, name: input.name },
    metadata: { app: "public-demo", requestId: identifiers.requestId, variant: input.demoType },
    assistantOverrides: {
      variableValues: {
        business_name: input.businessName,
        owner_name: `${input.businessName} team`,
        contact_name: input.name,
        service_type: scenario.serviceType,
        lead_source: scenario.leadSource,
        lead_age_context: "a few weeks ago",
        prior_context: scenario.priorContext,
        callback_expectation: "during normal business hours"
      }
    }
  };
}
