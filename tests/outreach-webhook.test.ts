import { describe, expect, it, vi } from "vitest";
import { extractOutreachCallReport, processOutreachCallReport } from "@/lib/outreach-webhook";

function payload(overrides: Record<string, unknown> = {}) {
  return {
    event: "call_analyzed",
    call: {
      call_id: "call-1",
      to_number: "+19195550100",
      metadata: { app: "sales-outreach", prospectId: "prospect-1", attemptId: "attempt-1" },
      duration_ms: 61_000,
      transcript: "Short conversation",
      recording_url: "https://example.com/signed-recording",
      call_analysis: {
        call_summary: "Owner has no after-hours follow-up and asked Danny to call tomorrow.",
        custom_analysis_data: {
          outcome: "interested",
          potential_customer: "yes",
          contact_name: "Morgan",
          contact_role: "Owner",
          interest_reason: "Missed after-hours calls",
          opt_out: false,
        },
      },
      ...overrides,
    },
  };
}

describe("outreach Retell webhook", () => {
  it("ignores non-outreach calls", () => {
    expect(extractOutreachCallReport({ event: "call_analyzed", call: { metadata: { app: "public-demo" } } })).toBeNull();
  });

  it("extracts a qualified prospect", () => {
    expect(extractOutreachCallReport(payload())).toMatchObject({
      callId: "call-1",
      prospectId: "prospect-1",
      attemptId: "attempt-1",
      outcome: "interested",
      potentialCustomer: "yes",
      durationSeconds: 61,
    });
  });

  it("honors opt-out even when the analyzed outcome disagrees", () => {
    const report = extractOutreachCallReport(payload({
      call_analysis: { custom_analysis_data: { outcome: "interested", potential_customer: "yes", opt_out: true } },
    }));
    expect(report).toMatchObject({ outcome: "do_not_call", potentialCustomer: "no", optOut: true });
  });

  it.each([
    ["voicemail_reached", "voicemail"],
    ["dial_no_answer", "no_answer"],
    ["user_declined", "no_answer"],
    ["dial_busy", "busy"],
    ["invalid_destination", "wrong_number"],
    ["machine_detected", "failed"],
  ])("maps %s disconnects to %s when analysis is unavailable", (reason, outcome) => {
    const report = extractOutreachCallReport(payload({
      disconnection_reason: reason,
      call_analysis: {},
    }));
    expect(report).toMatchObject({ outcome, potentialCustomer: "no" });
  });

  it("falls back safely when Retell returns unknown analysis values", () => {
    const report = extractOutreachCallReport(payload({
      disconnection_reason: "dial_busy",
      call_analysis: {
        custom_analysis_data: {
          outcome: "unexpected_outcome",
          potential_customer: "probably",
          opt_out: false,
        },
      },
    }));
    expect(report).toMatchObject({ outcome: "busy", potentialCustomer: "no" });
  });

  it("bounds analyzed text and rejects non-HTTPS recording URLs", () => {
    const report = extractOutreachCallReport(payload({
      recording_url: "http://example.com/recording",
      call_analysis: {
        call_summary: "s".repeat(5_000),
        custom_analysis_data: {
          outcome: "interested",
          potential_customer: "yes",
          contact_name: "n".repeat(300),
          opt_out: false,
          unexpected: "not persisted",
        },
      },
    }));
    expect(report?.summary).toHaveLength(4_000);
    expect(report?.contactName).toHaveLength(160);
    expect(report?.recordingUrl).toBeNull();
    expect(report?.structuredData).not.toHaveProperty("unexpected");
  });

  it("ignores non-analyzed events and rejects incomplete analyzed events", async () => {
    const store = { completeAttempt: vi.fn().mockResolvedValue("2026-09-02T15:59:00.000Z"), updateProspect: vi.fn(), suppressPhone: vi.fn() };
    const started = extractOutreachCallReport({ ...payload(), event: "call_started" });
    if (!started) throw new Error("Expected outreach report");
    await expect(processOutreachCallReport(started, payload(), store)).resolves.toBe("ignored_outreach_event");

    const incomplete = extractOutreachCallReport(payload({
      call_id: null,
      metadata: { app: "sales-outreach", prospectId: "prospect-1" },
    }));
    if (!incomplete) throw new Error("Expected outreach report");
    await expect(processOutreachCallReport(incomplete, payload(), store)).resolves.toBe("invalid_outreach_event");
    expect(store.completeAttempt).not.toHaveBeenCalled();
    expect(store.updateProspect).not.toHaveBeenCalled();
  });

  it("logs the attempt and updates the prospect", async () => {
    const report = extractOutreachCallReport(payload());
    if (!report) throw new Error("Expected outreach report");
    const store = { completeAttempt: vi.fn().mockResolvedValue("2026-09-02T15:59:00.000Z"), updateProspect: vi.fn(), suppressPhone: vi.fn() };
    await expect(processOutreachCallReport(report, payload(), store, new Date("2026-09-02T16:00:00Z")))
      .resolves.toBe("outreach_call_processed");
    expect(store.completeAttempt).toHaveBeenCalledWith("attempt-1", "prospect-1", "call-1", expect.objectContaining({
      status: "completed",
      outcome: "interested",
      potential_customer: "yes",
    }));
    expect(store.updateProspect).toHaveBeenCalledWith("prospect-1", "2026-09-02T15:59:00.000Z", expect.objectContaining({
      stage: "replied",
      last_call_outcome: "interested",
      potential_customer: "yes",
      call_in_progress_at: null,
    }));
    const prospectValues = store.updateProspect.mock.calls[0]?.[2];
    expect(prospectValues).not.toHaveProperty("contact_name");
    expect(prospectValues).not.toHaveProperty("contact_role");
  });

  it("ignores a replayed or stale completion without mutating the prospect", async () => {
    const report = extractOutreachCallReport(payload());
    if (!report) throw new Error("Expected outreach report");
    const store = { completeAttempt: vi.fn().mockResolvedValue(null), updateProspect: vi.fn(), suppressPhone: vi.fn() };

    await expect(processOutreachCallReport(report, payload(), store)).resolves.toBe("stale_outreach_event");
    expect(store.updateProspect).not.toHaveBeenCalled();
  });

  it.each([
    ["follow_up", "maybe", "call_scheduled"],
    ["not_interested", "no", "not_interested"],
    ["wrong_number", "no", "not_interested"],
  ])("maps %s to qualification and pipeline stage", async (outcome, potentialCustomer, stage) => {
    const report = extractOutreachCallReport(payload({
      call_analysis: {
        custom_analysis_data: {
          outcome,
          potential_customer: potentialCustomer,
          opt_out: false,
        },
      },
    }));
    if (!report) throw new Error("Expected outreach report");
    const store = { completeAttempt: vi.fn().mockResolvedValue("2026-09-02T15:59:00.000Z"), updateProspect: vi.fn(), suppressPhone: vi.fn() };
    await processOutreachCallReport(report, payload(), store, new Date("2026-09-02T16:00:00Z"));
    expect(store.updateProspect).toHaveBeenCalledWith("prospect-1", "2026-09-02T15:59:00.000Z", expect.objectContaining({
      stage,
      potential_customer: potentialCustomer,
      call_in_progress_at: null,
    }));
  });

  it("marks failed calls as failed and opt-outs as do-not-call", async () => {
    const failed = extractOutreachCallReport(payload({
      call_analysis: { custom_analysis_data: { outcome: "failed", potential_customer: "no", opt_out: false } },
    }));
    const optedOut = extractOutreachCallReport(payload({
      call_analysis: { custom_analysis_data: { outcome: "do_not_call", potential_customer: "no", opt_out: true } },
    }));
    if (!failed || !optedOut) throw new Error("Expected outreach reports");
    const failedStore = { completeAttempt: vi.fn().mockResolvedValue("2026-09-02T15:59:00.000Z"), updateProspect: vi.fn(), suppressPhone: vi.fn() };
    await processOutreachCallReport(failed, payload(), failedStore, new Date("2026-09-02T16:00:00Z"));
    expect(failedStore.completeAttempt).toHaveBeenCalledWith("attempt-1", "prospect-1", "call-1", expect.objectContaining({
      status: "failed",
      error: "Retell could not complete the call.",
    }));

    const optOutStore = { completeAttempt: vi.fn().mockResolvedValue("2026-09-02T15:59:00.000Z"), updateProspect: vi.fn(), suppressPhone: vi.fn() };
    await processOutreachCallReport(optedOut, payload(), optOutStore, new Date("2026-09-02T16:00:00Z"));
    expect(optOutStore.updateProspect).toHaveBeenCalledWith("prospect-1", "2026-09-02T15:59:00.000Z", expect.objectContaining({
      stage: "not_interested",
      do_not_call_at: "2026-09-02T16:00:00.000Z",
      potential_customer: "no",
    }));
    expect(optOutStore.suppressPhone).toHaveBeenCalledWith("+19195550100", "prospect-1", "call-1");
  });
});
