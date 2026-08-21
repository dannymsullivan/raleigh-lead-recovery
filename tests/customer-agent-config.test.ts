import { describe, expect, it } from "vitest";
import { customerAgentReady, defaultFirstMessage, leadReactivationPrompt, receptionistPrompt } from "@/lib/customer-agent-config";
import type { Client, CustomerAgent } from "@/lib/types";

const client = {
  id: "client-1",
  business_name: "Zim Zoom Photo Booth",
  trade: "photo booths",
  owner_name: "Sushma",
  owner_phone: "+19195550123",
  owner_email: null,
  service_area: "Raleigh, NC",
  services: ["weddings", "corporate events"],
  business_hours: { monday: { closed: false, open: "09:00", close: "17:00" } },
  callback_window: "Within one business day",
  pilot_start: "2026-08-01",
  pilot_end: "2026-08-30",
  avg_job_value: 900,
  close_rate: 0.4,
  created_at: "2026-08-01T00:00:00Z"
} satisfies Client;

const agent = {
  handoff_rules: "Send interested leads to Sushma with the event date.",
  custom_instructions: "Never offer a discount.",
  offer_details: "Ask whether their future event still needs a booth."
} satisfies Pick<CustomerAgent, "handoff_rules" | "custom_instructions" | "offer_details">;

describe("customer agent configuration", () => {
  it("keeps receptionist and lead-recovery jobs distinct", () => {
    const receptionist = receptionistPrompt(client, agent);
    const reactivation = leadReactivationPrompt(client, agent);
    expect(receptionist).toContain("24/7 receptionist");
    expect(receptionist).toContain("corporate events");
    expect(reactivation).toContain("automated lead-recovery assistant");
    expect(reactivation).toContain("future event still needs a booth");
    expect(reactivation).toContain("{{contact_name}}");
  });

  it("uses the business name in inbound greetings and variables for outbound greetings", () => {
    expect(defaultFirstMessage("receptionist", client)).toContain("Zim Zoom Photo Booth");
    expect(defaultFirstMessage("lead_reactivation", client)).toContain("{{business_name}}");
  });

  it("requires a ready assistant and phone number", () => {
    expect(customerAgentReady({ status: "ready", retell_agent_id: "agent-1", retell_phone_number: "+19195550123" })).toBe(true);
    expect(customerAgentReady({ status: "draft", retell_agent_id: "agent-1", retell_phone_number: "+19195550123" })).toBe(false);
    expect(customerAgentReady({ status: "ready", retell_agent_id: "agent-1", retell_phone_number: null })).toBe(false);
  });
});
