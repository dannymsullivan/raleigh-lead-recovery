import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { getAdmin, rpc } = vi.hoisted(() => ({ getAdmin: vi.fn(), rpc: vi.fn() }));
vi.mock("@/lib/supabase-server", () => ({ getSupabaseAdmin: getAdmin }));
import { POST } from "@/app/api/trial-request/route";

const valid = { name: "Test Owner", business: "Example Services", email: "owner@example.com", website: "example.com?private=discard", needs: "Capture website inquiries", consent: true, submissionId: "12345678-1234-4234-8234-123456789abc" };
const request = (body: unknown, origin = "https://example.com") => new NextRequest("https://example.com/api/trial-request", { method: "POST", headers: { origin, "Content-Type": "application/json", "x-forwarded-for": "192.0.2.1" }, body: JSON.stringify(body) });

describe("website trial requests", () => {
  beforeEach(() => { vi.stubEnv("TRIAL_REQUEST_SECRET", "test-only-secret"); getAdmin.mockReset(); rpc.mockReset().mockResolvedValue({ error: null }); getAdmin.mockReturnValue({ rpc }); });
  it("requires same-origin submission and explicit follow-up consent", async () => {
    expect((await POST(request(valid, "https://other.example"))).status).toBe(403);
    expect((await POST(request({ ...valid, consent: false }))).status).toBe(400);
    expect(getAdmin).not.toHaveBeenCalled();
  });
  it("rejects malformed requests and unsafe websites before storage", async () => {
    for (const change of [{ email: "invalid" }, { website: "javascript://example.com" }, { needs: "x".repeat(2001) }, { submissionId: "invalid" }, { fax: "spam" }]) {
      expect((await POST(request({ ...valid, ...change }))).status).toBe(400);
    }
    expect(getAdmin).not.toHaveBeenCalled();
  });
  it("saves to the existing prospect workflow with an idempotency key and hashed IP", async () => {
    const response = await POST(request(valid));
    expect(response.status).toBe(200);
    expect(rpc).toHaveBeenCalledWith("submit_website_trial_request", expect.objectContaining({ p_submission_id: valid.submissionId, p_name: "Test Owner", p_business: "Example Services", p_website: "https://example.com/", p_ip_hash: expect.stringMatching(/^[a-f0-9]{64}$/) }));
    expect(JSON.stringify(rpc.mock.calls)).not.toContain("192.0.2.1");
  });
  it("does not claim success if persistence fails and keeps infrastructure details private", async () => {
    rpc.mockResolvedValue({ error: { message: "private database failure" } });
    const response = await POST(request(valid));
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain("private database");
  });
  it("surfaces the database's atomic abuse limit", async () => {
    rpc.mockResolvedValue({ error: { message: "rate_limit" } });
    expect((await POST(request(valid))).status).toBe(429);
  });
});
