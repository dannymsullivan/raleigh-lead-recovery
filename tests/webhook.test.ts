import { describe, expect, it, vi } from "vitest";
import { buildOwnerSms, processVapiWebhook } from "@/lib/webhook";
import type { Call, Client } from "@/lib/types";

const client: Client = {
  id: "client-1",
  business_name: "Oak City Plumbing",
  trade: "plumbing",
  owner_name: "Marcus",
  owner_phone: "+19195550123",
  owner_email: null,
  pilot_start: "2026-07-01",
  pilot_end: "2026-07-08",
  avg_job_value: 650,
  close_rate: 0.5,
  vapi_assistant_id: "asst_1",
  vapi_phone_number_id: "pn_1",
  created_at: "2026-07-01T00:00:00.000Z"
};

function payload(leadType = "new_job") {
  return {
    message: {
      type: "end-of-call-report",
      call: {
        id: "call_123",
        assistantId: "asst_1",
        customer: { number: "+19195554821" }
      },
      analysis: {
        summary: "Burst pipe in kitchen.",
        structuredData: {
          caller_name: "Tanya",
          callback_number: "+19195554821",
          service_address: "123 Oak Valley Dr",
          issue_description: "Burst pipe",
          urgency: "emergency",
          lead_type: leadType,
          estimated_job_value_band: "over_2000",
          requested_timing: "Now"
        }
      }
    }
  };
}

function callRecord(): Call {
  return {
    id: "call-1",
    client_id: client.id,
    vapi_call_id: "call_123",
    caller_number: "+19195554821",
    caller_name: "Tanya",
    callback_number: "+19195554821",
    service_address: "123 Oak Valley Dr",
    issue_description: "Burst pipe",
    urgency: "emergency",
    lead_type: "new_job",
    estimated_value_band: "over_2000",
    requested_timing: "Now",
    callback_promised_by: null,
    summary: "Burst pipe in kitchen.",
    transcript: null,
    recording_url: null,
    duration_seconds: null,
    raw_payload: {},
    sms_sent_at: null,
    created_at: "2026-07-08T12:00:00.000Z",
    updated_at: "2026-07-08T12:00:00.000Z"
  };
}

function store(overrides: Partial<Parameters<typeof processVapiWebhook>[1]["store"]> = {}) {
  return {
    findClientByVapiIds: vi.fn().mockResolvedValue(client),
    upsertCall: vi.fn().mockResolvedValue(callRecord()),
    claimSmsSend: vi.fn().mockResolvedValue(true),
    markSmsSent: vi.fn().mockResolvedValue(undefined),
    releaseSmsClaim: vi.fn().mockResolvedValue(undefined),
    ...overrides
  };
}

describe("processVapiWebhook", () => {
  it("ignores non-report events after authentication", async () => {
    const fakeStore = store();
    const result = await processVapiWebhook({ message: { type: "status-update" } }, {
      store: fakeStore,
      sendOwnerSms: vi.fn()
    });

    expect(result).toEqual({ status: "ignored", reason: "non_report_event" });
    expect(fakeStore.upsertCall).not.toHaveBeenCalled();
  });

  it("stores unmatched clients as a 200-class no-op", async () => {
    const fakeStore = store({ findClientByVapiIds: vi.fn().mockResolvedValue(null) });
    const result = await processVapiWebhook(payload(), {
      store: fakeStore,
      sendOwnerSms: vi.fn(),
      logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() }
    });

    expect(result.status).toBe("unmatched_client");
    expect(fakeStore.upsertCall).not.toHaveBeenCalled();
  });

  it("sends owner SMS once when the claim succeeds", async () => {
    const fakeStore = store();
    const sendOwnerSms = vi.fn().mockResolvedValue(undefined);
    const result = await processVapiWebhook(payload(), {
      store: fakeStore,
      sendOwnerSms
    });

    expect(result).toMatchObject({ status: "processed", sms: "sent" });
    expect(sendOwnerSms).toHaveBeenCalledTimes(1);
    expect(fakeStore.markSmsSent).toHaveBeenCalledWith("call_123", expect.any(Date));
  });

  it("does not send duplicate owner SMS when another webhook already claimed it", async () => {
    const fakeStore = store({ claimSmsSend: vi.fn().mockResolvedValue(false) });
    const sendOwnerSms = vi.fn();
    const result = await processVapiWebhook(payload(), {
      store: fakeStore,
      sendOwnerSms
    });

    expect(result).toMatchObject({ status: "processed", sms: "already_claimed" });
    expect(sendOwnerSms).not.toHaveBeenCalled();
  });

  it("skips SMS for spam leads", async () => {
    const fakeStore = store();
    const sendOwnerSms = vi.fn();
    const result = await processVapiWebhook(payload("spam"), {
      store: fakeStore,
      sendOwnerSms
    });

    expect(result).toMatchObject({ status: "processed", sms: "skipped" });
    expect(fakeStore.claimSmsSend).not.toHaveBeenCalled();
    expect(sendOwnerSms).not.toHaveBeenCalled();
  });

  it("releases the SMS claim when Twilio fails", async () => {
    const fakeStore = store();
    const sendOwnerSms = vi.fn().mockRejectedValue(new Error("Twilio down"));
    const result = await processVapiWebhook(payload(), {
      store: fakeStore,
      sendOwnerSms,
      logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() }
    });

    expect(result).toMatchObject({ status: "processed", sms: "failed" });
    expect(fakeStore.releaseSmsClaim).toHaveBeenCalledWith("call_123", "Twilio down");
  });
});

describe("buildOwnerSms", () => {
  it("uses the required owner alert format", () => {
    expect(buildOwnerSms({
      eventType: "end-of-call-report",
      vapiCallId: "call_123",
      assistantId: "asst_1",
      phoneNumberId: null,
      callerNumber: "+19195554821",
      callerName: "Tanya",
      callbackNumber: "+19195554821",
      serviceAddress: "123 Oak Valley Dr",
      issueDescription: "Burst pipe",
      urgency: "emergency",
      leadType: "new_job",
      estimatedValueBand: "over_2000",
      requestedTiming: "Now",
      callbackPromisedBy: null,
      summary: null,
      transcript: null,
      recordingUrl: null,
      durationSeconds: null
    })).toContain("CAUGHT MISSED CALL (emergency): Tanya - Burst pipe. Call: +19195554821.");
  });
});
