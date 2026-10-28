import { createHash } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { getAdmin, answerCustomer } = vi.hoisted(() => ({ getAdmin: vi.fn(), answerCustomer: vi.fn() }));
vi.mock("@/lib/supabase-server", () => ({ getSupabaseAdmin: getAdmin }));
vi.mock("next/server", async importOriginal => ({ ...(await importOriginal<typeof import("next/server")>()), after: vi.fn() }));
vi.mock("@/lib/chat-lead-notifications", () => ({ processChatLeadNotification: vi.fn() }));
vi.mock("@/lib/customer-chat-server", async importOriginal => ({ ...(await importOriginal<typeof import("@/lib/customer-chat-server")>()), answerCustomerChat: answerCustomer }));
import { POST } from "@/app/api/chat/route";
import { CustomerChatError } from "@/lib/customer-chat-server";

function request(body: unknown, origin = "https://example.com") {
  return new NextRequest("https://example.com/api/chat", { method: "POST", headers: { origin, "Content-Type": "application/json" }, body: JSON.stringify(body) });
}

describe("website chat boundary", () => {
  beforeEach(() => { vi.stubEnv("CHAT_SESSION_SECRET", "test-chat-secret"); getAdmin.mockReset(); });
  it("rejects cross-origin requests before reaching storage", async () => {
    expect((await POST(request({ workspace: "tenant-a", message: "Hi" }, "https://attacker.com"))).status).toBe(403);
    expect(getAdmin).not.toHaveBeenCalled();
  });
  it("rejects oversized messages and malformed session tokens", async () => {
    expect((await POST(request({ workspace: "tenant-a", message: "x".repeat(1001) }))).status).toBe(400);
    expect((await POST(request({ workspace: "tenant-a", message: "Hi", sessionToken: "other-session" }))).status).toBe(401);
    expect(getAdmin).not.toHaveBeenCalled();
  });
  it("requires valid contact details and explicit follow-up permission", async () => {
    expect((await POST(request({ workspace: "tenant-a", lead: { name: "Jane", email: "jane@example.com", consent: false } }))).status).toBe(400);
    expect(getAdmin).not.toHaveBeenCalled();
  });
  it("binds existing sessions and knowledge to the server-resolved tenant", async () => {
    const chains: Record<string, ReturnType<typeof chain>> = {};
    function chain(data: unknown) {
      const result = { data, error: null };
      const builder = { select: vi.fn(), eq: vi.fn(), maybeSingle: vi.fn(), limit: vi.fn() };
      builder.select.mockReturnValue(builder); builder.eq.mockReturnValue(builder);
      builder.maybeSingle.mockResolvedValue(result); builder.limit.mockResolvedValue(result);
      return builder;
    }
    chains.clients = chain({ id: "tenant-b-id" });
    chains.website_chat_settings = chain({ enabled: true });
    chains.website_knowledge = chain([{ id: "one", title: "Hours", content: "Open weekdays.", keywords: "hours open" }]);
    const rpc = vi.fn().mockResolvedValue({ error: null });
    getAdmin.mockReturnValue({ from: (table: string) => chains[table], rpc });
    const response = await POST(request({ workspace: "tenant-b", message: "When are you open?", sessionToken: "a".repeat(64), client_id: "attacker-supplied-id" }));
    expect(response.status).toBe(200);
    expect(chains.clients.eq).toHaveBeenCalledWith("slug", "tenant-b");
    expect(chains.website_knowledge.eq).toHaveBeenCalledWith("client_id", "tenant-b-id");
    expect(rpc).toHaveBeenCalledWith("record_website_chat_turn", expect.objectContaining({ p_client_id: "tenant-b-id", p_token_hash: expect.stringMatching(/^[a-f0-9]{64}$/) }));
    expect((await response.json()).answer.content).toBe("Open weekdays.");
  });
  it("never returns server configuration details to visitors", async () => {
    getAdmin.mockImplementation(() => { throw new Error("private database secret"); });
    const response = await POST(request({ workspace: "tenant-a", message: "Hi" }));
    expect(response.status).toBe(503);
    expect(JSON.stringify(await response.json())).not.toContain("secret");
  });
});

describe("configured customer AI routing", () => {
  function store(engine: string) {
    const data: Record<string, unknown> = {
      clients: { id: "resolved-customer", business_name: "Customer A", services: [] },
      website_chat_settings: { enabled: true, use_business_profile: false, engine },
      website_knowledge: [{ id: "customer-source", title: "Hours", content: "Weekdays", keywords: "hours" }],
      website_chats: { id: "saved-lead" },
    };
    const rpc = vi.fn().mockResolvedValue({ data: null, error: null });
    const from = vi.fn((table: string) => {
      const q: Record<string, unknown> = {};
      for (const key of ["select", "eq", "update", "is", "gte"]) q[key] = vi.fn(() => q);
      q.limit = q.maybeSingle = vi.fn(async () => ({ data: data[table], error: null }));
      return q;
    });
    getAdmin.mockReturnValue({ from, rpc });
    return { rpc };
  }
  beforeEach(() => { vi.clearAllMocks(); vi.stubEnv("CHAT_SESSION_SECRET", "test-chat-secret"); answerCustomer.mockResolvedValue({ content: "AI customer answer" }); });
  it("routes only explicitly configured AI using server-selected customer and published knowledge", async () => {
    const { rpc } = store("retell");
    const response = await POST(request({ workspace: "customer-a", message: "Hours?", sessionToken: "b".repeat(64), agent_id: "demo-or-foreign", client_id: "forged" }));
    expect(response.status).toBe(200);
    expect(answerCustomer).toHaveBeenCalledWith(expect.objectContaining({ clientId: "resolved-customer", businessName: "Customer A", knowledge: [expect.objectContaining({ id: "customer-source" })], message: "Hours?" }));
    expect(JSON.stringify(answerCustomer.mock.calls)).not.toContain("demo-or-foreign");
    expect(rpc).not.toHaveBeenCalledWith("record_website_chat_turn", expect.anything());
  });
  it("keeps a legacy workspace on the local engine", async () => {
    store("local");
    expect((await POST(request({ workspace: "customer-a", message: "Hours?", sessionToken: "b".repeat(64) }))).status).toBe(200);
    expect(answerCustomer).not.toHaveBeenCalled();
  });
  it("preserves contact capture without requiring the AI provider", async () => {
    store("retell"); answerCustomer.mockRejectedValue(new Error("Provider is down"));
    const response = await POST(request({ workspace: "customer-a", sessionToken: "b".repeat(64), lead: { name: "Example", email: "example@example.com", request: "Callback", consent: true } }));
    expect(response.status).toBe(200);
    expect(answerCustomer).not.toHaveBeenCalled();
  });
  it("returns a restart instruction without provider internals or a local fallback", async () => {
    store("retell");
    answerCustomer.mockRejectedValue(new CustomerChatError("Start a new conversation", 401, "b".repeat(64), true));
    const response = await POST(request({ workspace: "customer-a", message: "Hours?", sessionToken: "b".repeat(64) }));
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Start a new conversation", sessionToken: "b".repeat(64), resetSession: true });
  });
});

describe("chat contact capture", () => {
  const token = "b".repeat(64);
  const lead = { name: "Jane", email: "jane@example.com", request: "Please quote a repair.", consent: true };
  const capture = { update: vi.fn(), eq: vi.fn(), is: vi.fn(), gte: vi.fn(), select: vi.fn(), maybeSingle: vi.fn() };
  const rpc = vi.fn();
  beforeEach(() => {
    vi.clearAllMocks(); vi.stubEnv("CHAT_SESSION_SECRET", "test-chat-secret");
    for (const method of [capture.update, capture.eq, capture.is, capture.gte, capture.select]) method.mockReturnValue(capture);
    capture.maybeSingle.mockResolvedValue({ data: { id: "captured-chat" }, error: null });
    rpc.mockResolvedValue({ error: null });
    function lookup(data: unknown) {
      const q = { select: vi.fn(), eq: vi.fn(), maybeSingle: vi.fn().mockResolvedValue({ data, error: null }) };
      q.select.mockReturnValue(q); q.eq.mockReturnValue(q); return q;
    }
    getAdmin.mockReturnValue({ from: (table: string) => table === "clients" ? lookup({ id: "real-tenant" }) : table === "website_chat_settings" ? lookup({ enabled: true }) : capture, rpc });
  });
  it("captures contact details only on the server tenant's unclaimed, unexpired session", async () => {
    const response = await POST(request({ workspace: "real-workspace", sessionToken: token, client_id: "forged-tenant", lead }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, sessionToken: token });
    expect(capture.eq).toHaveBeenCalledWith("client_id", "real-tenant");
    expect(capture.eq).toHaveBeenCalledWith("access_token_hash", expect.stringMatching(/^[a-f0-9]{64}$/));
    expect(capture.eq).not.toHaveBeenCalledWith("access_token_hash", token);
    expect(capture.is).toHaveBeenCalledWith("lead_captured_at", null);
    expect(capture.gte).toHaveBeenCalledWith("created_at", expect.any(String));
    expect(capture.update).toHaveBeenCalledWith(expect.objectContaining({ lead_email: "jane@example.com", lead_request: "Please quote a repair.", contact_consent_at: expect.any(String) }));
    expect(rpc).not.toHaveBeenCalled();
  });
  it("reports a conflict for an expired, cross-tenant, or already captured session without claiming success", async () => {
    capture.maybeSingle.mockResolvedValue({ data: null, error: null });
    const response = await POST(request({ workspace: "real-workspace", sessionToken: token, lead }));
    expect(response.status).toBe(409);
    expect((await response.json()).ok).toBeUndefined();
  });
  it("can start a session directly from the lead form, storing token and IP hashes only", async () => {
    const response = await POST(request({ workspace: "real-workspace", lead }));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.sessionToken).toMatch(/^[a-f0-9]{64}$/);
    expect(rpc).toHaveBeenCalledWith("start_website_chat", expect.objectContaining({ p_client_id: "real-tenant", p_token_hash: expect.any(String), p_ip_hash: expect.stringMatching(/^[a-f0-9]{64}$/) }));
    expect(rpc.mock.calls[0][1].p_token_hash).not.toBe(body.sessionToken);
  });
  it("returns database rate limits before attempting to capture a lead", async () => {
    rpc.mockResolvedValue({ error: { message: "rate_limit" } });
    const response = await POST(request({ workspace: "real-workspace", lead }));
    expect(response.status).toBe(429);
    expect(capture.update).not.toHaveBeenCalled();
  });
});


describe("website chat contact capture", () => {
  const token = "a".repeat(64);
  const lead = { name: " Jane ", email: " jane@example.com ", phone: " 555-0100 ", request: " Please call about repairs. ", consent: true };
  function captureStore(data: unknown = { id: "chat-id" }, error: unknown = null) {
    function chain(result: unknown, resultError: unknown = null) {
      const builder = { select: vi.fn(), update: vi.fn(), eq: vi.fn(), is: vi.fn(), gte: vi.fn(), maybeSingle: vi.fn() };
      for (const method of [builder.select, builder.update, builder.eq, builder.is, builder.gte]) method.mockReturnValue(builder);
      builder.maybeSingle.mockResolvedValue({ data: result, error: resultError });
      return builder;
    }
    const chats = chain(data, error);
    const tables = { clients: chain({ id: "resolved-tenant" }), website_chat_settings: chain({ enabled: true }), website_chats: chats };
    const from = vi.fn((table: keyof typeof tables) => tables[table]);
    const rpc = vi.fn().mockResolvedValue({ error: null });
    getAdmin.mockReturnValue({ from, rpc });
    return { chats, from, rpc };
  }
  beforeEach(() => { vi.stubEnv("CHAT_SESSION_SECRET", "test-chat-secret"); getAdmin.mockReset(); });
  it("captures consent and request once, scoped to the resolved tenant and hashed session", async () => {
    const { chats, rpc } = captureStore();
    const before = Date.now() - 86_400_000;
    const response = await POST(request({ workspace: "tenant-a", sessionToken: token, client_id: "attacker", lead }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, sessionToken: token });
    expect(chats.update).toHaveBeenCalledWith(expect.objectContaining({ lead_name: "Jane", lead_email: "jane@example.com", lead_phone: "555-0100", lead_request: "Please call about repairs.", contact_consent_at: expect.any(String) }));
    const saved = chats.update.mock.calls[0][0];
    expect(saved.contact_consent_at).toBe(saved.lead_captured_at);
    expect(chats.eq).toHaveBeenCalledWith("client_id", "resolved-tenant");
    expect(chats.eq).toHaveBeenCalledWith("access_token_hash", createHash("sha256").update(token).digest("hex"));
    expect(chats.is).toHaveBeenCalledWith("lead_captured_at", null);
    expect(chats.gte.mock.calls[0][0]).toBe("created_at");
    expect(Date.parse(chats.gte.mock.calls[0][1])).toBeGreaterThanOrEqual(before);
    expect(Date.parse(chats.gte.mock.calls[0][1])).toBeLessThanOrEqual(Date.now() - 86_400_000);
    expect(rpc).not.toHaveBeenCalled();
  });
  it("does not report success when the capture filter rejects a duplicate or expired session", async () => {
    captureStore(null);
    const response = await POST(request({ workspace: "tenant-a", sessionToken: token, lead }));
    expect(response.status).toBe(409);
    expect((await response.json()).error).toContain("already submitted or the session expired");
  });
  it.each([false, undefined, "true"])("rejects non-explicit consent (%s) even when the other fields are valid", async (consent) => {
    const response = await POST(request({ workspace: "tenant-a", sessionToken: token, lead: { ...lead, consent } }));
    expect(response.status).toBe(400);
    expect(getAdmin).not.toHaveBeenCalled();
  });
  it("starts and returns a session when the visitor submits contact details first", async () => {
    const { rpc, chats } = captureStore();
    const response = await POST(request({ workspace: "tenant-a", lead, attribution: { utm_source: "google" } }));
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.sessionToken).toMatch(/^[a-f0-9]{64}$/);
    const hash = createHash("sha256").update(body.sessionToken).digest("hex");
    expect(rpc).toHaveBeenCalledWith("start_website_chat", expect.objectContaining({ p_client_id: "resolved-tenant", p_token_hash: hash, p_attribution: expect.objectContaining({ utm_source: "google" }) }));
    expect(chats.eq).toHaveBeenCalledWith("access_token_hash", hash);
  });
  it("returns a retryable error rather than success on a failed contact write", async () => {
    captureStore(null, { message: "private storage failure" });
    const response = await POST(request({ workspace: "tenant-a", sessionToken: token, lead }));
    expect(response.status).toBe(503);
    expect(JSON.stringify(await response.json())).not.toContain("private storage");
  });
});
