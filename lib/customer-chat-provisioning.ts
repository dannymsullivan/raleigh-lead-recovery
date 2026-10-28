// Server/CLI orchestration with injected clients. No credentials are stored here.
import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type Retell from "retell-sdk";
import type { KnowledgeEntry } from "./chat";
import { businessProfileKnowledge, effectiveChatKnowledge } from "./chat-knowledge";
import { customerChatAgentName, customerChatKnowledgeName, customerChatModel, customerChatPrompt, customerChatRetentionDays, customerKnowledgeHash, customerKnowledgeSourceTitle, rejectDemoChatResources } from "./customer-chat-config";

type SyncOptions = { clientId: string; monthlyLimit: number; dailyLimit: number };
function agentVersion(agent: { version?: number }): number {
  if (!Number.isInteger(agent.version)) throw new Error("Provider returned no agent version");
  return agent.version!;
}

/** Explicit provisioning only: never called by a public visitor or an ordinary KB save. */
export async function syncCustomerChat(admin: SupabaseClient, retell: Retell, options: SyncOptions) {
  if (!/^[a-f0-9-]{36}$/i.test(options.clientId) || !Number.isInteger(options.monthlyLimit) || !Number.isInteger(options.dailyLimit)
    || options.monthlyLimit < 1 || options.monthlyLimit > 1_000_000 || options.dailyLimit < 1 || options.dailyLimit > Math.min(100_000, options.monthlyLimit)) throw new Error("Explicit valid customer and usage allowances are required");
  const claimId = randomUUID();
  const { data: revision, error: beginError } = await admin.rpc("begin_customer_chat_sync", { p_client_id: options.clientId, p_claim_id: claimId, p_monthly_limit: options.monthlyLimit, p_daily_limit: options.dailyLimit });
  if (beginError) throw new Error("Customer chat sync could not start; check configuration or another active sync.");
  if (!Number.isSafeInteger(revision)) throw new Error("Invalid knowledge revision");
  async function checkpoint(values: Record<string, unknown>) {
    const { data, error } = await admin.from("website_chat_agents").update({ ...values, updated_at: new Date().toISOString() })
      .eq("client_id", options.clientId).eq("sync_claim", claimId).gt("sync_until", new Date().toISOString()).select("client_id").maybeSingle();
    if (error || !data) throw new Error("Customer chat sync lease expired or could not be saved");
  }
  try {
    const [{ data: client, error: clientError }, { data: settings, error: settingsError }, { data: config, error: configError }, { data: entries, error: entriesError }] = await Promise.all([
      admin.from("clients").select("id,business_name,services,service_area,business_hours,timezone").eq("id", options.clientId).single(),
      admin.from("website_chat_settings").select("use_business_profile,knowledge_revision").eq("client_id", options.clientId).single(),
      admin.from("website_chat_agents").select("*").eq("client_id", options.clientId).single(),
      admin.from("website_knowledge").select("id,title,content,keywords,published").eq("client_id", options.clientId).eq("published", true).limit(200),
    ]);
    if (clientError || settingsError || configError || entriesError || !client || !settings || !config) throw new Error("Could not load this customer's approved knowledge");
    if (settings.knowledge_revision !== revision) throw new Error("Business information changed during setup; rerun sync");
    const knowledge = effectiveChatKnowledge(settings.use_business_profile ? businessProfileKnowledge(client) : [], (entries ?? []) as KnowledgeEntry[]);
    if (!knowledge.length) throw new Error("Publish approved business information before configuring AI");
    const hash = customerKnowledgeHash(client.business_name, knowledge);
    let agentId: string | undefined = config.retell_agent_id ?? undefined;
    let llmId: string | undefined = config.retell_llm_id ?? undefined;
    let kbId: string | undefined = config.retell_knowledge_base_id ?? undefined;
    rejectDemoChatResources({ agentId, llmId, knowledgeBaseId: kbId });
    const agentName = customerChatAgentName(options.clientId);
    const kbName = customerChatKnowledgeName(options.clientId);
    // Verify ownership before *any* provider mutation, including creating a new KB revision.
    if (agentId) {
      const existing = await retell.chatAgent.retrieve(agentId);
      if (existing.agent_name !== agentName || existing.response_engine.type !== "retell-llm" || existing.response_engine.llm_id !== llmId) throw new Error("Refusing to change an unrelated chat agent");
    }
    if (!kbId) {
      // Recover an allocated KB after an uncertain response/save before creating
      // another billable KB. Its name includes the complete unique customer ID.
      const matches = (await retell.knowledgeBase.list()).filter(kb => kb.knowledge_base_name === kbName);
      if (matches.length > 1) throw new Error("Multiple customer knowledge bases need an operator review");
      kbId = matches[0]?.knowledge_base_id;
      if (kbId) await checkpoint({ retell_knowledge_base_id: kbId });
    }
    const desiredSources = knowledge.map(entry => ({ title: customerKnowledgeSourceTitle(entry), text: `SOURCE_ID: ${entry.id}\nTITLE: ${entry.title}\n${entry.content}` }));
    if (!kbId) {
      const kb = await retell.knowledgeBase.create({ knowledge_base_name: kbName, max_chunk_size: 3500, min_chunk_size: 200,
        knowledge_base_texts: desiredSources });
      kbId = kb.knowledge_base_id;
      await checkpoint({ retell_knowledge_base_id: kbId });
    }
    rejectDemoChatResources({ knowledgeBaseId: kbId });
    let kb = await retell.knowledgeBase.retrieve(kbId);
    if (kb.knowledge_base_name !== kbName) throw new Error("Refusing to use an unrelated knowledge base");
    if (kb.status !== "complete") throw new Error("Knowledge is still indexing; rerun this sync after it completes");
    const desiredTitles = new Set(desiredSources.map(source => source.title));
    const seenTitles = new Set<string>();
    for (const source of kb.knowledge_base_sources ?? []) {
      if (source.type !== "text" || !/^[a-z0-9-]+:[a-f0-9]{16}: /.test(source.title)) throw new Error("Unexpected manually managed knowledge source; operator review required");
      if (!desiredTitles.has(source.title) || seenTitles.has(source.title)) await retell.knowledgeBase.deleteSource(source.source_id, { knowledge_base_id: kbId });
      else seenTitles.add(source.title);
    }
    kb = await retell.knowledgeBase.retrieve(kbId);
    if (kb.status !== "complete") throw new Error("Knowledge changes are still indexing; rerun this sync after it completes");
    const presentTitles = new Set((kb.knowledge_base_sources ?? []).filter(source => source.type === "text").map(source => source.title));
    const missing = desiredSources.filter(source => !presentTitles.has(source.title));
    if (missing.length) {
      await retell.knowledgeBase.addSources(kbId, { knowledge_base_texts: missing });
      kb = await retell.knowledgeBase.retrieve(kbId);
    }
    const titles = new Set((kb.knowledge_base_sources ?? []).filter(source => source.type === "text").map(source => source.title));
    if (kb.status !== "complete" || titles.size !== knowledge.length || (kb.knowledge_base_sources ?? []).length !== knowledge.length || desiredSources.some(source => !titles.has(source.title))) throw new Error("Knowledge is still indexing; rerun this sync after it completes");
    const llmPayload = { general_prompt: customerChatPrompt(client.business_name), begin_message: "", start_speaker: "user" as const,
      knowledge_base_ids: [kbId], kb_config: { top_k: 6, filter_score: 0.4 },
      model_config: { type: "cascading" as const, primary: { model: customerChatModel }, temperature: 0.2 }, general_tools: [], states: null, mcps: [] };
    const agentPayload = { agent_name: agentName, language: "en-US" as const, data_storage_setting: "everything" as const,
      data_storage_retention_days: customerChatRetentionDays, end_chat_after_silence_ms: 1_800_000,
      contact_memory_config: { enable_read: false, enable_update: false } };
    let version: number;
    if (!agentId) {
      if (!llmId) {
        const llm = await retell.llm.create(llmPayload); llmId = llm.llm_id;
        await checkpoint({ retell_llm_id: llmId });
      } else await retell.llm.update(llmId, llmPayload);
      const agent = await retell.chatAgent.create({ ...agentPayload, response_engine: { type: "retell-llm", llm_id: llmId } });
      agentId = agent.agent_id; version = agentVersion(agent);
      await checkpoint({ retell_agent_id: agentId, agent_version: version });
    } else {
      const existing = await retell.chatAgent.retrieve(agentId);
      const draft = await retell.chatAgent.createVersion(agentId, { base_version: agentVersion(existing) });
      if (draft.response_engine.type !== "retell-llm") throw new Error("Expected a customer chat agent");
      const llm = await retell.llm.update(draft.response_engine.llm_id, { version: draft.response_engine.version ?? undefined, ...llmPayload });
      llmId = llm.llm_id;
      const updated = await retell.chatAgent.update(agentId, { version: draft.version, ...agentPayload, response_engine: { type: "retell-llm", llm_id: llmId, version: llm.version } });
      version = agentVersion(updated);
      await checkpoint({ retell_llm_id: llmId, agent_version: version });
    }
    try { await retell.chatAgent.publish(agentId, { version, version_title: "Approved customer knowledge" }); }
    catch (error) {
      const published = await retell.chatAgent.retrieve(agentId, { version: "latest_published" });
      if (published.version !== version) throw error;
    }
    const { data: activated, error: activateError } = await admin.rpc("activate_customer_chat", { p_client_id: options.clientId, p_claim_id: claimId, p_revision: revision, p_hash: hash, p_agent_version: version });
    if (activateError || activated !== true) throw new Error("Business information changed during sync; rerun before enabling AI");
    return { status: "ready", articles: knowledge.length, monthlyLimit: options.monthlyLimit, dailyLimit: options.dailyLimit, version };
  } catch (caught) {
    await admin.from("website_chat_agents").update({ status: "error", sync_claim: null, sync_until: null,
      sync_error: "AI knowledge is not published yet. Ask Danny to retry the customer sync.", updated_at: new Date().toISOString() }).eq("client_id", options.clientId).eq("sync_claim", claimId);
    throw caught;
  }
}
