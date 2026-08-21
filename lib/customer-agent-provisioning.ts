import "server-only";

import type Retell from "retell-sdk";
import { defaultFirstMessage, leadReactivationPrompt, receptionistPrompt } from "./customer-agent-config";
import { getRetellClient } from "./retell";
import { getSupabaseAdmin } from "./supabase-server";
import type { Client, CustomerAgent, CustomerAgentType } from "./types";

const receptionistAnalysis = [
  { type: "string" as const, name: "caller_name", description: "Caller's name." },
  { type: "string" as const, name: "callback_number", description: "Best callback number." },
  { type: "string" as const, name: "service_address", description: "Service address, if provided." },
  { type: "string" as const, name: "issue_description", description: "Concise description of what the caller needs." },
  { type: "enum" as const, name: "urgency", description: "Urgency of the request.", choices: ["emergency", "urgent", "standard", "spam", "other"], required: true },
  { type: "enum" as const, name: "lead_type", description: "Type of caller.", choices: ["new_job", "existing_customer", "complaint", "price_shopper", "spam", "other"], required: true },
  { type: "enum" as const, name: "estimated_job_value_band", description: "Likely job-value range based only on information stated in the call.", choices: ["under_300", "300_800", "800_2000", "over_2000", "unknown"] },
  { type: "string" as const, name: "requested_timing", description: "When the caller wants service." },
  { type: "string" as const, name: "callback_promised_by", description: "Any callback expectation communicated to the caller." }
];

const reactivationAnalysis = [
  { type: "enum" as const, name: "outcome", description: "Final lead-recovery outcome.", choices: ["interested_now", "follow_up_later", "project_completed", "not_interested", "wrong_number", "do_not_call", "no_answer", "failed"], required: true },
  { type: "enum" as const, name: "project_type", description: "Project type discussed.", choices: ["repair", "replacement", "inspection", "maintenance", "other", "unknown"] },
  { type: "string" as const, name: "requested_timing", description: "Requested appointment or follow-up timing." },
  { type: "string" as const, name: "qualification_notes", description: "Brief useful context for the business owner." },
  { type: "enum" as const, name: "next_step", description: "Best next action.", choices: ["book_inspection", "owner_callback", "scheduled_follow_up", "close_record", "suppress"], required: true },
  { type: "boolean" as const, name: "opt_out", description: "True only if the person asked not to be contacted.", required: true }
];

function webhookUrl(): string | null {
  const explicit = process.env.RETELL_WEBHOOK_URL?.trim();
  if (explicit) return explicit;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  return appUrl ? `${appUrl.replace(/\/$/, "")}/api/webhooks/retell` : null;
}

function areaCode(client: Client): number {
  const digits = client.owner_phone.replace(/\D/g, "");
  const local = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
  const candidate = /^\d{10}$/.test(local) ? local.slice(0, 3) : (process.env.DEFAULT_PHONE_AREA_CODE || "919");
  return Number(candidate);
}

function llmPayload(client: Client, agent: CustomerAgent) {
  return {
    model: "gpt-4.1" as const,
    model_temperature: 0.2,
    tool_call_strict_mode: true,
    start_speaker: "agent" as const,
    begin_message: agent.first_message || defaultFirstMessage(agent.agent_type, client),
    general_prompt: agent.agent_type === "receptionist" ? receptionistPrompt(client, agent) : leadReactivationPrompt(client, agent),
    general_tools: [{ type: "end_call" as const, name: "end_call", description: "End the call after the conversation is complete and the caller has no more questions." }]
  };
}

function voicePayload(client: Client, agent: CustomerAgent, llmId: string, llmVersion: number | undefined, webhook: string) {
  const receptionist = agent.agent_type === "receptionist";
  return {
    response_engine: { type: "retell-llm" as const, llm_id: llmId, version: llmVersion },
    voice_id: agent.voice_id?.trim() || process.env.RETELL_VOICE_ID?.trim() || "retell-Cimo",
    agent_name: `${agent.name} — ${client.business_name}`.slice(0, 160),
    language: "en-US" as const,
    responsiveness: 0.9,
    interruption_sensitivity: 0.8,
    enable_dynamic_responsiveness: true,
    enable_dynamic_voice_speed: true,
    max_call_duration_ms: receptionist ? 300_000 : 240_000,
    webhook_url: webhook,
    webhook_events: ["call_analyzed" as const],
    webhook_timeout_ms: 10_000,
    data_storage_setting: "everything" as const,
    data_storage_retention_days: 90,
    opt_in_signed_url: true,
    signed_url_expiration_ms: 86_400_000,
    post_call_analysis_model: "gpt-4.1-mini" as const,
    post_call_analysis_data: receptionist ? receptionistAnalysis : reactivationAnalysis
  };
}

async function bindNumber(retell: Retell, client: Client, agent: CustomerAgent, agentId: string, existingNumber: string | null): Promise<string> {
  const binding = [{ agent_id: agentId, agent_version: "latest_published", weight: 1 }];
  const field = agent.agent_type === "receptionist" ? { inbound_agents: binding } : { outbound_agents: binding };
  if (existingNumber) {
    await retell.phoneNumber.update(existingNumber, field);
    return existingNumber;
  }
  const created = await retell.phoneNumber.create({
    country_code: "US",
    area_code: areaCode(client),
    nickname: `${client.business_name} phone`.slice(0, 100),
    allowed_inbound_country_list: ["US", "CA"],
    allowed_outbound_country_list: ["US", "CA"],
    ...field
  });
  return created.phone_number;
}

export async function ensureDefaultCustomerAgent(clientId: string, type: CustomerAgentType): Promise<CustomerAgent> {
  const admin = getSupabaseAdmin();
  const { data: existing, error: lookupError } = await admin.from("customer_agents").select("*").eq("client_id", clientId).eq("agent_type", type).eq("is_default", true).maybeSingle();
  if (lookupError) throw lookupError;
  if (existing) return existing as CustomerAgent;
  const name = type === "receptionist" ? "24/7 Receptionist" : "Lead Recovery";
  const { data, error } = await admin.from("customer_agents").insert({ client_id: clientId, agent_type: type, name, is_default: true, voice_id: "retell-Cimo" }).select("*").single();
  if (!error && data) return data as CustomerAgent;
  const { data: concurrent, error: concurrentError } = await admin.from("customer_agents").select("*").eq("client_id", clientId).eq("agent_type", type).eq("is_default", true).single();
  if (concurrentError) throw error ?? concurrentError;
  return concurrent as CustomerAgent;
}

export async function ensureDefaultCustomerAgents(clientId: string): Promise<CustomerAgent[]> {
  return Promise.all([ensureDefaultCustomerAgent(clientId, "lead_reactivation"), ensureDefaultCustomerAgent(clientId, "receptionist")]);
}

export async function provisionCustomerAgents(clientId: string, options: { forceUpdate?: boolean } = {}): Promise<CustomerAgent[]> {
  const admin = getSupabaseAdmin();
  const provisioned: CustomerAgent[] = [];
  const attemptedAt = new Date().toISOString();
  const { error: startingError } = await admin.from("clients").update({
    provisioning_status: "provisioning",
    provisioning_error: null,
    last_provision_attempt_at: attemptedAt
  }).eq("id", clientId);
  if (startingError) throw startingError;

  // Provision inbound first so it purchases the shared number. The outbound
  // agent then binds to that same number instead of racing to buy another one.
  for (const type of ["receptionist", "lead_reactivation"] as const) {
    provisioned.push(await provisionCustomerAgent(clientId, type, options));
  }

  const incomplete = provisioned.find((agent) => agent.status !== "ready");
  const { error: completedError } = await admin.from("clients").update(incomplete ? {
    provisioning_status: incomplete.status === "needs_configuration" ? "needs_configuration" : "error",
    provisioning_error: incomplete.provisioning_error || "One or more call flows need attention."
  } : {
    provisioning_status: "ready",
    provisioning_error: null
  }).eq("id", clientId);
  if (completedError) throw completedError;

  return provisioned;
}

export async function provisionCustomerAgent(clientId: string, type: CustomerAgentType, options: { forceUpdate?: boolean } = {}): Promise<CustomerAgent> {
  const admin = getSupabaseAdmin();
  let agent = await ensureDefaultCustomerAgent(clientId, type);
  const { data: clientData, error: clientError } = await admin.from("clients").select("*").eq("id", clientId).single();
  if (clientError) throw clientError;
  const client = clientData as Client;
  if (!options.forceUpdate && agent.status === "ready" && agent.retell_agent_id && agent.retell_phone_number) return agent;

  const webhook = webhookUrl();
  if (!process.env.RETELL_API_KEY?.trim() || !webhook?.startsWith("https://")) {
    const message = "Agent setup needs RETELL_API_KEY and a public HTTPS app URL.";
    const { data, error } = await admin.from("customer_agents").update({ status: "needs_configuration", provisioning_error: message, last_provision_attempt_at: new Date().toISOString() }).eq("id", agent.id).eq("client_id", clientId).select("*").single();
    if (error) throw error;
    return data as CustomerAgent;
  }

  const { error: startingError } = await admin.from("customer_agents").update({ status: "provisioning", provisioning_error: null, last_provision_attempt_at: new Date().toISOString() }).eq("id", agent.id).eq("client_id", clientId);
  if (startingError) throw startingError;

  try {
    const retell = getRetellClient();
    let llmId = agent.retell_llm_id;
    let agentId = agent.retell_agent_id;
    let agentVersion: number;

    if (!llmId || !agentId) {
      const llm = await retell.llm.create(llmPayload(client, agent));
      llmId = llm.llm_id;
      const created = await retell.agent.create(voicePayload(client, agent, llmId, llm.version, webhook));
      agentId = created.agent_id;
      agentVersion = created.version;
    } else {
      const llm = await retell.llm.update(llmId, llmPayload(client, agent));
      const draft = await retell.agent.createVersion(agentId, { base_version: agent.retell_agent_version ?? 0 });
      const updated = await retell.agent.update(agentId, { ...voicePayload(client, agent, llmId, llm.version, webhook), version: draft.version });
      agentVersion = updated.version;
    }

    await retell.agent.publish(agentId, { version: agentVersion, version_description: "Published from customer workspace" });
    const { data: sibling } = await admin.from("customer_agents").select("retell_phone_number").eq("client_id", clientId).not("retell_phone_number", "is", null).limit(1).maybeSingle();
    const existingNumber = agent.retell_phone_number || sibling?.retell_phone_number || client.provisioned_phone_number || null;
    const phoneNumber = await bindNumber(retell, client, agent, agentId, existingNumber);

    const { data, error } = await admin.from("customer_agents").update({
      status: "ready",
      retell_agent_id: agentId,
      retell_llm_id: llmId,
      retell_agent_version: agentVersion,
      retell_phone_number: phoneNumber,
      provisioned_phone_number: phoneNumber,
      voice_id: agent.voice_id?.trim() || process.env.RETELL_VOICE_ID?.trim() || "retell-Cimo",
      provisioning_error: null
    }).eq("id", agent.id).eq("client_id", clientId).select("*").single();
    if (error) throw error;
    agent = data as CustomerAgent;

    if (type === "lead_reactivation") {
      const { error: campaignError } = await admin.from("reactivation_campaigns").update({ agent_id: agent.id }).eq("client_id", clientId).is("agent_id", null);
      if (campaignError) throw campaignError;
    }
    const { error: clientUpdateError } = await admin.from("clients").update({ provisioned_phone_number: phoneNumber, number_provider: "retell", provisioning_status: "ready", provisioning_error: null }).eq("id", clientId);
    if (clientUpdateError) throw clientUpdateError;
    return agent;
  } catch (error) {
    const message = (error instanceof Error ? error.message : "Unknown Retell provisioning error").slice(0, 500);
    await admin.from("customer_agents").update({ status: "error", provisioning_error: message }).eq("id", agent.id).eq("client_id", clientId);
    await admin.from("clients").update({ provisioning_status: "error", provisioning_error: message }).eq("id", clientId);
    throw error;
  }
}
