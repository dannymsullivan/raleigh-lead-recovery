import { loadEnvConfig } from "@next/env";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import Retell from "retell-sdk";
import { demoKnowledge } from "../lib/demo-knowledge";
import { demoChatAgentName, demoChatPrompt, demoKnowledgeBaseName } from "../lib/demo-agent-config";
import { publicDemoPrompt, publicDemoAgentName, publicDemoBeginMessage, publicDemoMaxCallDurationMs } from "../lib/public-demo-agent-config";
import { webDemoAgentId } from "../lib/web-demo-config";

loadEnvConfig(process.cwd());
type Resources = { knowledgeBaseId?: string; knowledgeHash?: string; chatAgentId?: string; chatLlmId?: string; chatVersion?: number; voiceAgentId?: string; voiceVersion?: number };
const configPath = "config/demo-retell.json";
function versionOf(agent: { version?: number }): number {
  if (typeof agent.version !== "number") throw new Error("Retell did not return an agent version");
  return agent.version;
}
async function main() {
  if (!process.env.RETELL_API_KEY) throw new Error("Missing RETELL_API_KEY");
  const retell = new Retell({ apiKey: process.env.RETELL_API_KEY, timeout: 30_000, maxRetries: 0 });
  let resources: Resources = {};
  try { resources = JSON.parse(await readFile(configPath, "utf8")); } catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
  const save = async () => { await mkdir("config", { recursive: true }); await writeFile(configPath, JSON.stringify(resources, null, 2) + "\n"); };
  const publishedKnowledge = demoKnowledge.filter((entry) => entry.published !== false);
  const knowledgeHash = createHash("sha256").update(JSON.stringify(publishedKnowledge)).digest("hex");
  if (!resources.knowledgeBaseId || resources.knowledgeHash !== knowledgeHash) {
    const kb = await retell.knowledgeBase.create({ knowledge_base_name: demoKnowledgeBaseName, max_chunk_size: 3500, min_chunk_size: 200, knowledge_base_texts: publishedKnowledge.map((entry) => ({ title: `${entry.id}: ${entry.title}`, text: `SOURCE_ID: ${entry.id}\nTITLE: ${entry.title}\n${entry.content}` })) });
    resources.knowledgeBaseId = kb.knowledge_base_id; resources.knowledgeHash = knowledgeHash; await save();
    console.log(JSON.stringify({ knowledgeBaseId: kb.knowledge_base_id, status: kb.status, articles: publishedKnowledge.length }));
  }
  const kb = await retell.knowledgeBase.retrieve(resources.knowledgeBaseId!);
  if (kb.status !== "complete") throw new Error(`Knowledge base is ${kb.status}; rerun sync after processing completes.`);
  const sourceTitles = new Set((kb.knowledge_base_sources ?? []).filter((source) => source.type === "text").map((source) => source.title));
  if (publishedKnowledge.some((entry) => !sourceTitles.has(`${entry.id}: ${entry.title}`))) throw new Error("Retell has not indexed every approved article; source verification failed.");
  const llmPayload = { general_prompt: demoChatPrompt, begin_message: "", start_speaker: "user" as const, knowledge_base_ids: [resources.knowledgeBaseId!], kb_config: { top_k: 6, filter_score: 0.4 }, model_config: { type: "cascading" as const, primary: { model: "gpt-4.1" as const }, temperature: 0.2 } };
  const chatSettings = { agent_name: demoChatAgentName, language: "en-US" as const, data_storage_setting: "everything" as const, data_storage_retention_days: 7, end_chat_after_silence_ms: 86_400_000, contact_memory_config: { enable_read: false, enable_update: false } };
  let chatVersion: number;
  if (!resources.chatAgentId) {
    if (!resources.chatLlmId) {
      const llm = await retell.llm.create(llmPayload); resources.chatLlmId = llm.llm_id; await save();
    } else await retell.llm.update(resources.chatLlmId, llmPayload);
    const agent = await retell.chatAgent.create({ ...chatSettings, response_engine: { type: "retell-llm", llm_id: resources.chatLlmId! } });
    resources.chatAgentId = agent.agent_id; chatVersion = versionOf(agent); await save();
  } else {
    const existing = await retell.chatAgent.retrieve(resources.chatAgentId);
    if (existing.response_engine.type !== "retell-llm" || existing.agent_name !== demoChatAgentName) throw new Error("Refusing to alter a different chat agent");
    const llm = await retell.llm.retrieve(existing.response_engine.llm_id, { version: existing.response_engine.version ?? undefined });
    const model = llm.model_config?.primary?.model ?? llm.model;
    const matchesSettings = llm.general_prompt === demoChatPrompt
      && JSON.stringify(llm.knowledge_base_ids) === JSON.stringify(llmPayload.knowledge_base_ids)
      && llm.kb_config?.top_k === llmPayload.kb_config.top_k && llm.kb_config?.filter_score === llmPayload.kb_config.filter_score
      && model === llmPayload.model_config.primary.model
      && (llm.model_config?.temperature ?? llm.model_temperature) === llmPayload.model_config.temperature
      && !llm.general_tools?.length && !llm.states?.length && !llm.mcps?.length
      && existing.data_storage_retention_days === chatSettings.data_storage_retention_days
      && existing.data_storage_setting === chatSettings.data_storage_setting
      && existing.end_chat_after_silence_ms === chatSettings.end_chat_after_silence_ms
      && existing.contact_memory_config?.enable_read === false && existing.contact_memory_config?.enable_update === false;
    if (matchesSettings) {
      chatVersion = versionOf(existing);
    } else {
      const draft = await retell.chatAgent.createVersion(resources.chatAgentId, { base_version: versionOf(existing) });
      if (draft.response_engine.type !== "retell-llm" || "voice_id" in draft) throw new Error("Expected chat draft");
      const updatedLlm = await retell.llm.update(draft.response_engine.llm_id, { version: draft.response_engine.version ?? undefined, ...llmPayload, general_tools: [], states: null, mcps: [] });
      const updated = await retell.chatAgent.update(resources.chatAgentId, { version: draft.version, ...chatSettings, response_engine: { type: "retell-llm", llm_id: updatedLlm.llm_id, version: updatedLlm.version } });
      chatVersion = versionOf(updated); resources.chatLlmId = updatedLlm.llm_id;
    }
  }
  if (resources.chatVersion !== chatVersion) {
    try {
      await retell.chatAgent.publish(resources.chatAgentId!, { version: chatVersion, version_title: "Shared business knowledge", version_description: "Grounded fictional HVAC chat with detailed policies and source references" });
    } catch (error) {
      const published = await retell.chatAgent.retrieve(resources.chatAgentId!, { version: "latest_published" });
      if (published.version !== chatVersion) throw error;
    }
    resources.chatVersion = chatVersion; await save();
  }

  const voiceId = webDemoAgentId("receptionist");
  if (!voiceId) throw new Error("Missing configured receptionist demo voice agent");
  const voice = await retell.agent.retrieve(voiceId, { version: "latest_published" });
  if (voice.response_engine.type !== "retell-llm" || voice.agent_name !== publicDemoAgentName) throw new Error("Refusing to alter a non-Oak City voice agent");
  const oldLlm = await retell.llm.retrieve(voice.response_engine.llm_id, { version: voice.response_engine.version ?? undefined });
  if (voice.max_call_duration_ms !== publicDemoMaxCallDurationMs || oldLlm.general_prompt !== publicDemoPrompt || !oldLlm.knowledge_base_ids?.includes(resources.knowledgeBaseId!)
    || voice.contact_memory_config?.enable_read !== false || voice.contact_memory_config?.enable_update !== false) {
    const draft = await retell.agent.createVersion(voiceId, { base_version: voice.version });
    if (draft.response_engine.type !== "retell-llm" || !("voice_id" in draft)) throw new Error("Expected voice draft");
    const llm = await retell.llm.update(draft.response_engine.llm_id, { version: draft.response_engine.version ?? undefined, general_prompt: publicDemoPrompt, begin_message: publicDemoBeginMessage, knowledge_base_ids: [resources.knowledgeBaseId!], kb_config: { top_k: 6, filter_score: 0.4 } });
    const updated = await retell.agent.update(voiceId, { version: draft.version, agent_name: publicDemoAgentName, max_call_duration_ms: publicDemoMaxCallDurationMs, contact_memory_config: { enable_read: false, enable_update: false }, response_engine: { type: "retell-llm", llm_id: llm.llm_id, version: llm.version } });
    try {
      await retell.agent.publish(voiceId, { version: updated.version, version_title: "Shared chat and voice knowledge", version_description: "Detailed fictional HVAC handbook shared with website chat" });
    } catch (error) {
      const published = await retell.agent.retrieve(voiceId, { version: "latest_published" });
      if (published.version !== updated.version) throw error;
    }
    resources.voiceVersion = updated.version;
  } else resources.voiceVersion = voice.version;
  resources.voiceAgentId = voiceId; await save();
  console.log(JSON.stringify({ ...resources, articles: publishedKnowledge.length, status: "synced" }));
}
main().catch((error: unknown) => { console.error(error instanceof Error ? error.message : "Knowledge sync failed"); process.exitCode = 1; });
