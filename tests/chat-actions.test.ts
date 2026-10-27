import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireWorkspace, requireAdmin, getAdmin, revalidate, redirect } = vi.hoisted(() => ({
  requireWorkspace: vi.fn(), requireAdmin: vi.fn(), getAdmin: vi.fn(), revalidate: vi.fn(),
  redirect: vi.fn((path: string) => { throw new Error(`redirect:${path}`); })
}));
vi.mock("@/lib/customer-workspace", () => ({ requireCustomerWorkspace: requireWorkspace, requireAdminWorkspace: requireAdmin }));
vi.mock("@/lib/supabase-server", () => ({ getSupabaseAdmin: getAdmin }));
vi.mock("next/cache", () => ({ revalidatePath: revalidate }));
vi.mock("next/navigation", () => ({ redirect }));
import { saveAdminKnowledge, saveKnowledge, toggleChat } from "@/app/dashboard/knowledge-base/actions";
import { updateChatLead } from "@/app/dashboard/chats/actions";

describe("customer chat management authorization", () => {
  const id = "00000000-0000-0000-0000-000000000001";
  const query = { update: vi.fn(), eq: vi.fn(), select: vi.fn(), not: vi.fn(), maybeSingle: vi.fn() };
  beforeEach(() => {
    vi.clearAllMocks();
    requireWorkspace.mockResolvedValue({ id: "authenticated-workspace" });
    query.update.mockReturnValue(query); query.eq.mockReturnValue(query); query.select.mockReturnValue(query); query.not.mockReturnValue(query);
    query.maybeSingle.mockResolvedValue({ data: { id }, error: null });
    getAdmin.mockReturnValue({ from: vi.fn().mockReturnValue(query) });
  });
  it("requires admin authorization before editing customer knowledge", async () => {
    requireAdmin.mockRejectedValue(new Error("admin session required"));
    await expect(saveAdminKnowledge("another-client", new FormData())).rejects.toThrow("admin session required");
    expect(getAdmin).not.toHaveBeenCalled();
  });
  it("requires authentication before touching a knowledge entry", async () => {
    requireWorkspace.mockRejectedValue(new Error("not authenticated"));
    await expect(saveKnowledge(new FormData())).rejects.toThrow("not authenticated");
    expect(getAdmin).not.toHaveBeenCalled();
  });
  it("scopes knowledge edits to the authenticated workspace, ignoring submitted tenant IDs", async () => {
    const form = new FormData();
    Object.entries({ id, client_id: "someone-else", title: "Hours", content: "Weekdays.", keywords: "hours", published: "on" }).forEach(([key, value]) => form.set(key, value));
    await expect(saveKnowledge(form)).rejects.toThrow("redirect:/dashboard/knowledge-base?knowledge_saved=1");
    expect(query.eq).toHaveBeenCalledWith("id", id);
    expect(query.eq).toHaveBeenCalledWith("client_id", "authenticated-workspace");
    expect(query.update).toHaveBeenCalledWith(expect.objectContaining({ published: true, content: "Weekdays." }));
  });
  it("scopes lead outcomes to the authenticated workspace and captured leads", async () => {
    const form = new FormData();
    Object.entries({ id, client_id: "someone-else", status: "booked", booked_value: "500" }).forEach(([key, value]) => form.set(key, value));
    await expect(updateChatLead(form)).rejects.toThrow("redirect:/dashboard/chats?saved=1");
    expect(query.eq).toHaveBeenCalledWith("client_id", "authenticated-workspace");
    expect(query.not).toHaveBeenCalledWith("lead_captured_at", "is", null);
    expect(query.update).toHaveBeenCalledWith({ lead_status: "booked", booked_value: 500 });
  });
  it("rejects negative booked values before writing", async () => {
    const form = new FormData(); form.set("id", id); form.set("status", "booked"); form.set("booked_value", "-1");
    await expect(updateChatLead(form)).rejects.toThrow("redirect:/dashboard/chats?error=validation");
    expect(getAdmin).not.toHaveBeenCalled();
  });
  it("does not report success when a scoped update matches no row", async () => {
    query.maybeSingle.mockResolvedValue({ data: null, error: null });
    const form = new FormData(); form.set("id", id); form.set("status", "contacted");
    await expect(updateChatLead(form)).rejects.toThrow("redirect:/dashboard/chats?error=save");
    expect(revalidate).not.toHaveBeenCalled();
  });
});


describe("website chat activation", () => {
  const knowledge = { select: vi.fn(), eq: vi.fn() };
  const upsert = vi.fn();
  const from = vi.fn();
  function form(enabled = true, profile = false) {
    const data = new FormData();
    if (enabled) data.set("enabled", "on");
    if (profile) data.set("use_business_profile", "on");
    data.set("client_id", "untrusted-tenant");
    return data;
  }
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("CHAT_SESSION_SECRET", "session-secret");
    vi.stubEnv("DEMO_CALL_HASH_SECRET", "");
    requireWorkspace.mockResolvedValue({ id: "authenticated-workspace", business_name: "Repairs", services: [], business_hours: {} });
    knowledge.select.mockReturnValue(knowledge);
    knowledge.eq.mockReset().mockReturnValueOnce(knowledge).mockResolvedValue({ count: 0, error: null });
    upsert.mockResolvedValue({ error: null });
    from.mockImplementation((table: string) => table === "website_knowledge" ? knowledge : { upsert });
    getAdmin.mockReturnValue({ from });
  });
  it("requires authentication before activating chat", async () => {
    requireWorkspace.mockRejectedValue(new Error("not authenticated"));
    await expect(toggleChat(form())).rejects.toThrow("not authenticated");
    expect(getAdmin).not.toHaveBeenCalled();
  });
  it("requires a configured session secret before enabling chat", async () => {
    vi.stubEnv("CHAT_SESSION_SECRET", " ");
    await expect(toggleChat(form())).rejects.toThrow("knowledge_error=configuration");
    expect(from).not.toHaveBeenCalled();
    expect(upsert).not.toHaveBeenCalled();
  });
  it("does not enable an empty knowledge base, even with an empty profile selected", async () => {
    await expect(toggleChat(form(true, true))).rejects.toThrow("knowledge_error=knowledge");
    expect(upsert).not.toHaveBeenCalled();
  });
  it("only counts published entries belonging to the authenticated workspace", async () => {
    knowledge.eq.mockReset().mockReturnValueOnce(knowledge).mockResolvedValue({ count: 1, error: null });
    await expect(toggleChat(form())).rejects.toThrow("knowledge_saved=1");
    expect(knowledge.eq).toHaveBeenCalledWith("client_id", "authenticated-workspace");
    expect(knowledge.eq).toHaveBeenCalledWith("published", true);
    expect(upsert).toHaveBeenCalledWith(expect.objectContaining({ client_id: "authenticated-workspace", enabled: true, use_business_profile: false }));
  });
  it.each([true, false])("uses existing business facts only when profile sharing is %s", async (profile) => {
    requireWorkspace.mockResolvedValue({ id: "authenticated-workspace", business_name: "Repairs", services: ["Plumbing"] });
    await expect(toggleChat(form(true, profile))).rejects.toThrow(profile ? "knowledge_saved=1" : "knowledge_error=knowledge");
    if (profile) expect(upsert).toHaveBeenCalledWith(expect.objectContaining({ enabled: true, use_business_profile: true }));
    else expect(upsert).not.toHaveBeenCalled();
  });
  it("can pause chat without a session secret or knowledge query", async () => {
    vi.stubEnv("CHAT_SESSION_SECRET", "");
    await expect(toggleChat(form(false))).rejects.toThrow("knowledge_saved=1");
    expect(knowledge.select).not.toHaveBeenCalled();
    expect(upsert).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }));
  });
  it("fails closed when the published knowledge query fails", async () => {
    knowledge.eq.mockReset().mockReturnValueOnce(knowledge).mockResolvedValue({ count: null, error: { message: "offline" } });
    requireWorkspace.mockResolvedValue({ id: "authenticated-workspace", business_name: "Repairs", services: ["Plumbing"] });
    await expect(toggleChat(form(true, true))).rejects.toThrow("knowledge_error=knowledge");
    expect(upsert).not.toHaveBeenCalled();
  });
  it("does not report success if saving chat settings fails", async () => {
    upsert.mockResolvedValue({ error: { message: "offline" } });
    await expect(toggleChat(form(false))).rejects.toThrow("knowledge_error=save");
    expect(revalidate).not.toHaveBeenCalled();
  });
});
