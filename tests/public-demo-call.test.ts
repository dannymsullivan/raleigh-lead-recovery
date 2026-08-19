import { describe, expect, it } from "vitest";
import { buildPublicDemoCallRequest, isPublicDemoCallingWindow, parsePublicDemoCallInput } from "@/lib/public-demo-call";

describe("public Mabel demo calls", () => {
  it("validates and normalizes a consented request", () => {
    expect(parsePublicDemoCallInput({ name: "  Alex   Morgan ", businessName: " Acme Property Group ", phone: "(919) 555-0123", consent: true })).toEqual({
      name: "Alex Morgan",
      businessName: "Acme Property Group",
      phoneE164: "+19195550123",
      demoType: "general"
    });
  });

  it("requires consent and a valid North American number", () => {
    expect(() => parsePublicDemoCallInput({ name: "Alex", businessName: "Acme", phone: "919-555-0123", consent: false })).toThrow("consent_required");
    expect(() => parsePublicDemoCallInput({ name: "Alex", businessName: "Acme", phone: "+44 20 7946 0958", consent: true })).toThrow("phone_invalid");
  });

  it("injects the visitor's name and business into the live assistant", () => {
    const request = buildPublicDemoCallRequest(
      { name: "Alex Morgan", businessName: "Acme Property Group", phoneE164: "+19195550123", demoType: "general" },
      { assistantId: "assistant-live", phoneNumberId: "phone-live", requestId: "request-1" }
    );
    expect(request).toMatchObject({
      assistantId: "assistant-live",
      phoneNumberId: "phone-live",
      customer: { number: "+19195550123", name: "Alex Morgan" },
      metadata: { app: "public-demo", requestId: "request-1", variant: "general" },
      assistantOverrides: { variableValues: {
        contact_name: "Alex Morgan",
        business_name: "Acme Property Group",
        owner_name: "Acme Property Group team",
        service_type: "quote"
      } }
    });
  });

  it("adds HVAC-specific context to the vertical demo", () => {
    const request = buildPublicDemoCallRequest(
      { name: "Sam", businessName: "Triangle Comfort", phoneE164: "+19195550123", demoType: "hvac" },
      { assistantId: "assistant-hvac", phoneNumberId: "phone-live", requestId: "request-hvac" }
    );
    expect(request).toMatchObject({
      assistantId: "assistant-hvac",
      metadata: { variant: "hvac" },
      assistantOverrides: { variableValues: {
        business_name: "Triangle Comfort",
        service_type: "HVAC estimate",
        lead_source: "a previous heating and cooling inquiry"
      } }
    });
  });

  it("adds real-estate and home-services context to their demos", () => {
    const realEstate = buildPublicDemoCallRequest(
      { name: "Avery", businessName: "Triangle Property Group", phoneE164: "+19195550123", demoType: "real_estate" },
      { assistantId: "assistant-real-estate", phoneNumberId: "phone-live", requestId: "request-real-estate" }
    );
    const homeServices = buildPublicDemoCallRequest(
      { name: "Jordan", businessName: "Acme Home Services", phoneE164: "+19195550123", demoType: "home_services" },
      { assistantId: "assistant-home-services", phoneNumberId: "phone-live", requestId: "request-home-services" }
    );
    expect(realEstate.assistantOverrides.variableValues.service_type).toBe("real estate inquiry");
    expect(homeServices.assistantOverrides.variableValues.service_type).toBe("home service estimate");
  });

  it("adds roofing context to the roofing demo", () => {
    const request = buildPublicDemoCallRequest(
      { name: "Taylor", businessName: "Oak City Roofing", phoneE164: "+19195550123", demoType: "roofing" },
      { assistantId: "assistant-roofing", phoneNumberId: "phone-live", requestId: "request-roofing" }
    );
    expect(request.assistantOverrides.variableValues.service_type).toBe("roofing estimate");
    expect(request.assistantOverrides.variableValues.lead_source).toBe("a previous roofing inquiry");
  });

  it("adds plumbing and event context to their demos", () => {
    const plumbing = buildPublicDemoCallRequest(
      { name: "Morgan", businessName: "Oak City Plumbing", phoneE164: "+19195550123", demoType: "plumbing" },
      { assistantId: "assistant-plumbing", phoneNumberId: "phone-live", requestId: "request-plumbing" }
    );
    const events = buildPublicDemoCallRequest(
      { name: "Casey", businessName: "Triangle Event Co.", phoneE164: "+19195550123", demoType: "events" },
      { assistantId: "assistant-events", phoneNumberId: "phone-live", requestId: "request-events" }
    );
    expect(plumbing.assistantOverrides.variableValues.service_type).toBe("plumbing estimate");
    expect(events.assistantOverrides.variableValues.service_type).toBe("event service quote");
  });

  it("limits live demos to the published weekday calling window", () => {
    expect(isPublicDemoCallingWindow(new Date("2026-08-19T16:00:00.000Z"))).toBe(true);
    expect(isPublicDemoCallingWindow(new Date("2026-08-19T23:00:00.000Z"))).toBe(false);
    expect(isPublicDemoCallingWindow(new Date("2026-08-22T16:00:00.000Z"))).toBe(false);
  });
});
