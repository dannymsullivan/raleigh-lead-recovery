import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { createWebCall, rpc, update, eq } = vi.hoisted(() => ({ createWebCall: vi.fn(), rpc: vi.fn(), update: vi.fn(), eq: vi.fn() }));
vi.mock("@/lib/retell", () => ({ getRetellClient: () => ({ call: { createWebCall } }) }));
vi.mock("@/lib/supabase-server", () => ({ getSupabaseAdmin: () => ({ rpc, from: () => ({ update }) }) }));
vi.mock("@/lib/admin", () => ({ adminCookie: { name: "admin" }, verifyAdminSessionToken: () => false }));
import { POST } from "@/app/api/web-call/route";

const request = () => new NextRequest("https://example.com/api/web-call", { method: "POST", headers: { origin: "https://example.com", "Content-Type": "application/json" }, body: JSON.stringify({ mode: "receptionist" }) });

describe("Retell v3 browser connection", () => {
  beforeEach(() => {
    vi.stubEnv("DEMO_CALL_HASH_SECRET", "test-secret"); vi.stubEnv("RETELL_API_KEY", "private-server-key"); vi.stubEnv("RETELL_RECEPTIONIST_DEMO_AGENT_ID", "agent-demo");
    rpc.mockReset().mockResolvedValue({ data: "request-id", error: null }); eq.mockReset().mockResolvedValue({ error: null }); update.mockReset().mockReturnValue({ eq }); createWebCall.mockReset();
  });
  it("forwards all four v3 connection fields instead of only the legacy token", async () => {
    const iceServers = [{ urls: ["stun:example.com"] }];
    createWebCall.mockResolvedValue({ call_id: "call-1", access_token: "short-lived-token", transport: "gateway", ice_servers: iceServers });
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.json()).toEqual({ ok: true, callId: "call-1", accessToken: "short-lived-token", transport: "gateway", iceServers });
    expect(createWebCall).toHaveBeenCalledWith(expect.objectContaining({ agent_id: "agent-demo", agent_version: "latest_published" }));
  });
  it("keeps quotas in front of paid call creation", async () => {
    rpc.mockResolvedValue({ error: { message: "rate_limit" } });
    expect((await POST(request())).status).toBe(429);
    expect(createWebCall).not.toHaveBeenCalled();
  });
  it("returns a safe unavailable response when the quota database fails", async () => {
    rpc.mockRejectedValue(new Error("connection refused"));
    const response = await POST(request());
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain("connection refused");
    expect(createWebCall).not.toHaveBeenCalled();
  });
  it("records a failed provider request without exposing billing or credential details", async () => {
    createWebCall.mockRejectedValue(new Error("Credit balance exhausted"));
    const response = await POST(request());
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain("Credit balance");
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ status: "failed" }));
  });
});
