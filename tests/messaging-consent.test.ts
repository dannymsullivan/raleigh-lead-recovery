import { describe, expect, it } from "vitest";
import { buildLeadAlertSms, buildVerificationSms, hasAlertSmsConsent } from "@/lib/messaging-consent";

describe("messaging compliance helpers", () => {
  it("identifies the sender and includes opt-out and help instructions", () => {
    expect(buildVerificationSms("123456")).toContain("Snappy Leads");
    expect(buildVerificationSms("123456")).toContain("Reply STOP to unsubscribe; HELP for help.");
    expect(buildLeadAlertSms({ businessName: "Oak City Roofing", contactName: "Sarah", phone: "+19195550123", requestedTiming: null, dashboardUrl: "https://example.com/dashboard" })).toContain("Reply STOP to unsubscribe; HELP for help.");
  });

  it("permits alerts only when consent matches the current destination", () => {
    expect(hasAlertSmsConsent({ owner_phone: "+19195550123", alert_phone: "+19195550123", alert_sms_consent_at: "2026-08-18T12:00:00Z", alert_sms_consent_phone: "+19195550123" })).toBe(true);
    expect(hasAlertSmsConsent({ owner_phone: "+19195550123", alert_phone: "+19845550123", alert_sms_consent_at: "2026-08-18T12:00:00Z", alert_sms_consent_phone: "+19195550123" })).toBe(false);
    expect(hasAlertSmsConsent({ owner_phone: "+19195550123", alert_phone: "+19195550123", alert_sms_consent_at: null, alert_sms_consent_phone: "+19195550123" })).toBe(false);
  });
});
