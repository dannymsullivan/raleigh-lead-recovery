import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ requireWorkspace: vi.fn(), getAdmin: vi.fn(), revalidate: vi.fn() }));
vi.mock("@/lib/customer-workspace", () => ({ requireCustomerWorkspace: mocks.requireWorkspace, requireAdminWorkspace: vi.fn() }));
vi.mock("@/lib/supabase-server", () => ({ getSupabaseAdmin: mocks.getAdmin }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error(`redirect:${path}`); } }));
import { toggleChat } from "@/app/dashboard/knowledge-base/actions";

describe("publishing a customer chatbot", () => {
  const query = { select: vi.fn(), eq: vi.fn(), upsert: vi.fn() };
  beforeEach(() => {
    vi.clearAllMocks(); vi.stubEnv("CHAT_SESSION_SECRET", "test-secret"); vi.stubEnv("DEMO_CALL_HASH_SECRET", "");
    mocks.requireWorkspace.mockResolvedValue({ id: "owner-workspace", business_name: "Example", services: [] });
    mocks.getAdmin.mockReturnValue({ from: vi.fn().mockReturnValue(query) });
    query.select.mockReturnValue(query);
    query.eq.mockImplementation((key: string) => key === "published" ? Promise.resolve({ count: 0, error: null }) : query);
    query.upsert.mockResolvedValue({ error: null });
  });
  function settings(profile = false, enabled = true) {
    const form = new FormData(); form.set("client_id", "forged-workspace");
    if (enabled) form.set("enabled", "on"); if (profile) form.set("use_business_profile", "on");
    return form;
  }
  it("refuses to enable chat without the server session secret", async () => {
    vi.stubEnv("CHAT_SESSION_SECRET", "");
    await expect(toggleChat(settings())).rejects.toThrow("knowledge_error=configuration");
    expect(query.upsert).not.toHaveBeenCalled();
  });
  it("refuses to enable a bot that has no approved answers", async () => {
    await expect(toggleChat(settings())).rejects.toThrow("knowledge_error=knowledge");
    expect(query.upsert).not.toHaveBeenCalled();
  });
  it("allows approved profile knowledge and binds settings to the signed-in customer", async () => {
    mocks.requireWorkspace.mockResolvedValue({ id: "owner-workspace", business_name: "Example", services: ["Plumbing"] });
    await expect(toggleChat(settings(true))).rejects.toThrow("knowledge_saved=1");
    expect(query.upsert).toHaveBeenCalledWith(expect.objectContaining({ client_id: "owner-workspace", enabled: true, use_business_profile: true }));
  });
  it("allows a customer to pause their bot even when no knowledge or secret remains", async () => {
    vi.stubEnv("CHAT_SESSION_SECRET", "");
    await expect(toggleChat(settings(false, false))).rejects.toThrow("knowledge_saved=1");
    expect(query.upsert).toHaveBeenCalledWith(expect.objectContaining({ client_id: "owner-workspace", enabled: false }));
  });
});
