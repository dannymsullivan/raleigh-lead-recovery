import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const dependencies = vi.hoisted(() => ({
  verifyRetellWebhook: vi.fn(),
  getSupabaseAdmin: vi.fn(),
  extractReactivationReport: vi.fn(),
  processReactivationReport: vi.fn(),
  extractPublicDemoCallEvent: vi.fn(),
  processPublicDemoCallEvent: vi.fn(),
  processRetellWebhook: vi.fn(),
}));

vi.mock("@/lib/retell", () => ({
  verifyRetellWebhook: dependencies.verifyRetellWebhook,
  sendRetellSms: vi.fn(),
}));
vi.mock("@/lib/supabase-server", () => ({
  getSupabaseAdmin: dependencies.getSupabaseAdmin,
  claimSmsSend: vi.fn(),
  findClientByRetellIds: vi.fn(),
  markSmsSent: vi.fn(),
  releaseSmsClaim: vi.fn(),
  upsertCall: vi.fn(),
}));
vi.mock("@/lib/reactivation-webhook", () => ({
  extractReactivationReport: dependencies.extractReactivationReport,
}));
vi.mock("@/lib/reactivation-handler", () => ({
  processReactivationReport: dependencies.processReactivationReport,
}));
vi.mock("@/lib/public-demo-webhook", () => ({
  extractPublicDemoCallEvent: dependencies.extractPublicDemoCallEvent,
  processPublicDemoCallEvent: dependencies.processPublicDemoCallEvent,
}));
vi.mock("@/lib/webhook", () => ({ processRetellWebhook: dependencies.processRetellWebhook }));

import { POST } from "@/app/api/webhooks/retell/route";

function outreachPayload() {
  return {
    event: "call_analyzed",
    call: {
      call_id: "call-1",
      metadata: { app: "sales-outreach", prospectId: "prospect-1", attemptId: "attempt-1" },
      duration_ms: 45_000,
      transcript: "Owner asked for a follow-up.",
      call_analysis: {
        call_summary: "Interested owner asked Danny to call tomorrow.",
        custom_analysis_data: {
          outcome: "interested",
          potential_customer: "yes",
          contact_name: "Morgan",
          contact_role: "Owner",
          opt_out: false,
        },
      },
    },
  };
}

function request(body: string, signature: string | null = "valid-signature") {
  const headers = signature ? { "x-retell-signature": signature } : undefined;
  return new NextRequest("https://example.com/api/webhooks/retell", {
    method: "POST",
    headers,
    body,
  });
}

function fakeAdmin(failingTable?: string) {
  const updates: Array<{ table: string; values: Record<string, unknown>; field: string; id: string }> = [];
  const from = vi.fn((table: string) => {
    let operation: "select" | "update" = "select";
    let values: Record<string, unknown> = {};
    const filters: Array<{ field: string; id: string }> = [];
    const builder = {
      select: vi.fn(() => builder),
      update: vi.fn((next: Record<string, unknown>) => {
        operation = "update";
        values = next;
        return builder;
      }),
      eq: vi.fn((field: string, id: string) => {
        filters.push({ field, id });
        return builder;
      }),
      is: vi.fn(() => builder),
      in: vi.fn(() => builder),
      maybeSingle: vi.fn(async () => {
        if (operation === "select" && table === "outreach_call_attempts") {
          return {
            data: {
              prospect_id: "prospect-1",
              retell_call_id: "call-1",
              status: "in_progress",
              eligibility_attested_at: "2026-09-02T15:59:00.000Z",
            },
            error: null,
          };
        }
        const idFilter = filters.find((filter) => filter.field === "id") ?? { field: "id", id: "" };
        updates.push({ table, values, ...idFilter });
        return {
          data: table === "outreach_call_attempts"
            ? { eligibility_attested_at: "2026-09-02T15:59:00.000Z" }
            : { id: "prospect-1" },
          error: table === failingTable ? new Error(`${table} update failed`) : null,
        };
      }),
    };
    return builder;
  });
  return { admin: { from }, updates };
}

describe("Retell outreach webhook route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dependencies.verifyRetellWebhook.mockResolvedValue(true);
    dependencies.extractReactivationReport.mockReturnValue(null);
    dependencies.extractPublicDemoCallEvent.mockReturnValue(null);
  });

  it("rejects a missing or invalid Retell signature before parsing or persistence", async () => {
    dependencies.verifyRetellWebhook.mockResolvedValue(false);

    const response = await POST(request(JSON.stringify(outreachPayload()), null));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ ok: false, error: "unauthorized" });
    expect(dependencies.getSupabaseAdmin).not.toHaveBeenCalled();
  });

  it("returns a configuration error when signature verification throws", async () => {
    dependencies.verifyRetellWebhook.mockRejectedValue(new Error("Missing RETELL_API_KEY"));

    const response = await POST(request(JSON.stringify(outreachPayload())));

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({ ok: false, error: "webhook_not_configured" });
  });

  it("rejects malformed signed JSON without touching the database", async () => {
    const response = await POST(request("{not-json"));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ ok: false, error: "invalid_json" });
    expect(dependencies.getSupabaseAdmin).not.toHaveBeenCalled();
  });

  it("routes a signed outreach report into both persistence adapters", async () => {
    const { admin, updates } = fakeAdmin();
    dependencies.getSupabaseAdmin.mockReturnValue(admin);
    const payload = outreachPayload();

    const response = await POST(request(JSON.stringify(payload)));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true, result: "outreach_call_processed" });
    expect(updates).toEqual(expect.arrayContaining([
      expect.objectContaining({
        table: "outreach_call_attempts",
        field: "id",
        id: "attempt-1",
        values: expect.objectContaining({ status: "completed", outcome: "interested", raw_payload: payload }),
      }),
      expect.objectContaining({
        table: "outreach_prospects",
        field: "id",
        id: "prospect-1",
        values: expect.objectContaining({ stage: "replied", potential_customer: "yes", call_in_progress_at: null }),
      }),
    ]));
    expect(dependencies.extractReactivationReport).not.toHaveBeenCalled();
    expect(dependencies.extractPublicDemoCallEvent).not.toHaveBeenCalled();
    expect(dependencies.processRetellWebhook).not.toHaveBeenCalled();
  });

  it("surfaces attempt persistence failures and stops before prospect mutation", async () => {
    const { admin, updates } = fakeAdmin("outreach_call_attempts");
    dependencies.getSupabaseAdmin.mockReturnValue(admin);

    await expect(POST(request(JSON.stringify(outreachPayload())))).rejects.toThrow(
      "outreach_call_attempts update failed",
    );
    expect(updates).toHaveLength(1);
    expect(updates[0]).toMatchObject({ table: "outreach_call_attempts", id: "attempt-1" });
  });
});
