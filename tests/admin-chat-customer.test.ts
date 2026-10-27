import { beforeEach, describe, expect, it, vi } from "vitest";

const { getAdmin, ensureAgent, provisionAgent, after, cookieStore } = vi.hoisted(() => ({ getAdmin: vi.fn(), ensureAgent: vi.fn(), provisionAgent: vi.fn(), after: vi.fn(), cookieStore: { get: vi.fn(), set: vi.fn() } }));
vi.mock("@/lib/supabase-server", () => ({ getSupabaseAdmin: getAdmin }));
vi.mock("@/lib/customer-agent-provisioning", () => ({ ensureDefaultCustomerAgent: ensureAgent, provisionCustomerAgent: provisionAgent }));
vi.mock("@/lib/customer-slug", () => ({ uniqueCustomerSlug: vi.fn().mockResolvedValue("example-hvac") }));
vi.mock("@/lib/admin", () => ({ adminCookie: { name: "admin_session" }, verifyAdminSessionToken: vi.fn().mockReturnValue(true), verifyAdminPassword: vi.fn(), createAdminSessionToken: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: vi.fn().mockResolvedValue(cookieStore) }));
vi.mock("next/server", () => ({ after }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error(`redirect:${path}`); } }));
import { addClientAction } from "@/app/actions";

describe("chat uses the existing customer creation flow", () => {
  const insert = vi.fn();
  const tables = vi.fn();
  beforeEach(() => {
    vi.clearAllMocks();
    const builder = { insert, select: vi.fn(), single: vi.fn().mockResolvedValue({ data: { id: "client-1" }, error: null }), update: vi.fn(), eq: vi.fn(), is: vi.fn(), then: (resolve: (result: unknown) => unknown) => Promise.resolve({ error: null }).then(resolve) };
    insert.mockReturnValue(builder); builder.select.mockReturnValue(builder); builder.update.mockReturnValue(builder); builder.eq.mockReturnValue(builder); builder.is.mockReturnValue(builder);
    tables.mockReturnValue(builder); getAdmin.mockReturnValue({ from: tables }); ensureAgent.mockResolvedValue({ id: "agent-1" });
  });
  function form(mode: string) {
    const data = new FormData();
    Object.entries({ product_mode: mode, business_name: "Example HVAC", trade: "hvac", owner_name: "Example Owner", owner_phone: "9195550123", pilot_start: "2026-10-27" }).forEach(([key, value]) => data.set(key, value));
    return data;
  }
  it("creates a chat customer and invitation without a Retell agent or recovery campaign", async () => {
    await expect(addClientAction(form("website_chat"))).rejects.toThrow("redirect:/admin/customers/example-hvac?created=1#customer-access");
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ product_mode: "website_chat", pilot_end: "2026-11-10" }));
    expect(tables).toHaveBeenCalledWith("customer_workspace_invitations");
    expect(tables).not.toHaveBeenCalledWith("reactivation_campaigns");
    expect(ensureAgent).not.toHaveBeenCalled();
    expect(after).not.toHaveBeenCalled();
    expect(cookieStore.set).toHaveBeenCalled();
  });
  it("preserves the existing voice and recovery setup when selected", async () => {
    await expect(addClientAction(form("reactivation"))).rejects.toThrow("redirect:/admin/customers/example-hvac?created=1#customer-access");
    expect(ensureAgent).toHaveBeenCalledWith("client-1", "lead_reactivation");
    expect(ensureAgent).toHaveBeenCalledWith("client-1", "receptionist");
    expect(tables).toHaveBeenCalledWith("reactivation_campaigns");
    expect(after).toHaveBeenCalledOnce();
  });
});
