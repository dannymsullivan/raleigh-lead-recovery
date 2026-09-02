import { beforeEach, describe, expect, it, vi } from "vitest";
import type { OutreachProspect } from "@/lib/outreach";

const dependencies = vi.hoisted(() => ({
  getRetellClient: vi.fn(),
  getSupabaseAdmin: vi.fn(),
}));

vi.mock("@/lib/retell", () => ({ getRetellClient: dependencies.getRetellClient }));
vi.mock("@/lib/supabase-server", () => ({ getSupabaseAdmin: dependencies.getSupabaseAdmin }));

import { outreachCallingConfigured, queueOutreachProspectCall } from "@/lib/outreach-retell";

const prospect: OutreachProspect = {
  id: "prospect-1",
  company_name: "Cool Breeze HVAC",
  website: "coolbreeze.example",
  city: "Raleigh",
  contact_name: "Morgan",
  contact_role: "Owner",
  email: null,
  phone: "(919) 555-0100",
  last_call_outcome: null,
  last_retell_call_id: null,
  potential_customer: null,
  last_call_summary: null,
  call_in_progress_at: null,
  do_not_call_at: null,
  automated_call_attempt_count: 2,
  stage: "not_contacted",
  last_contacted_on: null,
  next_follow_up_on: null,
  notes: null,
  created_at: "2026-09-02T00:00:00Z",
  updated_at: "2026-09-02T00:00:00Z",
};

type AdminOptions = {
  prospect?: OutreachProspect | null;
  prospectError?: Error | null;
  attemptError?: Error | null;
  claimError?: Error | null;
  claimed?: boolean;
  bookkeepingErrorTable?: string;
  suppressed?: boolean;
};

function fakeAdmin(options: AdminOptions = {}) {
  const updates: Array<{ table: string; values: Record<string, unknown> }> = [];
  const from = vi.fn((table: string) => {
    let operation: "select" | "insert" | "update" = "select";
    let values: Record<string, unknown> = {};
    let isClaim = false;
    const builder = {
      select: vi.fn(() => builder),
      insert: vi.fn((next: Record<string, unknown>) => {
        operation = "insert";
        values = next;
        return builder;
      }),
      update: vi.fn((next: Record<string, unknown>) => {
        operation = "update";
        values = next;
        updates.push({ table, values: next });
        return builder;
      }),
      eq: vi.fn(() => builder),
      is: vi.fn(() => {
        isClaim = true;
        return builder;
      }),
      or: vi.fn(() => builder),
      single: vi.fn(async () => {
        if (table === "outreach_call_attempts" && operation === "insert") {
          return { data: options.attemptError ? null : { id: "attempt-1" }, error: options.attemptError ?? null };
        }
        return { data: null, error: null };
      }),
      maybeSingle: vi.fn(async () => {
        if (table === "outreach_suppression_entries" && operation === "select") {
          return { data: options.suppressed ? { phone_e164: "+19195550100" } : null, error: null };
        }
        if (table === "outreach_prospects" && operation === "select") {
          return { data: options.prospect === undefined ? prospect : options.prospect, error: options.prospectError ?? null };
        }
        if (table === "outreach_prospects" && operation === "update" && isClaim) {
          return {
            data: options.claimed === false || options.claimError ? null : { id: prospect.id },
            error: options.claimError ?? null,
          };
        }
        return { data: null, error: null };
      }),
      then<TResult1 = { data: null; error: null }, TResult2 = never>(
        onfulfilled?: ((value: { data: null; error: Error | null }) => TResult1 | PromiseLike<TResult1>) | null,
        onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
      ) {
        return Promise.resolve({
          data: null,
          error: table === options.bookkeepingErrorTable ? new Error(`${table} bookkeeping failed`) : null,
        }).then(onfulfilled, onrejected);
      },
    };
    void values;
    return builder;
  });
  return { admin: { from }, updates };
}

const allowedTime = new Date("2026-09-02T14:00:00Z");

describe("outreach Retell orchestration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("RETELL_API_KEY", "test-key");
    vi.stubEnv("RETELL_OUTREACH_AGENT_ID", "agent-sales");
    vi.stubEnv("RETELL_OUTREACH_PHONE_NUMBER", "+19195550199");
  });

  it("reports whether all calling identifiers are configured", () => {
    expect(outreachCallingConfigured()).toBe(true);
    vi.stubEnv("RETELL_OUTREACH_AGENT_ID", "");
    expect(outreachCallingConfigured()).toBe(false);
  });

  it("rejects calls without attestation or outside the calling window before database access", async () => {
    await expect(queueOutreachProspectCall("prospect-1", false, allowedTime)).rejects.toThrow("Confirm call eligibility");
    await expect(queueOutreachProspectCall("prospect-1", true, new Date("2026-09-05T14:00:00Z"))).rejects.toThrow("weekdays");
    expect(dependencies.getSupabaseAdmin).not.toHaveBeenCalled();
  });

  it.each([
    ["missing prospect", null, "Prospect not found"],
    ["do-not-call timestamp", { ...prospect, do_not_call_at: "2026-09-01T00:00:00Z" }, "do-not-call list"],
    ["do-not-call outcome", { ...prospect, last_call_outcome: "do_not_call" as const }, "do-not-call list"],
    ["active call", { ...prospect, call_in_progress_at: "2026-09-02T13:59:00Z" }, "already in progress"],
  ])("rejects a prospect with %s", async (_label, storedProspect, message) => {
    const { admin } = fakeAdmin({ prospect: storedProspect });
    dependencies.getSupabaseAdmin.mockReturnValue(admin);
    await expect(queueOutreachProspectCall("prospect-1", true, allowedTime)).rejects.toThrow(message);
  });

  it("rejects a duplicate prospect row when its phone number was suppressed", async () => {
    const { admin } = fakeAdmin({ suppressed: true });
    dependencies.getSupabaseAdmin.mockReturnValue(admin);

    await expect(queueOutreachProspectCall("prospect-1", true, allowedTime)).rejects.toThrow("phone number is on the do-not-call list");
    expect(dependencies.getRetellClient).not.toHaveBeenCalled();
  });

  it("propagates prospect lookup and attempt creation failures", async () => {
    const lookup = fakeAdmin({ prospectError: new Error("database unavailable") });
    dependencies.getSupabaseAdmin.mockReturnValueOnce(lookup.admin);
    await expect(queueOutreachProspectCall("prospect-1", true, allowedTime)).rejects.toThrow("database unavailable");

    const attempt = fakeAdmin({ attemptError: new Error("attempt insert failed") });
    dependencies.getSupabaseAdmin.mockReturnValueOnce(attempt.admin);
    await expect(queueOutreachProspectCall("prospect-1", true, allowedTime)).rejects.toThrow("attempt insert failed");
  });

  it("marks the attempt failed when another caller wins the atomic claim", async () => {
    const { admin, updates } = fakeAdmin({ claimed: false });
    dependencies.getSupabaseAdmin.mockReturnValue(admin);
    await expect(queueOutreachProspectCall("prospect-1", true, allowedTime)).rejects.toThrow("already in progress");
    expect(updates).toContainEqual({
      table: "outreach_call_attempts",
      values: { status: "failed", error: "Prospect was no longer eligible or was already being called." },
    });
  });

  it("claims the prospect, starts Retell, and records the call identifiers", async () => {
    const { admin, updates } = fakeAdmin();
    dependencies.getSupabaseAdmin.mockReturnValue(admin);
    const createPhoneCall = vi.fn().mockResolvedValue({ call_id: "call-1" });
    dependencies.getRetellClient.mockReturnValue({ call: { createPhoneCall } });

    await expect(queueOutreachProspectCall("prospect-1", true, allowedTime)).resolves.toEqual({
      callId: "call-1",
      attemptId: "attempt-1",
    });
    expect(createPhoneCall).toHaveBeenCalledWith(expect.objectContaining({
      override_agent_id: "agent-sales",
      to_number: "+19195550100",
      metadata: { app: "sales-outreach", prospectId: "prospect-1", attemptId: "attempt-1" },
    }));
    expect(updates).toEqual(expect.arrayContaining([
      { table: "outreach_prospects", values: { call_in_progress_at: allowedTime.toISOString(), automated_call_attempt_count: 3 } },
      { table: "outreach_call_attempts", values: { retell_call_id: "call-1", status: "in_progress" } },
      { table: "outreach_prospects", values: { last_retell_call_id: "call-1" } },
    ]));
  });

  it("recovers an expired call lease before starting a new attempt", async () => {
    const { admin } = fakeAdmin({
      prospect: { ...prospect, call_in_progress_at: "2026-09-02T13:30:00.000Z" },
    });
    dependencies.getSupabaseAdmin.mockReturnValue(admin);
    dependencies.getRetellClient.mockReturnValue({
      call: { createPhoneCall: vi.fn().mockResolvedValue({ call_id: "call-2" }) },
    });

    await expect(queueOutreachProspectCall("prospect-1", true, allowedTime)).resolves.toMatchObject({ callId: "call-2" });
  });

  it("keeps the call lease when Retell accepts but bookkeeping fails", async () => {
    const { admin, updates } = fakeAdmin({ bookkeepingErrorTable: "outreach_call_attempts" });
    dependencies.getSupabaseAdmin.mockReturnValue(admin);
    dependencies.getRetellClient.mockReturnValue({
      call: { createPhoneCall: vi.fn().mockResolvedValue({ call_id: "call-1" }) },
    });
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

    await expect(queueOutreachProspectCall("prospect-1", true, allowedTime)).resolves.toMatchObject({ callId: "call-1" });
    expect(updates).not.toContainEqual({ table: "outreach_prospects", values: { call_in_progress_at: null } });
    expect(consoleError).toHaveBeenCalledWith(
      "[outreach] call started but attempt bookkeeping failed",
      expect.any(Error),
    );
  });

  it("records a Retell failure and releases the in-progress prospect", async () => {
    const { admin, updates } = fakeAdmin();
    dependencies.getSupabaseAdmin.mockReturnValue(admin);
    dependencies.getRetellClient.mockReturnValue({
      call: { createPhoneCall: vi.fn().mockRejectedValue(new Error("Retell unavailable")) },
    });

    await expect(queueOutreachProspectCall("prospect-1", true, allowedTime)).rejects.toThrow("Retell unavailable");
    expect(updates).toEqual(expect.arrayContaining([
      { table: "outreach_call_attempts", values: { status: "failed", error: "Retell unavailable" } },
      { table: "outreach_prospects", values: { call_in_progress_at: null } },
    ]));
  });
});
