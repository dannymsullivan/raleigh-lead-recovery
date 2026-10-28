import { beforeEach, describe, expect, it, vi } from "vitest";
import { customerChatPrompt, customerKnowledgeHash, parseCustomerCompletion, rejectDemoChatResources } from "@/lib/customer-chat-config";
import demoResources from "../config/demo-retell.json";

const mocks = vi.hoisted(() => ({ rpc: vi.fn(), getRetell: vi.fn(), create: vi.fn(), complete: vi.fn() }));
vi.mock("@/lib/supabase-server", () => ({ getSupabaseAdmin: () => ({ rpc: mocks.rpc }) }));
vi.mock("@/lib/retell", () => ({ getRetellClient: mocks.getRetell }));
import { answerCustomerChat } from "@/lib/customer-chat-server";

const knowledge = [{ id: "tenant-hours", title: "Hours", content: "Open weekdays.", keywords: "hours" }];
const input = { clientId: "tenant-a", businessName: "A Repairs", knowledge, message: "Hours?", sessionToken: "a".repeat(64), ip: "127.0.0.1" };

describe("customer knowledge boundaries", () => {
  it("uses only this tenant's published sources and never trusts provider links or unknown IDs", () => {
    const answer = parseCustomerCompletion({ messages: [{ role: "agent", content: "**Open weekdays.** [Details](https://untrusted.example)\nSOURCES: tenant-hours,foreign-price,secret" }] }, [...knowledge, { id: "secret", title: "Draft", content: "Unpublished", keywords: "", published: false }]);
    expect(answer.content).toBe("Open weekdays. Details");
    expect(answer.sources?.map(item => item.id)).toEqual(["tenant-hours"]);
    expect(JSON.stringify(answer)).not.toContain("untrusted.example");
  });
  it("hashes business identity and approved facts deterministically and excludes drafts", () => {
    const extra = { id: "second", title: "Fee", content: "$10", keywords: "price" };
    expect(customerKnowledgeHash("A", [...knowledge, extra])).toBe(customerKnowledgeHash("A", [extra, ...knowledge]));
    expect(customerKnowledgeHash("A", knowledge)).not.toBe(customerKnowledgeHash("B", knowledge));
    expect(customerKnowledgeHash("A", knowledge)).not.toBe(customerKnowledgeHash("A", [{ ...knowledge[0], content: "Closed" }]));
    expect(customerKnowledgeHash("A", knowledge)).toBe(customerKnowledgeHash("A", [...knowledge, { ...extra, published: false }]));
  });
  it.each([
    { agentId: demoResources.chatAgentId }, { knowledgeBaseId: demoResources.knowledgeBaseId }, { llmId: demoResources.chatLlmId },
  ])("rejects public demo resources: %j", value => expect(() => rejectDemoChatResources(value)).toThrow("public demo"));
  it("does not tell a customer assistant to pretend actions succeeded or collect contact details", () => {
    const prompt = customerChatPrompt("A Repairs");
    expect(prompt).toContain("You have no action tools");
    expect(prompt).toContain("Do not request contact details");
    expect(prompt).toContain("Ask the team to follow up");
    expect(prompt).not.toContain("Oak City");
  });
  it("rejects oversized responses instead of cutting off qualifications", () => {
    expect(() => parseCustomerCompletion({ messages: [{ role: "agent", content: "x".repeat(3501) }] }, knowledge)).toThrow("length");
  });
  it("accepts an inline terminal source marker while retaining the tenant allowlist", () => {
    const answer = parseCustomerCompletion({ messages: [{ role: "agent", content: "Open weekdays. SOURCES: tenant-hours,foreign" }] }, knowledge);
    expect(answer.content).toBe("Open weekdays.");
    expect(answer.sources?.map(source => source.id)).toEqual(["tenant-hours"]);
  });
});

describe("paid customer chat turns", () => {
  beforeEach(() => {
    vi.clearAllMocks(); vi.stubEnv("CHAT_SESSION_SECRET", "secret"); vi.stubEnv("RETELL_API_KEY", "test-key");
    mocks.getRetell.mockReturnValue({ chat: { create: mocks.create, createChatCompletion: mocks.complete } });
    mocks.create.mockResolvedValue({ chat_id: "provider-a" });
    mocks.complete.mockResolvedValue({ messages: [{ role: "agent", content: "Open weekdays.\nSOURCES: tenant-hours,other-business" }] });
    mocks.rpc.mockImplementation((name: string) => Promise.resolve({ data: name === "claim_customer_chat_turn" ? { chat_id: null, agent_id: "agent-a", agent_version: 2, llm_id: "llm-a", knowledge_base_id: "kb-a" } : true, error: null }));
  });
  it("claims the resolved tenant before paid calls, uses its pinned version, and saves the answer once", async () => {
    const answer = await answerCustomerChat(input);
    expect(mocks.rpc.mock.calls[0][0]).toBe("claim_customer_chat_turn");
    expect(mocks.rpc).toHaveBeenCalledWith("claim_customer_chat_turn", expect.objectContaining({ p_client_id: "tenant-a", p_knowledge_hash: customerKnowledgeHash(input.businessName, knowledge), p_token_hash: expect.stringMatching(/^[a-f0-9]{64}$/) }));
    expect(mocks.create).toHaveBeenCalledWith({ agent_id: "agent-a", agent_version: 2 }, { timeout: 20_000, maxRetries: 0 });
    expect(mocks.complete).toHaveBeenCalledWith({ chat_id: "provider-a", content: "Hours?" }, { timeout: 20_000, maxRetries: 0 });
    expect(mocks.rpc).toHaveBeenCalledWith("finish_customer_chat_turn", expect.objectContaining({ p_client_id: "tenant-a", p_success: true, p_user: "Hours?", p_answer: "Open weekdays.", p_source: "Hours" }));
    expect(answer.sources).toHaveLength(1);
  });
  it.each(["chat_session_expired", "chat_session_restart", "chat_session_busy", "chat_rate_limit_business", "chat_ai_not_ready", "chat_disabled"])("does not contact Retell when pre-call validation rejects %s", async error => {
    mocks.rpc.mockResolvedValue({ error: { message: error } });
    await expect(answerCustomerChat(input)).rejects.toThrow();
    expect(mocks.getRetell).not.toHaveBeenCalled();
  });
  it("preserves provider history within the exact existing customer session", async () => {
    mocks.rpc.mockImplementation((name: string) => Promise.resolve({ data: name === "claim_customer_chat_turn" ? { chat_id: "existing-a", agent_id: "agent-a", agent_version: 2 } : true, error: null }));
    await answerCustomerChat(input);
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.complete.mock.calls[0][0].chat_id).toBe("existing-a");
  });
  it("rejects a demo resource returned by corrupted configuration without calling the provider", async () => {
    mocks.rpc.mockImplementation((name: string) => Promise.resolve({ data: name === "claim_customer_chat_turn" ? { chat_id: null, agent_id: demoResources.chatAgentId, agent_version: 0 } : true }));
    await expect(answerCustomerChat(input)).rejects.toThrow();
    expect(mocks.getRetell).not.toHaveBeenCalled();
    expect(mocks.rpc).toHaveBeenCalledWith("finish_customer_chat_turn", expect.objectContaining({ p_success: false }));
  });
  it("does not send a question if provider chat attachment cannot be saved", async () => {
    mocks.rpc.mockImplementation((name: string) => Promise.resolve({ data: name === "claim_customer_chat_turn" ? { chat_id: null, agent_id: "a", agent_version: 1 } : name !== "attach_customer_chat" }));
    await expect(answerCustomerChat(input)).rejects.toMatchObject({ status: 503, resetSession: true });
    expect(mocks.complete).not.toHaveBeenCalled();
  });
  it("fails the claimed attempt and requires a new conversation after uncertain provider failure", async () => {
    mocks.complete.mockRejectedValue(new Error("private provider credential"));
    await expect(answerCustomerChat(input)).rejects.toMatchObject({ status: 503, resetSession: true, sessionToken: input.sessionToken });
    expect(mocks.rpc).toHaveBeenCalledWith("finish_customer_chat_turn", expect.objectContaining({ p_success: false }));
  });
  it("never returns an answer whose transcript save or revision check failed", async () => {
    mocks.rpc.mockImplementation((name: string) => Promise.resolve({ data: name === "claim_customer_chat_turn" ? { chat_id: "a", agent_id: "a", agent_version: 1 } : name !== "finish_customer_chat_turn" }));
    await expect(answerCustomerChat(input)).rejects.toMatchObject({ status: 503, resetSession: true });
  });
});
