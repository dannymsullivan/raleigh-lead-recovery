import { loadEnvConfig } from "@next/env";
import { readFile, writeFile } from "node:fs/promises";
import Retell from "retell-sdk";
import { researchAgentName, researchAgentPrompt } from "../lib/research-demo-knowledge";

loadEnvConfig(process.cwd());
const path = "config/research-retell.json";
type Config = { agentId?: string; llmId?: string; version?: number };
async function main() {
  if (!process.env.RETELL_API_KEY) throw new Error("Missing RETELL_API_KEY");
  const retell = new Retell({ apiKey: process.env.RETELL_API_KEY, timeout: 30_000, maxRetries: 0 });
  const config: Config = JSON.parse(await readFile(path, "utf8"));
  const save = () => writeFile(path, JSON.stringify(config, null, 2) + "\n");
  const llmSettings = { general_prompt: researchAgentPrompt, begin_message: "", start_speaker: "user" as const, general_tools: [], states: null, mcps: [], knowledge_base_ids: [], model_config: { type: "cascading" as const, primary: { model: "gpt-4.1" as const }, temperature: 0.2 } };
  const agentSettings = { agent_name: researchAgentName, language: "en-US" as const, data_storage_setting: "everything" as const, data_storage_retention_days: 7, end_chat_after_silence_ms: 86_400_000, contact_memory_config: { enable_read: false, enable_update: false } };
  if (config.agentId) {
    const existing = await retell.chatAgent.retrieve(config.agentId);
    if (existing.agent_name !== researchAgentName || existing.response_engine.type !== "retell-llm") throw new Error("Refusing to modify a different agent");
    if (existing.version === undefined) throw new Error("Missing agent version");
    const draft = await retell.chatAgent.createVersion(config.agentId, { base_version: existing.version });
    if (draft.response_engine.type !== "retell-llm") throw new Error("Expected Retell LLM");
    const llm = await retell.llm.update(draft.response_engine.llm_id, { ...llmSettings, version: draft.response_engine.version ?? undefined });
    const updated = await retell.chatAgent.update(config.agentId, { ...agentSettings, version: draft.version, response_engine: { type: "retell-llm", llm_id: llm.llm_id, version: llm.version } });
    config.llmId = llm.llm_id; config.version = updated.version; await save();
  } else {
    const llm = config.llmId ? await retell.llm.update(config.llmId, llmSettings) : await retell.llm.create(llmSettings);
    config.llmId = llm.llm_id; await save();
    const agent = await retell.chatAgent.create({ ...agentSettings, response_engine: { type: "retell-llm", llm_id: llm.llm_id } });
    config.agentId = agent.agent_id; config.version = agent.version; await save();
  }
  if (config.version === undefined) throw new Error("Missing agent version");
  try {
    await retell.chatAgent.publish(config.agentId!, { version: config.version, version_title: "Live specialist knowledge assistant", version_description: "Server-selected fictional industry handbooks with contextual answers and source references" });
  } catch (error) {
    // Some successful publishes return an empty body. Verify the published
    // version instead of assuming a provider response parsing error is failure.
    const published = await retell.chatAgent.retrieve(config.agentId!, { version: "latest_published" });
    if (published.version !== config.version) throw error;
  }
  console.log(JSON.stringify({ status: "published", ...config }));
}
main().catch((error: unknown) => { console.error(error instanceof Error ? error.message : "Sync failed"); process.exitCode = 1; });
