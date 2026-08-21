import { describe, expect, it } from "vitest";
import { assertTestCallAllowed, buildReactivationCallRequest, minimalLeadBrief } from "@/lib/reactivation-call";
import type { Client, ReactivationCampaign, ReactivationContact } from "@/lib/types";

const client = {
  id: "client-test",
  business_name: "Oak City Home Services",
  trade: "HVAC",
  owner_name: "Daniel",
  owner_phone: "+18455581569",
  owner_email: null,
  callback_window: "Within 15 minutes",
  pilot_start: "2026-08-19",
  pilot_end: "2027-08-19",
  avg_job_value: 1800,
  close_rate: 0.4,
  created_at: "2026-08-19T12:00:00.000Z",
  is_test_account: true
} satisfies Client;

const campaign = {
  id: "campaign-test",
  client_id: client.id,
  name: "QA — HVAC lead recovery",
  status: "ready",
  service_type: "HVAC replacement",
  calling_timezone: "America/New_York",
  calling_window_start: "08:00",
  calling_window_end: "20:00",
  max_attempts: 5,
  daily_limit: 1,
  eligibility_attested_at: "2026-08-19T12:00:00.000Z",
  launched_at: null,
  completed_at: null,
  created_at: "2026-08-19T12:00:00.000Z",
  updated_at: "2026-08-19T12:00:00.000Z"
} satisfies ReactivationCampaign;

const contact = {
  id: "contact-test",
  client_id: client.id,
  campaign_id: campaign.id,
  name: "Daniel",
  phone_e164: client.owner_phone,
  email: null,
  source: "Website estimate request",
  lead_age_days: 167,
  notes: "Asked about replacing an aging HVAC system, then paused the project.",
  event_date: "2027-05-22",
  event_type: "wedding",
  event_location: "The Raleigh Market",
  prior_reason: "Needed more information",
  priority_score: 80,
  status: "queued",
  outcome: null,
  project_type: null,
  requested_timing: null,
  qualification_notes: null,
  next_step: null,
  estimated_value: null,
  attempt_count: 0,
  last_attempt_at: null,
  next_attempt_at: null,
  owner_contacted_at: null,
  booked_at: null,
  created_at: "2026-08-19T12:00:00.000Z",
  updated_at: "2026-08-19T12:00:00.000Z"
} satisfies ReactivationContact;

describe("reactivation call requests", () => {
  it("injects the real customer and lead variables into Retell", () => {
    const request = buildReactivationCallRequest(client, campaign, contact, { agentId: "agent-live", phoneNumber: "+19195550123" });
    expect(request).toMatchObject({
      override_agent_id: "agent-live",
      from_number: "+19195550123",
      to_number: client.owner_phone,
      metadata: { app: "lead-reactivation", clientId: client.id, campaignId: campaign.id, contactId: contact.id },
      retell_llm_dynamic_variables: {
        business_name: "Oak City Home Services",
        owner_name: "Daniel",
        contact_name: "Daniel",
        service_type: "HVAC replacement",
        lead_source: "Website estimate request",
        lead_age_context: "167 days ago",
        event_type: "Wedding",
        event_date: "2027-05-22",
        prior_reason: "Needed more information"
      }
    });
  });

  it("sends a compact structured briefing instead of the full imported notes", () => {
    const brief = minimalLeadBrief(contact);
    expect(brief.summary).toContain("Event: Wedding");
    expect(brief.summary).toContain("Date: 2027-05-22");
    expect(brief.summary).toContain("Prior outcome: Needed more information");
    expect(brief.summary).not.toContain("aging HVAC system");
  });

  it("allows a test account to call its owner phone", () => {
    expect(() => assertTestCallAllowed(client, contact)).not.toThrow();
  });

  it("blocks a test account from calling any other number", () => {
    expect(() => assertTestCallAllowed(client, { ...contact, phone_e164: "+19195550123" })).toThrow(/configured owner or alert phone/);
  });
});
