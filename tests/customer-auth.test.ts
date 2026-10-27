import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getAuth: vi.fn(), configured: vi.fn(), getAdmin: vi.fn(), cookies: vi.fn(), slug: vi.fn(), ensureAgent: vi.fn(), provisionAgents: vi.fn(),
  redirect: vi.fn((path: string) => { throw new Error(`redirect:${path}`); })
}));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("next/headers", () => ({ cookies: mocks.cookies }));
vi.mock("@/lib/supabase-auth", () => ({ getSupabaseAuth: mocks.getAuth, isSupabaseAuthConfigured: mocks.configured }));
vi.mock("@/lib/supabase-server", () => ({ getSupabaseAdmin: mocks.getAdmin }));
vi.mock("@/lib/customer-slug", () => ({ uniqueCustomerSlug: mocks.slug }));
vi.mock("@/lib/customer-agent-provisioning", () => ({ ensureDefaultCustomerAgent: mocks.ensureAgent, provisionCustomerAgents: mocks.provisionAgents }));
import { completeOnboardingAction, requestLoginLinkAction, requestSignupLinkAction, resendEmailLinkAction, requestPhoneOtpAction, verifyPhoneOtpAction } from "@/app/auth-actions";
import { GET } from "@/app/auth/callback/route";
import { NextRequest } from "next/server";
import { pendingEmailCookie, pendingInvitationCookie, pendingModeCookie, pendingOwnerNameCookie, pendingPhoneCookie } from "@/lib/auth-email";

function form(values: Record<string, string>) {
  const result = new FormData();
  for (const [key, value] of Object.entries(values)) result.set(key, value);
  return result;
}

describe("customer magic-link authentication", () => {
  let values: Map<string, string>;
  const cookieStore = { get: vi.fn(), set: vi.fn(), delete: vi.fn() };
  const auth = { getUser: vi.fn(), signInWithOtp: vi.fn(), verifyOtp: vi.fn(), exchangeCodeForSession: vi.fn(), signOut: vi.fn() };
  const query = { select: vi.fn(), eq: vi.fn(), single: vi.fn(), maybeSingle: vi.fn(), insert: vi.fn(), upsert: vi.fn(), update: vi.fn() };
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_APP_URL = "https://example.com/";
    values = new Map();
    cookieStore.get.mockImplementation((key: string) => values.has(key) ? { value: values.get(key) } : undefined);
    cookieStore.set.mockImplementation((key: string, value: string) => values.set(key, value));
    cookieStore.delete.mockImplementation((key: string) => values.delete(key));
    mocks.cookies.mockResolvedValue(cookieStore);
    mocks.configured.mockReturnValue(true);
    mocks.getAuth.mockResolvedValue({ auth });
    mocks.getAdmin.mockReturnValue({ from: vi.fn().mockReturnValue(query) });
    mocks.slug.mockResolvedValue("danny-workspace-2");
    auth.getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    auth.signInWithOtp.mockResolvedValue({ error: null });
    auth.verifyOtp.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    auth.exchangeCodeForSession.mockResolvedValue({ data: { user: { id: "user-1", email: "owner@example.com", user_metadata: { owner_name: "Danny" } }, session: {} }, error: null });
    query.select.mockReturnValue(query); query.eq.mockReturnValue(query);
    query.maybeSingle.mockResolvedValue({ data: null, error: null });
    query.insert.mockResolvedValue({ error: null });
  });

  it("logs returning email customers in without creating a new user or sending SMS", async () => {
    await expect(requestLoginLinkAction(form({ email: " OWNER@Example.com " }))).rejects.toThrow("redirect:/check-email");
    expect(auth.signInWithOtp).toHaveBeenCalledWith({ email: "owner@example.com", options: { shouldCreateUser: false, emailRedirectTo: "https://example.com/auth/callback" } });
    expect(values.get(pendingModeCookie)).toBe("login");
    expect(values.get(pendingEmailCookie)).toBe("owner@example.com");
    expect(values.has(pendingPhoneCookie)).toBe(false);
  });

  it("rejects invalid email before contacting the provider", async () => {
    await expect(requestLoginLinkAction(form({ email: "not-an-email" }))).rejects.toThrow("redirect:/login?error=email");
    expect(auth.signInWithOtp).not.toHaveBeenCalled();
  });

  it("does not claim a link was sent when the provider rejects it", async () => {
    auth.signInWithOtp.mockResolvedValue({ error: { message: "rate limited" } });
    await expect(requestLoginLinkAction(form({ email: "owner@example.com" }))).rejects.toThrow("redirect:/login?error=email");
    expect(cookieStore.set).not.toHaveBeenCalled();
  });

  it("resends a signup link with the same signup intent and owner name", async () => {
    await expect(requestSignupLinkAction(form({ email: "owner@example.com", owner_name: "Danny" }))).rejects.toThrow("redirect:/check-email");
    auth.signInWithOtp.mockClear();
    await expect(resendEmailLinkAction()).rejects.toThrow("redirect:/check-email");
    expect(auth.signInWithOtp).toHaveBeenCalledWith({ email: "owner@example.com", options: { shouldCreateUser: true, emailRedirectTo: "https://example.com/auth/callback", data: { owner_name: "Danny" } } });
    expect(values.get(pendingModeCookie)).toBe("signup");
  });

  it("requires a pending request before resending", async () => {
    await expect(resendEmailLinkAction()).rejects.toThrow("redirect:/login?error=expired");
    expect(auth.signInWithOtp).not.toHaveBeenCalled();
  });

  function callback(mode = "login") {
    values.set(pendingModeCookie, mode); values.set(pendingEmailCookie, "owner@example.com");
    return GET(new NextRequest("https://example.com/auth/callback?code=one-use-code"));
  }

  it("returns an existing email customer to their dashboard", async () => {
    query.maybeSingle.mockResolvedValue({ data: { id: "workspace-1" }, error: null });
    const response = await callback();
    expect(response.headers.get("location")).toBe("https://example.com/dashboard");
    expect(query.eq).toHaveBeenCalledWith("user_id", "user-1");
    expect(query.insert).not.toHaveBeenCalled();
    expect(values.has(pendingEmailCookie)).toBe(false);
  });

  it("does not reset an existing workspace when its owner uses signup again", async () => {
    query.maybeSingle.mockResolvedValue({ data: { id: "established-workspace" }, error: null });
    const response = await callback("signup");
    expect(response.headers.get("location")).toBe("https://example.com/dashboard");
    expect(query.insert).not.toHaveBeenCalled(); expect(query.upsert).not.toHaveBeenCalled();
    expect(mocks.slug).not.toHaveBeenCalled();
  });

  it("creates a new email workspace with a unique slug and owner email", async () => {
    const response = await callback("signup");
    expect(response.headers.get("location")).toBe("https://example.com/dashboard/settings?welcome=1");
    expect(query.insert).toHaveBeenCalledWith(expect.objectContaining({ user_id: "user-1", slug: "danny-workspace-2", owner_email: "owner@example.com", product_mode: "website_chat", provisioning_status: "needs_configuration" }));
    expect(query.upsert).not.toHaveBeenCalled();
  });

  it("does not create a workspace when the existence lookup fails", async () => {
    query.maybeSingle.mockResolvedValue({ data: null, error: { message: "database unavailable" } });
    const response = await callback("signup");
    expect(response.headers.get("location")).toBe("https://example.com/signup?error=workspace");
    expect(query.insert).not.toHaveBeenCalled();
  });

  it("signs out verified users with no linked workspace on returning login", async () => {
    const response = await callback();
    expect(response.headers.get("location")).toBe("https://example.com/login?error=account");
    expect(auth.signOut).toHaveBeenCalled();
    expect(query.insert).not.toHaveBeenCalled();
  });

  it("rejects a callback for a different email before accessing workspace data", async () => {
    auth.exchangeCodeForSession.mockResolvedValue({ data: { user: { id: "other-user", email: "other@example.com" }, session: {} }, error: null });
    const response = await callback();
    expect(response.headers.get("location")).toBe("https://example.com/login?error=expired");
    expect(mocks.getAdmin).not.toHaveBeenCalled();
  });

  it("claims an invited chat workspace and opens chat analytics without voice onboarding", async () => {
    values.set(pendingInvitationCookie, "a".repeat(43));
    const clients = { select: vi.fn(), eq: vi.fn(), is: vi.fn(), update: vi.fn(), maybeSingle: vi.fn() };
    for (const method of [clients.select, clients.eq, clients.is, clients.update]) method.mockReturnValue(clients);
    clients.maybeSingle.mockResolvedValueOnce({ data: { id: "invited-chat", user_id: null, product_mode: "website_chat", onboarding_completed_at: null }, error: null })
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({ data: { id: "invited-chat" }, error: null });
    const invites = { select: vi.fn(), eq: vi.fn(), neq: vi.fn(), is: vi.fn(), gt: vi.fn(), update: vi.fn(), maybeSingle: vi.fn(), then: vi.fn() };
    for (const method of [invites.select, invites.eq, invites.neq, invites.is, invites.gt, invites.update]) method.mockReturnValue(invites);
    invites.maybeSingle.mockResolvedValue({ data: { id: "invitation-1", client_id: "invited-chat" }, error: null });
    invites.then.mockImplementation((resolve: (value: object) => unknown) => Promise.resolve({ error: null }).then(resolve));
    mocks.getAdmin.mockReturnValue({ from: (table: string) => table === "clients" ? clients : invites });
    const response = await callback("invite");
    expect(response.headers.get("location")).toBe("https://example.com/dashboard/chats?invited=1");
    expect(clients.update).toHaveBeenCalledWith({ user_id: "user-1", owner_email: "owner@example.com", onboarding_completed_at: expect.any(String) });
    expect(clients.is).toHaveBeenCalledWith("user_id", null);
    expect(invites.update).toHaveBeenCalledWith({ accepted_at: expect.any(String), accepted_user_id: "user-1" });
  });

  it("keeps legacy SMS requests on the existing verification route", async () => {
    await expect(requestPhoneOtpAction(form({ phone: "9195550123", mode: "login" }))).rejects.toThrow("redirect:/verify");
    expect(values.get(pendingPhoneCookie)).toBe("+19195550123");
  });

  it("returns a rejected legacy code to the existing verification route", async () => {
    values.set(pendingPhoneCookie, "+19195550123"); values.set(pendingModeCookie, "login");
    auth.verifyOtp.mockResolvedValue({ data: { user: null }, error: { message: "invalid" } });
    await expect(verifyPhoneOtpAction(form({ token: "123456" }))).rejects.toThrow("redirect:/verify?error=invalid");
  });

  it("supplies the required slug for legacy phone signup", async () => {
    values.set(pendingPhoneCookie, "+19195550123"); values.set(pendingModeCookie, "signup"); values.set(pendingOwnerNameCookie, "Danny");
    await expect(verifyPhoneOtpAction(form({ token: "123456" }))).rejects.toThrow("redirect:/onboarding");
    expect(query.insert).toHaveBeenCalledWith(expect.objectContaining({ user_id: "user-1", slug: "danny-workspace-2" }));
  });

  it("preserves an established workspace during legacy phone signup", async () => {
    values.set(pendingPhoneCookie, "+19195550123"); values.set(pendingModeCookie, "signup"); values.set(pendingOwnerNameCookie, "Danny");
    query.maybeSingle.mockResolvedValue({ data: { id: "workspace-1" }, error: null });
    await expect(verifyPhoneOtpAction(form({ token: "123456" }))).rejects.toThrow("redirect:/dashboard");
    expect(query.insert).not.toHaveBeenCalled(); expect(query.upsert).not.toHaveBeenCalled();
  });

  it("redirects chat customers away from voice onboarding before phone, consent, or provisioning work", async () => {
    query.single.mockResolvedValue({ data: { id: "chat-workspace", slug: "chat-workspace", product_mode: "website_chat" }, error: null });
    const from = vi.fn().mockReturnValue(query);
    mocks.getAdmin.mockReturnValue({ from });
    await expect(completeOnboardingAction(form({ client_id: "another-workspace" }))).rejects.toThrow("redirect:/dashboard/settings?welcome=1");
    expect(query.eq).toHaveBeenCalledWith("user_id", "user-1");
    expect(from.mock.calls.map(([table]) => table)).toEqual(["clients"]);
    expect(query.update).not.toHaveBeenCalled();
    expect(query.insert).not.toHaveBeenCalled();
    expect(query.upsert).not.toHaveBeenCalled();
    expect(mocks.ensureAgent).not.toHaveBeenCalled();
    expect(mocks.provisionAgents).not.toHaveBeenCalled();
  });
});
