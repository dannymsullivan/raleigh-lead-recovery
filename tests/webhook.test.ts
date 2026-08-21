import { describe, expect, it, vi } from "vitest";
import { buildOwnerSms, processRetellWebhook } from "@/lib/webhook";
import type { Call, Client, ExtractedRetellCall } from "@/lib/types";

const client: Client = {
  id: "client-1", business_name: "Oak City Plumbing", trade: "plumbing", owner_name: "Marcus", owner_phone: "+19195550123", owner_email: null,
  alert_sms_consent_at: "2026-07-01T00:00:00.000Z", alert_sms_consent_phone: "+19195550123", pilot_start: "2026-07-01", pilot_end: "2026-07-08",
  avg_job_value: 650, close_rate: 0.5, created_at: "2026-07-01T00:00:00.000Z"
};

function payload(leadType = "new_job") {
  return {
    event: "call_analyzed",
    call: {
      call_id: "call_123", agent_id: "agent_1", direction: "inbound", from_number: "+19195554821", to_number: "+19845550123", duration_ms: 90_000,
      call_analysis: { call_summary: "Burst pipe in kitchen.", custom_analysis_data: { caller_name: "Tanya", callback_number: "+19195554821", service_address: "123 Oak Valley Dr", issue_description: "Burst pipe", urgency: "emergency", lead_type: leadType, estimated_job_value_band: "over_2000", requested_timing: "Now" } }
    }
  };
}

function callRecord(): Call {
  return {
    id: "call-1", client_id: client.id, retell_call_id: "call_123", caller_number: "+19195554821", caller_name: "Tanya", callback_number: "+19195554821",
    service_address: "123 Oak Valley Dr", issue_description: "Burst pipe", urgency: "emergency", lead_type: "new_job", estimated_value_band: "over_2000",
    requested_timing: "Now", callback_promised_by: null, summary: "Burst pipe in kitchen.", transcript: null, recording_url: null, duration_seconds: 90,
    raw_payload: {}, sms_sent_at: null, created_at: "2026-07-08T12:00:00.000Z", updated_at: "2026-07-08T12:00:00.000Z"
  };
}

function store(overrides: Partial<Parameters<typeof processRetellWebhook>[1]["store"]> = {}) {
  return {
    findClientByRetellIds: vi.fn().mockResolvedValue(client), upsertCall: vi.fn().mockResolvedValue(callRecord()), claimSmsSend: vi.fn().mockResolvedValue(true),
    markSmsSent: vi.fn().mockResolvedValue(undefined), releaseSmsClaim: vi.fn().mockResolvedValue(undefined), ...overrides
  };
}

describe("processRetellWebhook", () => {
  it("ignores non-analyzed events", async () => {
    const fakeStore = store();
    expect(await processRetellWebhook({ event: "call_started" }, { store: fakeStore, sendOwnerSms: vi.fn() })).toEqual({ status: "ignored", reason: "non_report_event" });
    expect(fakeStore.upsertCall).not.toHaveBeenCalled();
  });

  it("stores a matched call and sends one owner alert", async () => {
    const fakeStore = store();
    const sendOwnerSms = vi.fn().mockResolvedValue(undefined);
    expect(await processRetellWebhook(payload(), { store: fakeStore, sendOwnerSms })).toMatchObject({ status: "processed", sms: "sent" });
    expect(sendOwnerSms).toHaveBeenCalledTimes(1);
    expect(fakeStore.markSmsSent).toHaveBeenCalledWith("call_123", expect.any(Date));
  });

  it("does not alert for spam or without consent", async () => {
    const noConsent = store({ findClientByRetellIds: vi.fn().mockResolvedValue({ ...client, alert_sms_consent_at: null }) });
    expect(await processRetellWebhook(payload("spam"), { store: store(), sendOwnerSms: vi.fn() })).toMatchObject({ sms: "skipped" });
    expect(await processRetellWebhook(payload(), { store: noConsent, sendOwnerSms: vi.fn() })).toMatchObject({ sms: "skipped" });
  });

  it("releases the claim when Retell messaging fails", async () => {
    const fakeStore = store();
    expect(await processRetellWebhook(payload(), { store: fakeStore, sendOwnerSms: vi.fn().mockRejectedValue(new Error("Retell messaging down")), logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() } })).toMatchObject({ sms: "failed" });
    expect(fakeStore.releaseSmsClaim).toHaveBeenCalledWith("call_123", "Retell messaging down");
  });
});

describe("buildOwnerSms", () => {
  it("builds a concise handoff", () => {
    const call: ExtractedRetellCall = { eventType: "call_analyzed", retellCallId: "call_123", agentId: "agent_1", phoneNumber: "+19845550123", callerNumber: "+19195554821", callerName: "Tanya", callbackNumber: "+19195554821", serviceAddress: "123 Oak Valley Dr", issueDescription: "Burst pipe", urgency: "emergency", leadType: "new_job", estimatedValueBand: "over_2000", requestedTiming: "Now", callbackPromisedBy: null, summary: null, transcript: null, recordingUrl: null, durationSeconds: 90 };
    expect(buildOwnerSms(call)).toContain("CAUGHT MISSED CALL (emergency): Tanya - Burst pipe");
  });
});
