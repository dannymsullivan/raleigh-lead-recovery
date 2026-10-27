import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getAuth: vi.fn(), getAdmin: vi.fn(), configured: vi.fn(), provision: vi.fn(), after: vi.fn(), revalidate: vi.fn() }));
vi.mock("@/lib/supabase-auth", () => ({ getSupabaseAuth: mocks.getAuth, isSupabaseAuthConfigured: mocks.configured }));
vi.mock("@/lib/supabase-server", () => ({ getSupabaseAdmin: mocks.getAdmin }));
vi.mock("@/lib/customer-agent-provisioning", () => ({ provisionCustomerAgents: mocks.provision }));
vi.mock("next/server", () => ({ after: mocks.after }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error(`redirect:${path}`); } }));
import { saveAssistantSettingsAction } from "@/app/dashboard/actions";

function profile(overrides: Record<string, string> = {}) {
  const form = new FormData();
  for (const [key, value] of Object.entries({ business_name: "Example Repair", services: " Plumbing,\nDrain repair ", timezone: "America/New_York", ...overrides })) form.set(key, value);
  return form;
}

describe("chat-only business settings", () => {
  const getUser = vi.fn();
  const from = vi.fn();
  const lookup = { select: vi.fn(), eq: vi.fn(), maybeSingle: vi.fn(), single: vi.fn() };
  const update = vi.fn();
  const updateEq = vi.fn();
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.configured.mockReturnValue(true);
    mocks.getAuth.mockResolvedValue({ auth: { getUser } });
    getUser.mockResolvedValue({ data: { user: { id: "authenticated-owner" } } });
    lookup.select.mockReturnValue(lookup); lookup.eq.mockReturnValue(lookup);
    lookup.maybeSingle.mockResolvedValue({ data: { id: "owned-chat-workspace" }, error: null });
    lookup.single.mockResolvedValue({ data: { product_mode: "website_chat" }, error: null });
    update.mockReturnValue({ eq: updateEq }); updateEq.mockResolvedValue({ error: null });
    from.mockImplementation((table: string) => {
      if (table !== "clients") throw new Error(`Unexpected non-profile operation: ${table}`);
      return { ...lookup, update };
    });
    mocks.getAdmin.mockReturnValue({ from });
  });

  it("saves chat profile without phone or SMS consent and only modifies the authenticated workspace", async () => {
    await expect(saveAssistantSettingsAction(profile({ client_id: "forged-workspace", user_id: "forged-user", product_mode: "missed_call_recovery" }))).rejects.toThrow("redirect:/dashboard/settings?saved=1");
    expect(lookup.eq).toHaveBeenCalledWith("user_id", "authenticated-owner");
    expect(updateEq).toHaveBeenCalledWith("id", "owned-chat-workspace");
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ business_name: "Example Repair", services: ["Plumbing", "Drain repair"], owner_phone: "Not set", onboarding_completed_at: expect.any(String) }));
    const saved = update.mock.calls[0][0];
    expect(saved).not.toHaveProperty("alert_sms_consent_at");
    expect(saved).not.toHaveProperty("alert_phone");
    expect(saved).not.toHaveProperty("provisioning_status");
    expect(saved).not.toHaveProperty("product_mode");
    expect(from.mock.calls.every(([table]) => table === "clients")).toBe(true);
    expect(mocks.provision).not.toHaveBeenCalled();
    expect(mocks.after).not.toHaveBeenCalled();
    expect(mocks.revalidate).toHaveBeenCalledWith("/dashboard/knowledge-base");
  });

  it("does not trust a submitted chat product mode to bypass voice consent requirements", async () => {
    lookup.single.mockResolvedValue({ data: { product_mode: "missed_call_recovery" }, error: null });
    await expect(saveAssistantSettingsAction(profile({ product_mode: "website_chat", owner_phone: "9195550123" }))).rejects.toThrow("redirect:/dashboard/settings?error=consent");
    expect(update).not.toHaveBeenCalled();
    expect(mocks.provision).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated changes before database access", async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    await expect(saveAssistantSettingsAction(profile())).rejects.toThrow("redirect:/login");
    expect(mocks.getAdmin).not.toHaveBeenCalled();
  });

  it.each<Record<string, string>>([
    { business_name: "" },
    { timezone: "not-a-timezone" },
    { monday_open: "25:99" },
  ])("rejects invalid profile data before updating: %j", async (overrides) => {
    await expect(saveAssistantSettingsAction(profile(overrides))).rejects.toThrow("redirect:/dashboard/settings?error=missing");
    expect(update).not.toHaveBeenCalled();
  });

  it("does not report success or provision agents when a chat profile save fails", async () => {
    updateEq.mockResolvedValue({ error: { message: "database unavailable" } });
    await expect(saveAssistantSettingsAction(profile())).rejects.toThrow("redirect:/dashboard/settings?error=save");
    expect(mocks.revalidate).not.toHaveBeenCalled();
    expect(mocks.after).not.toHaveBeenCalled();
    expect(mocks.provision).not.toHaveBeenCalled();
  });
});
