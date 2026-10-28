import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ customer: vi.fn(), admin: vi.fn(), db: vi.fn(), process: vi.fn(), revalidate: vi.fn() }));
vi.mock("@/lib/customer-workspace", () => ({ requireCustomerWorkspace: mocks.customer, requireAdminWorkspace: mocks.admin }));
vi.mock("@/lib/supabase-server", () => ({ getSupabaseAdmin: mocks.db }));
vi.mock("@/lib/chat-lead-notifications", async importOriginal => ({ ...await importOriginal<typeof import("@/lib/chat-lead-notifications")>(), processChatLeadNotification: mocks.process }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error(`redirect:${path}`); } }));
import { saveChatNotifications, saveAdminChatNotifications, retryChatNotification, retryAdminChatNotification } from "@/app/dashboard/notifications/actions";

describe("website lead alert destination authorization", () => {
  const upsert = vi.fn();
  const form = (override: Record<string, string> = {}) => { const value = new FormData(); Object.entries({ enabled: "on", destination_email: "Team@Example.com", destination_label: "Dispatch", recipient_consent: "on", client_id: "forged", ...override }).forEach(([k,v]) => value.set(k,v)); return value; };
  beforeEach(() => {
    vi.clearAllMocks(); mocks.customer.mockResolvedValue({ id: "owned-client" }); mocks.admin.mockResolvedValue({ id: "admin-client" });
    upsert.mockResolvedValue({ error: null }); mocks.db.mockReturnValue({ from: vi.fn().mockReturnValue({ upsert }) }); mocks.process.mockResolvedValue(undefined);
  });
  it("uses the authenticated customer and records explicit destination permission", async () => {
    await expect(saveChatNotifications(form())).rejects.toThrow("redirect:/dashboard/notifications?saved=1");
    expect(upsert).toHaveBeenCalledWith(expect.objectContaining({ client_id: "owned-client", destination_email: "team@example.com", consented_at: expect.any(String), configured_by: "customer", enabled: true }));
    expect(mocks.process).not.toHaveBeenCalled();
  });
  it.each<Record<string, string>>([{ recipient_consent: "" }, { destination_email: "a@x.com,b@x.com" }, { destination_label: "x".repeat(81) }])("rejects missing consent or invalid destinations: %j", async values => {
    await expect(saveChatNotifications(form(values))).rejects.toThrow("error=validation"); expect(upsert).not.toHaveBeenCalled();
  });
  it("can pause alerts without granting recipient permission", async () => {
    await expect(saveChatNotifications(form({ enabled: "", recipient_consent: "" }))).rejects.toThrow("saved=1");
    expect(upsert).toHaveBeenCalledWith(expect.objectContaining({ enabled: false, consented_at: null }));
  });
  it("requires a valid admin session before configuring any customer's destination", async () => {
    mocks.admin.mockRejectedValue(new Error("unauthorized"));
    await expect(saveAdminChatNotifications("other-client", form())).rejects.toThrow("unauthorized");
    expect(mocks.db).not.toHaveBeenCalled();
  });
  it("never reports saving success when the database write fails", async () => {
    upsert.mockResolvedValue({ error: { message: "offline" } });
    await expect(saveChatNotifications(form())).rejects.toThrow("error=save");
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });
  it("scopes manual retries to the signed-in customer regardless of submitted client id", async () => {
    const chatId = "00000000-0000-0000-0000-000000000001";
    await expect(retryChatNotification(form({ chat_id: chatId }))).rejects.toThrow("checked=1");
    expect(mocks.process).toHaveBeenCalledWith({ clientId: "owned-client", chatId });
  });
  it("requires admin authorization before manual retry", async () => {
    mocks.admin.mockRejectedValue(new Error("unauthorized"));
    await expect(retryAdminChatNotification("other-client", form())).rejects.toThrow("unauthorized");
    expect(mocks.process).not.toHaveBeenCalled();
  });
});
