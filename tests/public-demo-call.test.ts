import { describe, expect, it } from "vitest";
import { buildPublicDemoCallRequest, hasElevatedPublicDemoLimit, isPublicDemoCallingWindow, parsePublicDemoCallInput } from "@/lib/public-demo-call";

describe("public voice demos", () => {
  it("validates and normalizes a consented request", () => {
    expect(parsePublicDemoCallInput({ name: "  Alex   Morgan ", businessName: " Acme Property Group ", phone: "(919) 555-0123", consent: true })).toEqual({
      name: "Alex Morgan", businessName: "Acme Property Group", phoneE164: "+19195550123", demoType: "general"
    });
  });

  it("requires consent and a valid North American number", () => {
    expect(() => parsePublicDemoCallInput({ name: "Alex", businessName: "Acme", phone: "919-555-0123", consent: false })).toThrow("consent_required");
    expect(() => parsePublicDemoCallInput({ name: "Alex", businessName: "Acme", phone: "+44 20 7946 0958", consent: true })).toThrow("phone_invalid");
  });

  it("keeps the owner test allowance finite and restricted", () => {
    expect(hasElevatedPublicDemoLimit("+18455481569")).toBe(true);
    expect(hasElevatedPublicDemoLimit("+19195550123")).toBe(false);
  });

  it("builds a Retell request with minimal dynamic context", () => {
    const request = buildPublicDemoCallRequest(
      { name: "Alex Morgan", businessName: "Acme Property Group", phoneE164: "+19195550123", demoType: "hvac" },
      { agentId: "agent-hvac", phoneNumber: "+19845550123", requestId: "request-1" }
    );
    expect(request).toMatchObject({
      override_agent_id: "agent-hvac",
      from_number: "+19845550123",
      to_number: "+19195550123",
      metadata: { app: "public-demo", requestId: "request-1", variant: "hvac" },
      retell_llm_dynamic_variables: {
        contact_name: "Alex Morgan",
        business_name: "Acme Property Group",
        service_type: "HVAC estimate",
        lead_source: "a previous heating and cooling inquiry"
      }
    });
  });

  it("allows requested demos during waking hours", () => {
    expect(isPublicDemoCallingWindow(new Date("2026-08-19T13:00:00.000Z"))).toBe(true);
    expect(isPublicDemoCallingWindow(new Date("2026-08-20T00:00:00.000Z"))).toBe(false);
  });
});
