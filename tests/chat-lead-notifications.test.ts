import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ admin: vi.fn() }));
vi.mock("@/lib/supabase-server", () => ({ getSupabaseAdmin: mocks.admin }));
import { chatEmailConfigured, chatLeadEmail, processChatLeadNotification, validNotificationEmail } from "@/lib/chat-lead-notifications";

describe("lead alert email contents", () => {
  it("requires an explicit provider, key and single sender address", () => {
    expect(chatEmailConfigured({ RESEND_API_KEY: "key", CHAT_LEAD_EMAIL_FROM: "alerts@example.com" })).toBe(false);
    expect(chatEmailConfigured({ CHAT_LEAD_EMAIL_PROVIDER: "resend", RESEND_API_KEY: "key", CHAT_LEAD_EMAIL_FROM: "alerts@example.com" })).toBe(true);
    expect(validNotificationEmail("a@example.com,b@example.com")).toBe(false);
    expect(validNotificationEmail("a@example.com\r\nBcc: victim@example.com")).toBe(false);
  });
  it("bounds the summary, removes header line breaks, and links to authenticated chats without a public token", () => {
    const payload = chatLeadEmail({ destination_email: "team@example.com", destination_label: "Dispatch", lead_snapshot: { business_name: "Repair\nBcc: x", name: "x".repeat(200), email: "visitor@example.com", request: "y".repeat(5000) } }, "alerts@example.com", "https://example.com");
    expect(payload.to).toEqual(["team@example.com"]);
    expect(payload.subject).not.toMatch(/[\r\n]/);
    expect(payload.text.length).toBeLessThan(4000);
    expect(payload.text).toContain("https://example.com/dashboard/chats");
    expect(payload.text).toContain("No appointment has been booked");
    expect(payload.text).not.toContain("token=");
    expect(payload.text).not.toContain("x".repeat(101));
  });
});

describe("durable lead alert worker", () => {
  const query = { select: vi.fn(), eq: vi.fn(), maybeSingle: vi.fn(), update: vi.fn(), in: vi.fn() };
  const rpc = vi.fn();
  const fetchMock = vi.fn();
  const item = { id: "outbox-1", chat_id: "chat-1", client_id: "tenant-1", status: "queued", destination_email: "team@example.com", destination_label: "Dispatch", lead_snapshot: { business_name: "Repair", name: "Visitor", email: "visitor@example.com", request: "Leaking tap" }, payload: null };
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("CHAT_LEAD_EMAIL_PROVIDER", "resend"); vi.stubEnv("RESEND_API_KEY", "fake-test-key"); vi.stubEnv("CHAT_LEAD_EMAIL_FROM", "alerts@example.com"); vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://example.com");
    query.select.mockReturnValue(query); query.eq.mockReturnValue(query); query.update.mockReturnValue(query);
    query.in.mockResolvedValue({ error: null }); query.maybeSingle.mockResolvedValue({ data: item, error: null });
    rpc.mockImplementation(async (name, args) => name === "claim_website_chat_notification"
      ? { data: [{ ...item, status: "sending", claim_token: "claim-1", payload: args.p_payload }], error: null } : { error: null });
    mocks.admin.mockReturnValue({ from: vi.fn().mockReturnValue(query), rpc });
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ id: "email-1" }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

  it("never sends when configuration is missing and preserves the lead in the outbox", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    await processChatLeadNotification({ clientId: "tenant-1", chatId: "chat-1" });
    expect(fetchMock).not.toHaveBeenCalled(); expect(rpc).not.toHaveBeenCalled();
    expect(query.update).toHaveBeenCalledWith(expect.objectContaining({ status: "failed", last_error: "delivery_not_configured" }));
    expect(query.in).toHaveBeenCalledWith("status", ["queued", "failed"]);
  });
  it("sends only a claimed notification with a stable idempotency key", async () => {
    await processChatLeadNotification({ clientId: "tenant-1", chatId: "chat-1" });
    expect(query.eq).toHaveBeenCalledWith("client_id", "tenant-1");
    expect(fetchMock).toHaveBeenCalledWith("https://api.resend.com/emails", expect.objectContaining({ headers: expect.objectContaining({ "Idempotency-Key": "website-chat-lead/outbox-1" }) }));
    expect(rpc).toHaveBeenLastCalledWith("finish_website_chat_notification", { p_id: "outbox-1", p_claim_token: "claim-1", p_message_id: "email-1", p_error: null });
  });
  it("uses the original stored payload when settings change between retries", async () => {
    const payload = { from: "original@example.com", to: ["team@example.com"], subject: "Original subject", text: "Original body" };
    query.maybeSingle.mockResolvedValue({ data: { ...item, payload }, error: null });
    await processChatLeadNotification({ clientId: "tenant-1", chatId: "chat-1" });
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual(payload);
  });
  it.each([null, { ...item, status: "sent" }])("does not send missing or already sent outbox entries", async (data) => {
    query.maybeSingle.mockResolvedValue({ data, error: null });
    await processChatLeadNotification({ clientId: "tenant-1", chatId: "chat-1" });
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("does not send when another worker holds the claim or retry is unsafe", async () => {
    rpc.mockResolvedValue({ data: [], error: null });
    await processChatLeadNotification({ clientId: "tenant-1", chatId: "chat-1" });
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it.each([429, 500])("records provider HTTP %s as failed without propagating visitor data", async (status) => {
    fetchMock.mockResolvedValue(new Response("provider error includes private details", { status }));
    await expect(processChatLeadNotification({ clientId: "tenant-1", chatId: "chat-1" })).resolves.toBeUndefined();
    expect(rpc).toHaveBeenLastCalledWith("finish_website_chat_notification", expect.objectContaining({ p_message_id: null, p_error: `provider_http_${status}` }));
  });
  it("records network timeouts as retryable failure without rolling back a saved lead", async () => {
    fetchMock.mockRejectedValue(new Error("timeout"));
    await expect(processChatLeadNotification({ clientId: "tenant-1", chatId: "chat-1" })).resolves.toBeUndefined();
    expect(rpc).toHaveBeenLastCalledWith("finish_website_chat_notification", expect.objectContaining({ p_message_id: null, p_error: "provider_request_failed" }));
  });
  it("leaves a recoverable claim if completion persistence fails instead of sending a second email", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    rpc.mockImplementation(async (name, args) => name === "claim_website_chat_notification" ? { data: [{ ...item, claim_token: "claim-1", payload: args.p_payload }] } : { error: { message: "database unavailable" } });
    await expect(processChatLeadNotification({ clientId: "tenant-1", chatId: "chat-1" })).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(query.update).not.toHaveBeenCalled();
  });
});
