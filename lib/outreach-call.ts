import { normalizePhoneNumber } from "./phone";
import type { OutreachProspect } from "./outreach";

export const manualOutreachWindowLabel = "weekdays from 9 AM to 9 PM Eastern";

export type OutreachCallRequest = {
  from_number: string;
  to_number: string;
  override_agent_id: string;
  override_agent_version: "latest_published";
  metadata: { app: "sales-outreach"; prospectId: string; attemptId: string };
  retell_llm_dynamic_variables: Record<string, string>;
};

export function buildOutreachCallRequest(
  prospect: OutreachProspect,
  identifiers: { agentId: string; phoneNumber: string },
  attemptId: string,
): OutreachCallRequest {
  const destination = normalizePhoneNumber(prospect.phone ?? "");
  if (!destination) throw new Error("Prospect needs a valid phone number.");

  return {
    from_number: identifiers.phoneNumber,
    to_number: destination,
    override_agent_id: identifiers.agentId,
    override_agent_version: "latest_published",
    metadata: { app: "sales-outreach", prospectId: prospect.id, attemptId },
    retell_llm_dynamic_variables: {
      company_name: prospect.company_name,
      contact_name: prospect.contact_name || "not provided",
      contact_role: prospect.contact_role || "not provided",
      city: prospect.city || "not provided",
      website: prospect.website || "not provided",
      prior_context: prospect.notes?.replace(/\s+/g, " ").trim().slice(0, 500) || "No prior context provided.",
      booking_url: process.env.NEXT_PUBLIC_PILOT_BOOKING_URL?.trim() || "Ask for a preferred follow-up time.",
    },
  };
}

export function isWithinManualOutreachWindow(date = new Date(), timezone = "America/New_York"): boolean {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "short",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const weekday = parts.find((part) => part.type === "weekday")?.value;
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? -1);
  return weekday !== "Sat" && weekday !== "Sun" && hour >= 9 && hour < 21;
}
