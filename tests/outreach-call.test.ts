import { afterEach, describe, expect, it, vi } from "vitest";
import { buildOutreachCallRequest, isWithinManualOutreachWindow } from "@/lib/outreach-call";
import type { OutreachProspect } from "@/lib/outreach";

const prospect: OutreachProspect = {
  id: "prospect-1",
  company_name: "Cool Breeze HVAC",
  website: "coolbreeze.example",
  city: "Raleigh",
  contact_name: "Morgan",
  contact_role: "Owner",
  email: null,
  phone: "(919) 555-0100",
  last_call_outcome: null,
  last_retell_call_id: null,
  potential_customer: null,
  last_call_summary: null,
  call_in_progress_at: null,
  do_not_call_at: null,
  automated_call_attempt_count: 0,
  stage: "not_contacted",
  last_contacted_on: null,
  next_follow_up_on: null,
  notes: "Owner handles missed calls manually.",
  created_at: "2026-09-02T00:00:00Z",
  updated_at: "2026-09-02T00:00:00Z",
};

describe("outreach Retell call request", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("injects only the selected prospect and internal correlation IDs", () => {
    expect(buildOutreachCallRequest(
      prospect,
      { agentId: "agent-sales", phoneNumber: "+19195550199" },
      "attempt-1",
    )).toMatchObject({
      from_number: "+19195550199",
      to_number: "+19195550100",
      override_agent_id: "agent-sales",
      override_agent_version: "latest_published",
      metadata: { app: "sales-outreach", prospectId: "prospect-1", attemptId: "attempt-1" },
      retell_llm_dynamic_variables: {
        company_name: "Cool Breeze HVAC",
        contact_name: "Morgan",
        contact_role: "Owner",
      },
    });
  });

  it("rejects an invalid destination", () => {
    expect(() => buildOutreachCallRequest(
      { ...prospect, phone: "not a phone" },
      { agentId: "agent-sales", phoneNumber: "+19195550199" },
      "attempt-1",
    )).toThrow("valid phone number");
  });

  it("uses safe defaults for missing optional prospect context", () => {
    const request = buildOutreachCallRequest(
      {
        ...prospect,
        website: null,
        city: null,
        contact_name: null,
        contact_role: null,
        notes: "   ",
      },
      { agentId: "agent-sales", phoneNumber: "+19195550199" },
      "attempt-2",
    );

    expect(request.retell_llm_dynamic_variables).toMatchObject({
      contact_name: "not provided",
      contact_role: "not provided",
      city: "not provided",
      website: "not provided",
      prior_context: "No prior context provided.",
      booking_url: "Ask for a preferred follow-up time.",
    });
  });

  it("normalizes bounded prior context and uses the configured booking URL", () => {
    vi.stubEnv("NEXT_PUBLIC_PILOT_BOOKING_URL", " https://example.com/book ");
    const request = buildOutreachCallRequest(
      { ...prospect, notes: `  ${"follow   up ".repeat(80)}  ` },
      { agentId: "agent-sales", phoneNumber: "+19195550199" },
      "attempt-3",
    );

    expect(request.retell_llm_dynamic_variables.booking_url).toBe("https://example.com/book");
    expect(request.retell_llm_dynamic_variables.prior_context).not.toMatch(/\s{2,}/);
    expect(request.retell_llm_dynamic_variables.prior_context).toHaveLength(500);
  });

  it("allows only weekday business hours in Eastern time", () => {
    expect(isWithinManualOutreachWindow(new Date("2026-09-02T13:00:00Z"))).toBe(true);
    expect(isWithinManualOutreachWindow(new Date("2026-09-02T14:00:00Z"))).toBe(true);
    expect(isWithinManualOutreachWindow(new Date("2026-09-02T20:59:00Z"))).toBe(true);
    expect(isWithinManualOutreachWindow(new Date("2026-09-02T21:00:00Z"))).toBe(false);
    expect(isWithinManualOutreachWindow(new Date("2026-09-02T22:00:00Z"))).toBe(false);
    expect(isWithinManualOutreachWindow(new Date("2026-09-05T14:00:00Z"))).toBe(false);
  });
});
