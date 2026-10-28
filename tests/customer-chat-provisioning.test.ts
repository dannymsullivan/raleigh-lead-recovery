import { beforeEach, describe, expect, it, vi } from "vitest";
import type Retell from "retell-sdk";
import type { SupabaseClient } from "@supabase/supabase-js";
import { syncCustomerChat } from "@/lib/customer-chat-provisioning";
import { customerChatAgentName, customerChatKnowledgeName, customerKnowledgeSourceTitle } from "@/lib/customer-chat-config";
import demoResources from "../config/demo-retell.json";

const clientId = "00000000-0000-0000-0000-000000000042";
const entry = { id: "source-42", title: "Hours", content: "Weekdays", keywords: "hours", published: true };
const options = { clientId, monthlyLimit: 1000, dailyLimit: 100 };

function fixture() {
  const config: Record<string, unknown> = {};
  let kbSources = [{ type: "text", source_id: "source-provider-42", title: customerKnowledgeSourceTitle(entry), content_url: "unused" }];
  const updates: Record<string, unknown>[] = [];
  const rpc = vi.fn(async (name: string) => ({ data: name === "begin_customer_chat_sync" ? 1 : true, error: null }));
  const from = vi.fn((table: string) => {
    let changes: Record<string, unknown> | undefined;
    const data = () => table === "clients" ? { id: clientId, business_name: "Test Repair", services: [], business_hours: {}, timezone: "America/New_York" }
      : table === "website_chat_settings" ? { use_business_profile: false, knowledge_revision: 1 } : table === "website_chat_agents" ? config : [entry];
    const q: Record<string, unknown> = {};
    for (const key of ["select", "eq", "gt"]) q[key] = vi.fn(() => q);
    q.update = vi.fn((values: Record<string, unknown>) => { changes = values; updates.push(values); Object.assign(config, values); return q; });
    q.single = vi.fn(async () => ({ data: data(), error: null }));
    q.limit = vi.fn(async () => ({ data: data(), error: null }));
    q.maybeSingle = vi.fn(async () => ({ data: { client_id: clientId, ...changes }, error: null }));
    q.then = (resolve: (value: unknown) => void) => resolve({ data: null, error: null });
    return q;
  });
  const retell = {
    knowledgeBase: {
      list: vi.fn(async () => []),
      create: vi.fn(async (payload: Record<string, unknown>) => { void payload; return { knowledge_base_id: "kb-42", status: "complete" }; }),
      retrieve: vi.fn(async () => ({ knowledge_base_id: "kb-42", knowledge_base_name: customerChatKnowledgeName(clientId), status: "complete", knowledge_base_sources: kbSources })),
      addSources: vi.fn(async (_id: string, body: { knowledge_base_texts: { title: string }[] }) => { kbSources.push(...body.knowledge_base_texts.map((source, index) => ({ type: "text", title: source.title, source_id: `new-${index}`, content_url: "unused" }))); }),
      deleteSource: vi.fn(async (sourceId: string) => { kbSources = kbSources.filter(source => source.source_id !== sourceId); }),
    },
    llm: { create: vi.fn(async (payload: Record<string, unknown>) => { void payload; return { llm_id: "llm-42" }; }), update: vi.fn(async () => ({ llm_id: "llm-42", version: 2 })) },
    chatAgent: {
      create: vi.fn(async (payload: Record<string, unknown>) => { void payload; return { agent_id: "agent-42", version: 0 }; }),
      retrieve: vi.fn(async () => ({ agent_name: customerChatAgentName(clientId), version: 1, response_engine: { type: "retell-llm", llm_id: "llm-42", version: 1 } })),
      createVersion: vi.fn(async () => ({ version: 2, response_engine: { type: "retell-llm", llm_id: "llm-42", version: 2 } })),
      update: vi.fn(async () => ({ version: 2 })),
      publish: vi.fn(async () => undefined),
    },
  };
  const run = (override = options) => syncCustomerChat({ from, rpc } as unknown as SupabaseClient, retell as unknown as Retell, override);
  return { config, updates, rpc, from, retell, run, setSources: (sources: typeof kbSources) => { kbSources = sources; } };
}

describe("explicit isolated customer provisioning", () => {
  beforeEach(() => { vi.clearAllMocks(); });
  it("requires an explicit valid tenant and bounded allowances before any mutation", async () => {
    const f = fixture();
    await expect(f.run({ ...options, monthlyLimit: 0 })).rejects.toThrow("allowances");
    expect(f.rpc).not.toHaveBeenCalled();
  });
  it("creates only approved tenant sources and an action-free dedicated agent before activation", async () => {
    const f = fixture();
    const result = await f.run();
    expect(result.status).toBe("ready");
    expect(f.retell.knowledgeBase.create.mock.calls[0][0]).toMatchObject({ knowledge_base_name: customerChatKnowledgeName(clientId) });
    const payload = f.retell.llm.create.mock.calls[0][0];
    expect(payload).toMatchObject({ knowledge_base_ids: ["kb-42"], general_tools: [], states: null, mcps: [] });
    expect(JSON.stringify(payload)).not.toContain("Oak City");
    expect(f.retell.chatAgent.create.mock.calls[0][0]).toMatchObject({ agent_name: customerChatAgentName(clientId), data_storage_retention_days: 7, contact_memory_config: { enable_read: false, enable_update: false } });
    expect(f.rpc).toHaveBeenCalledWith("activate_customer_chat", expect.objectContaining({ p_client_id: clientId, p_revision: 1, p_agent_version: 0 }));
    expect(customerChatKnowledgeName(clientId).length).toBeLessThan(40);
  });
  it("resumes a saved KB and agent without creating another billable KB", async () => {
    const f = fixture(); Object.assign(f.config, { retell_knowledge_base_id: "kb-42", retell_agent_id: "agent-42", retell_llm_id: "llm-42" });
    await f.run();
    expect(f.retell.knowledgeBase.create).not.toHaveBeenCalled();
    expect(f.retell.knowledgeBase.addSources).not.toHaveBeenCalled();
    expect(f.retell.chatAgent.create).not.toHaveBeenCalled();
    expect(f.retell.chatAgent.createVersion).toHaveBeenCalledWith("agent-42", { base_version: 1 });
  });
  it("reconciles changed source text inside the existing owned KB, then publishes", async () => {
    const f = fixture(); Object.assign(f.config, { retell_knowledge_base_id: "kb-42", retell_agent_id: "agent-42", retell_llm_id: "llm-42" });
    f.setSources([{ type: "text", source_id: "old-source", title: customerKnowledgeSourceTitle({ ...entry, content: "Outdated hours" }), content_url: "unused" }]);
    await f.run();
    expect(f.retell.knowledgeBase.create).not.toHaveBeenCalled();
    expect(f.retell.knowledgeBase.deleteSource).toHaveBeenCalledWith("old-source", { knowledge_base_id: "kb-42" });
    expect(f.retell.knowledgeBase.addSources).toHaveBeenCalledWith("kb-42", { knowledge_base_texts: [{ title: customerKnowledgeSourceTitle(entry), text: `SOURCE_ID: ${entry.id}\nTITLE: Hours\nWeekdays` }] });
  });
  it("leaves incomplete indexing unactivated and retains the allocated KB for retry", async () => {
    const f = fixture(); f.retell.knowledgeBase.retrieve.mockResolvedValue({ knowledge_base_id: "kb-42", knowledge_base_name: customerChatKnowledgeName(clientId), status: "in_progress", knowledge_base_sources: [] });
    await expect(f.run()).rejects.toThrow("indexing");
    expect(f.config.retell_knowledge_base_id).toBe("kb-42");
    expect(f.retell.chatAgent.create).not.toHaveBeenCalled();
    expect(f.rpc.mock.calls.some(([name]) => name === "activate_customer_chat")).toBe(false);
  });
  it("refuses a different tenant's provider agent before mutating any provider resource", async () => {
    const f = fixture(); Object.assign(f.config, { retell_agent_id: "foreign-agent", retell_llm_id: "llm-42" });
    f.retell.chatAgent.retrieve.mockResolvedValue({ agent_name: "Another business", version: 0, response_engine: { type: "retell-llm", llm_id: "llm-42", version: 0 } });
    await expect(f.run()).rejects.toThrow("unrelated");
    expect(f.retell.knowledgeBase.create).not.toHaveBeenCalled();
    expect(f.retell.llm.update).not.toHaveBeenCalled();
  });
  it("refuses demo resources before any provider call", async () => {
    const f = fixture(); f.config.retell_knowledge_base_id = demoResources.knowledgeBaseId;
    await expect(f.run()).rejects.toThrow("public demo");
    expect(f.retell.knowledgeBase.retrieve).not.toHaveBeenCalled();
  });
  it("does not overwrite a manually added source in a dedicated KB", async () => {
    const f = fixture(); f.config.retell_knowledge_base_id = "kb-42";
    f.setSources([{ type: "text", source_id: "manual", title: "Manual notes", content_url: "unused" }]);
    await expect(f.run()).rejects.toThrow("manually managed");
    expect(f.retell.knowledgeBase.deleteSource).not.toHaveBeenCalled();
  });
  it("rejects a knowledge revision changed before activation", async () => {
    const f = fixture(); f.rpc.mockImplementation(async (name: string) => ({ data: name === "begin_customer_chat_sync" ? 1 : false, error: null }));
    await expect(f.run()).rejects.toThrow("changed during sync");
    expect(f.config.status).toBe("error");
  });
});
