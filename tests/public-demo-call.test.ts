import { describe, expect, it } from "vitest";
import { buildPublicDemoCallRequest, isPublicDemoCallingWindow, parsePublicDemoCallInput } from "@/lib/public-demo-call";

describe("public Mabel demo calls", () => {
  it("validates and normalizes a consented request", () => {
    expect(parsePublicDemoCallInput({ name: "  Alex   Morgan ", businessName: " Acme Property Group ", phone: "(919) 555-0123", consent: true })).toEqual({
      name: "Alex Morgan",
      businessName: "Acme Property Group",
      phoneE164: "+19195550123"
    });
  });

  it("requires consent and a valid North American number", () => {
    expect(() => parsePublicDemoCallInput({ name: "Alex", businessName: "Acme", phone: "919-555-0123", consent: false })).toThrow("consent_required");
    expect(() => parsePublicDemoCallInput({ name: "Alex", businessName: "Acme", phone: "+44 20 7946 0958", consent: true })).toThrow("phone_invalid");
  });

  it("injects the visitor's name and business into the live assistant", () => {
    const request = buildPublicDemoCallRequest(
      { name: "Alex Morgan", businessName: "Acme Property Group", phoneE164: "+19195550123" },
      { assistantId: "assistant-live", phoneNumberId: "phone-live", requestId: "request-1" }
    );
    expect(request).toMatchObject({
      assistantId: "assistant-live",
      phoneNumberId: "phone-live",
      customer: { number: "+19195550123", name: "Alex Morgan" },
      metadata: { app: "public-demo", requestId: "request-1" },
      assistantOverrides: { variableValues: {
        contact_name: "Alex Morgan",
        business_name: "Acme Property Group",
        owner_name: "Acme Property Group team",
        service_type: "quote"
      } }
    });
  });

  it("limits live demos to the published weekday calling window", () => {
    expect(isPublicDemoCallingWindow(new Date("2026-08-19T16:00:00.000Z"))).toBe(true);
    expect(isPublicDemoCallingWindow(new Date("2026-08-19T23:00:00.000Z"))).toBe(false);
    expect(isPublicDemoCallingWindow(new Date("2026-08-22T16:00:00.000Z"))).toBe(false);
  });
});
