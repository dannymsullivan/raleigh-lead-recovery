import { describe, expect, it } from "vitest";
import { buildInterestedLeadSms, extractReactivationReport } from "@/lib/reactivation-webhook";

describe("reactivation Retell reports", () => {
  it("extracts trusted campaign metadata and interested outcomes", () => {
    const report = extractReactivationReport({ event: "call_analyzed", call: { call_id: "call_1", metadata: { app: "lead-reactivation", clientId: "client_1", campaignId: "campaign_1", contactId: "contact_1" }, call_analysis: { call_summary: "Ready for an inspection.", custom_analysis_data: { outcome: "interested_now", project_type: "replacement", requested_timing: "Tomorrow afternoon", next_step: "owner_callback", opt_out: false } }, transcript: "Assistant: Hi" } });
    expect(report).toMatchObject({ callId: "call_1", clientId: "client_1", outcome: "interested_now", requestedTiming: "Tomorrow afternoon" });
  });

  it("ignores reports not created by the reactivation caller", () => {
    expect(extractReactivationReport({ call: { metadata: { app: "other" } } })).toBeNull();
  });

  it("builds an immediate owner handoff alert", () => {
    const message = buildInterestedLeadSms("Oak City Roofing", "Sarah", "+19195550123", "Tomorrow", "https://example.com/dashboard");
    expect(message).toContain("Raleigh Lead Recovery alert for Oak City Roofing: Sarah");
    expect(message).toContain("Reply STOP to unsubscribe; HELP for help.");
  });
});
