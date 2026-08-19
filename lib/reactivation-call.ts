import { normalizePhoneNumber } from "./phone";
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
      callback_expectation: string;
    };
  };
};

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
        prior_context: contact.notes || "No additional context was provided.",
        callback_expectation: client.callback_window || "as soon as possible"
      }
    }
  };
}
