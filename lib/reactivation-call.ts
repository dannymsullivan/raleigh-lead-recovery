import { normalizePhoneNumber } from "./phone";
import { inferEventType, isoDate, leadEventTypeLabel } from "./lead-enrichment";
import { opportunityDateFromContext } from "./lead-eligibility";
import type { Client, ReactivationCampaign, ReactivationContact } from "./types";

type CallIdentifiers = {
  assistantId: string;
  phoneNumberId: string;
};

export type ReactivationCallRequest = {
  assistantId: string;
  phoneNumberId: string;
  customer: { number: string; name: string; email?: string };
  metadata: { app: "lead-reactivation"; clientId: string; campaignId: string; contactId: string };
  assistantOverrides: {
    variableValues: {
      business_name: string;
      owner_name: string;
      contact_name: string;
      service_type: string;
      lead_source: string;
      lead_age_context: string;
      prior_context: string;
      event_type: string;
      event_date: string;
      prior_reason: string;
      callback_expectation: string;
    };
  };
};

function metadataValue(metadata: Record<string, string> | undefined, ...keys: string[]): string | null {
  const wanted = new Set(keys.map((key) => key.toLowerCase().replace(/[^a-z0-9]+/g, "_")));
  for (const [key, value] of Object.entries(metadata ?? {})) {
    if (wanted.has(key.toLowerCase().replace(/[^a-z0-9]+/g, "_")) && value.trim()) return value.trim();
  }
  return null;
}

export function minimalLeadBrief(contact: ReactivationContact): {
  eventType: string;
  eventDate: string;
  priorReason: string;
  summary: string;
} {
  const metadata = contact.import_metadata;
  const eventDate = isoDate(contact.event_date || opportunityDateFromContext(metadata, contact.notes));
  const inferredType = contact.event_type || inferEventType(
    metadataValue(metadata, "job_type", "event_type", "service_type"),
    metadataValue(metadata, "job_name", "event_name")
  );
  const eventType = inferredType === "unknown" || inferredType === "other" ? "event type not specified" : leadEventTypeLabel(inferredType);
  const rawPriorReason = contact.prior_reason || metadataValue(metadata, "closed_reason", "lost_reason", "status");
  const priorReason = rawPriorReason?.replace(/\s+/g, " ").trim().slice(0, 240) || "prior outcome not specified";
  const parts = [eventType !== "event type not specified" ? `Event: ${eventType}` : "", eventDate ? `Date: ${eventDate}` : "", priorReason !== "prior outcome not specified" ? `Prior outcome: ${priorReason}` : ""].filter(Boolean);
  return { eventType, eventDate: eventDate || "date not specified", priorReason, summary: parts.join(" · ").slice(0, 500) || "No additional structured context was provided." };
}

export function assertTestCallAllowed(client: Client, contact: ReactivationContact): void {
  if (!client.is_test_account) return;
  const destination = normalizePhoneNumber(contact.phone_e164);
  const allowed = [client.owner_phone, client.alert_phone]
    .map((phone) => phone ? normalizePhoneNumber(phone) : null)
    .filter((phone): phone is string => Boolean(phone));

  if (!destination || !allowed.includes(destination)) {
    throw new Error("Test accounts can only call the configured owner or alert phone.");
  }
}

export function buildReactivationCallRequest(
  client: Client,
  campaign: ReactivationCampaign,
  contact: ReactivationContact,
  identifiers: CallIdentifiers
): ReactivationCallRequest {
  assertTestCallAllowed(client, contact);
  const brief = minimalLeadBrief(contact);
  return {
    assistantId: identifiers.assistantId,
    phoneNumberId: identifiers.phoneNumberId,
    customer: { number: contact.phone_e164, name: contact.name, email: contact.email ?? undefined },
    metadata: { app: "lead-reactivation", clientId: client.id, campaignId: campaign.id, contactId: contact.id },
    assistantOverrides: {
      variableValues: {
        business_name: client.business_name,
        owner_name: client.owner_name,
        contact_name: contact.name,
        service_type: campaign.service_type || client.trade,
        lead_source: contact.source || "a previous inquiry",
        lead_age_context: contact.lead_age_days ? `${contact.lead_age_days} days ago` : "some time ago",
        prior_context: brief.summary,
        event_type: brief.eventType,
        event_date: brief.eventDate,
        prior_reason: brief.priorReason,
        callback_expectation: client.callback_window || "as soon as possible"
      }
    }
  };
}
