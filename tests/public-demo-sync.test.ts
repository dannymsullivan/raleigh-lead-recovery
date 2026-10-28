import { createHash } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { demoKnowledge } from "@/lib/demo-knowledge";
import { demoChatAgentName, demoChatPrompt } from "@/lib/demo-agent-config";
import { publicDemoAgentName, publicDemoBeginMessage, publicDemoPrompt } from "@/lib/public-demo-agent-config";

const mocks = vi.hoisted(() => ({
  agentRetrieve: vi.fn(), agentCreateVersion: vi.fn(), agentUpdate: vi.fn(), agentPublish: vi.fn(),
  llmRetrieve: vi.fn(), llmUpdate: vi.fn(), chatRetrieve: vi.fn(),
  knowledgeRetrieve: vi.fn(), readFile: vi.fn(), writeFile: vi.fn(), mkdir: vi.fn()
}));

vi.mock("@next/env", () => ({ loadEnvConfig: vi.fn() }));
vi.mock("node:fs/promises", () => ({ readFile: mocks.readFile, writeFile: mocks.writeFile, mkdir: mocks.mkdir }));
vi.mock("retell-sdk", () => ({
  default: class {
    agent = { retrieve: mocks.agentRetrieve, createVersion: mocks.agentCreateVersion, update: mocks.agentUpdate, publish: mocks.agentPublish };
    llm = { retrieve: mocks.llmRetrieve, update: mocks.llmUpdate };
    chatAgent = { retrieve: mocks.chatRetrieve };
    knowledgeBase = { retrieve: mocks.knowledgeRetrieve };
  }
}));

const voice = {
  agent_id: "oak-city-agent", agent_name: publicDemoAgentName, version: 1, voice_id: "voice",
  max_call_duration_ms: 120_000, end_call_after_silence_ms: 30_000,
  response_engine: { type: "retell-llm", llm_id: "voice-llm", version: 1 }
};

describe.each(["legacy", "shared knowledge"] as const)("%s public voice sync", (script) => {
  let completed: ReturnType<typeof vi.spyOn>;
  let failed: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.resetModules();
    vi.resetAllMocks();
    vi.stubEnv("RETELL_API_KEY", "fake-key");
    vi.stubEnv("RETELL_WEB_DEMO_AGENT_ID", "oak-city-agent");
    vi.stubEnv("RETELL_RECEPTIONIST_DEMO_AGENT_ID", "oak-city-agent");
    completed = vi.spyOn(console, "log").mockImplementation(() => undefined);
    failed = vi.spyOn(console, "error").mockImplementation(() => undefined);
    mocks.agentRetrieve.mockResolvedValue(voice);
    mocks.agentCreateVersion.mockResolvedValue({ ...voice, version: 2 });
    mocks.agentUpdate.mockResolvedValue({ ...voice, version: 2 });
    mocks.agentPublish.mockResolvedValue({});
    mocks.llmUpdate.mockResolvedValue({ llm_id: "voice-llm", version: 2 });
    mocks.llmRetrieve.mockImplementation(async (id: string) => id === "chat-llm" ? {
      general_prompt: demoChatPrompt, knowledge_base_ids: ["shared-kb"], kb_config: { top_k: 6, filter_score: 0.4 },
      model_config: { primary: { model: "gpt-4.1" }, temperature: 0.2 }, general_tools: [], states: [], mcps: []
    } : { general_prompt: publicDemoPrompt, begin_message: publicDemoBeginMessage, knowledge_base_ids: ["shared-kb"] });
    mocks.chatRetrieve.mockResolvedValue({
      agent_id: "chat-agent", agent_name: demoChatAgentName, version: 0,
      response_engine: { type: "retell-llm", llm_id: "chat-llm", version: 0 },
      data_storage_retention_days: 7, data_storage_setting: "everything", end_chat_after_silence_ms: 86_400_000,
      contact_memory_config: { enable_read: false, enable_update: false }
    });
    const publishedKnowledge = demoKnowledge.filter((entry) => entry.published !== false);
    mocks.readFile.mockResolvedValue(JSON.stringify({
      knowledgeBaseId: "shared-kb", knowledgeHash: createHash("sha256").update(JSON.stringify(publishedKnowledge)).digest("hex"),
      chatAgentId: "chat-agent", chatLlmId: "chat-llm", chatVersion: 0, voiceAgentId: voice.agent_id, voiceVersion: 1
    }));
    mocks.knowledgeRetrieve.mockResolvedValue({
      status: "complete", knowledge_base_sources: publishedKnowledge.map((entry) => ({ type: "text", title: `${entry.id}: ${entry.title}` }))
    });
  });

  afterEach(() => {
    process.exitCode = undefined;
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  async function runSync() {
    if (script === "legacy") await import("../scripts/sync-public-demo-agent");
    else await import("../scripts/sync-demo-knowledge");
    await vi.waitFor(() => expect(completed.mock.calls.length + failed.mock.calls.length).toBeGreaterThan(0));
  }

  it.each([180_000, 300_000])("corrects a %i-ms published limit even when its prompt and knowledge match", async (duration) => {
    mocks.agentRetrieve.mockResolvedValue({ ...voice, max_call_duration_ms: duration });
    await runSync();
    expect(failed).not.toHaveBeenCalled();
    expect(mocks.agentCreateVersion).toHaveBeenCalledWith("oak-city-agent", { base_version: 1 });
    expect(mocks.agentUpdate).toHaveBeenCalledWith("oak-city-agent", expect.objectContaining({ max_call_duration_ms: 120_000 }));
    expect(mocks.agentUpdate.mock.calls[0][1]).not.toHaveProperty("end_call_after_silence_ms");
    expect(mocks.agentPublish).toHaveBeenCalledWith("oak-city-agent", expect.objectContaining({ version: 2 }));
  });

  it("does not publish a new version when the two-minute limit and content already match", async () => {
    await runSync();
    expect(failed).not.toHaveBeenCalled();
    expect(mocks.agentCreateVersion).not.toHaveBeenCalled();
    expect(mocks.agentUpdate).not.toHaveBeenCalled();
    expect(mocks.agentPublish).not.toHaveBeenCalled();
  });

  it("refuses to modify a different configured voice agent", async () => {
    mocks.agentRetrieve.mockResolvedValue({ ...voice, agent_name: "Customer receptionist", max_call_duration_ms: 300_000 });
    await runSync();
    expect(failed).toHaveBeenCalledWith(expect.stringContaining("Refusing to alter"));
    expect(mocks.agentCreateVersion).not.toHaveBeenCalled();
    expect(mocks.agentUpdate).not.toHaveBeenCalled();
    expect(mocks.agentPublish).not.toHaveBeenCalled();
  });
});
