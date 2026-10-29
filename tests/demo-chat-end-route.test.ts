import { createHash, createHmac } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({ getAdmin: vi.fn(), getRetell: vi.fn(), rpc: vi.fn(), end: vi.fn() }));
vi.mock("@/lib/supabase-server", () => ({ getSupabaseAdmin: mocks.getAdmin }));
vi.mock("@/lib/retell", () => ({ getRetellClient: mocks.getRetell }));
import { POST } from "@/app/api/chat/demo/end/route";

const token = "a".repeat(64);
const origin = "https://example.com";
const ip = "192.0.2.5";
function request(body: unknown, options: { origin?: string; raw?: boolean; noOrigin?: boolean } = {}) {
  const headers: Record<string, string> = { "Content-Type": "application/json", "x-forwarded-for": `${ip}, 10.0.0.1` };
  if (!options.noOrigin) headers.origin = options.origin ?? origin;
  return new NextRequest(`${origin}/api/chat/demo/end`, { method: "POST", headers, body: options.raw ? String(body) : JSON.stringify(body) });
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("CHAT_SESSION_SECRET", "demo-test-secret");
  vi.stubEnv("DEMO_CALL_HASH_SECRET", "");
  vi.stubEnv("RETELL_API_KEY", "test-provider-key");
  mocks.getAdmin.mockReturnValue({ rpc: mocks.rpc });
  mocks.getRetell.mockReturnValue({ chat: { end: mocks.end } });
  mocks.rpc.mockResolvedValue({ data: { chat_id: "bound-private-chat" }, error: null });
  mocks.end.mockResolvedValue(undefined);
});

describe("ending the public demo conversation", () => {
  it("closes only the session in the selected industry namespace", async () => {
    const response = await POST(request({ sessionToken: token, niche: "warehouse-racking" }));
    expect(response.status).toBe(200);
    expect(mocks.rpc).toHaveBeenCalledWith("end_public_demo_chat", expect.objectContaining({ p_token_hash: createHash("sha256").update(`warehouse-racking:${token}`).digest("hex") }));
  });
  it("rejects an unknown industry before closing any session", async () => {
    expect((await POST(request({ sessionToken: token, niche: "unknown" }))).status).toBe(400);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it.each([{ origin: "https://attacker.example" }, { noOrigin: true }])("requires the same origin before accessing storage: %j", async (options) => {
    expect((await POST(request({ sessionToken: token }, options))).status).toBe(403);
    expect(mocks.getAdmin).not.toHaveBeenCalled();
    expect(mocks.getRetell).not.toHaveBeenCalled();
  });

  it.each([{}, { sessionToken: null }, { sessionToken: "private-provider-chat" }, { sessionToken: "g".repeat(64) }])("requires a valid session capability: %j", async (body) => {
    expect((await POST(request(body))).status).toBe(401);
    expect(mocks.rpc).not.toHaveBeenCalled();
    expect(mocks.end).not.toHaveBeenCalled();
  });

  it("rejects malformed JSON, non-objects, and oversized bodies", async () => {
    expect((await POST(request("{", { raw: true }))).status).toBe(400);
    expect((await POST(request([]))).status).toBe(400);
    expect((await POST(request(null))).status).toBe(400);
    expect((await POST(request("x".repeat(1001), { raw: true }))).status).toBe(413);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("expires the server binding before closing its provider chat and ignores submitted provider IDs", async () => {
    const response = await POST(request({ sessionToken: token, chat_id: "attacker-chat", workspace: "another-tenant" }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(mocks.rpc).toHaveBeenCalledExactlyOnceWith("end_public_demo_chat", {
      p_token_hash: createHash("sha256").update(token).digest("hex"),
      p_ip_hash: createHmac("sha256", "demo-test-secret").update(ip).digest("hex"),
    });
    expect(mocks.rpc.mock.invocationCallOrder[0]).toBeLessThan(mocks.end.mock.invocationCallOrder[0]);
    expect(mocks.end).toHaveBeenCalledExactlyOnceWith("bound-private-chat", { timeout: 20_000, maxRetries: 0 });
    expect(JSON.stringify(mocks.rpc.mock.calls)).not.toContain(token);
  });

  it.each([["demo_session_expired", 401], ["demo_session_busy", 409]])("rejects %s without ending a provider chat", async (message, status) => {
    mocks.rpc.mockResolvedValue({ data: null, error: { message } });
    expect((await POST(request({ sessionToken: token }))).status).toBe(status);
    expect(mocks.end).not.toHaveBeenCalled();
  });

  it("closes a local session without a provider allocation", async () => {
    mocks.rpc.mockResolvedValue({ data: { chat_id: null }, error: null });
    expect((await POST(request({ sessionToken: token }))).status).toBe(200);
    expect(mocks.getRetell).not.toHaveBeenCalled();
  });

  it.each([{ status: 400, message: "Chat has already ended" }, { status: 404, message: "Chat not found" }])("accepts an already closed or removed provider conversation: %j", async (error) => {
    mocks.end.mockRejectedValue(error);
    expect((await POST(request({ sessionToken: token }))).status).toBe(200);
  });

  it("returns a safe retryable error on provider failure without modifying quota records", async () => {
    mocks.end.mockRejectedValue(new Error("private provider credentials"));
    const response = await POST(request({ sessionToken: token }));
    expect(response.status).toBe(503);
    expect(JSON.stringify(await response.json())).not.toMatch(/private|credentials|bound-private-chat/);
    expect(mocks.end).toHaveBeenCalledOnce();
    expect(mocks.rpc.mock.calls.map(([name]) => name)).toEqual(["end_public_demo_chat"]);
  });

  it("fails closed if the server binding is malformed", async () => {
    mocks.rpc.mockResolvedValue({ data: { chat_id: 5 }, error: null });
    expect((await POST(request({ sessionToken: token }))).status).toBe(503);
    expect(mocks.end).not.toHaveBeenCalled();
  });

  it.each(["CHAT_SESSION_SECRET", "RETELL_API_KEY"])("fails closed when %s is missing", async (name) => {
    vi.stubEnv(name, "");
    expect((await POST(request({ sessionToken: token }))).status).toBe(503);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
});
