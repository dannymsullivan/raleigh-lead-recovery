import { describe, expect, it } from "vitest";
import { buildInterestedLeadSms, extractReactivationReport } from "@/lib/reactivation-webhook";

describe("reactivation Vapi reports", () => {
  it("extracts trusted campaign metadata and interested outcomes", () => {
    const report = extractReactivationReport({ message: { type: "end-of-call-report", call: { id: "call_1", metadata: { app: "lead-reactivation", clientId: "client_1", campaignId: "campaign_1", contactId: "contact_1" } }, analysis: { summary: "Ready for an inspection.", structuredData: { outcome: "interested_now", project_type: "replacement", requested_timing: "Tomorrow afternoon", next_step: "owner_callback", opt_out: false } }, transcript: "Mabel: Hi" } });
    expect(report).toMatchObject({ callId: "call_1", clientId: "client_1", outcome: "interested_now", requestedTiming: "Tomorrow afternoon" });
  });

  it("ignores reports not created by the reactivation caller", () => {
    expect(extractReactivationReport({ message: { call: { metadata: { app: "other" } } } })).toBeNull();
  });

  it("builds an immediate owner handoff alert", () => {
    expect(buildInterestedLeadSms("Oak City Roofing", "Sarah", "+19195550123", "Tomorrow", "https://example.com/dashboard")).toContain("INTERESTED LEAD for Oak City Roofing: Sarah");
  });
});
