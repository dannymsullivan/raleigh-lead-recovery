import "server-only";

import { defaultFirstMessage, leadReactivationPrompt, receptionistPrompt } from "./customer-agent-config";
import { getSupabaseAdmin } from "./supabase-server";
import type { Client, CustomerAgent, CustomerAgentType } from "./types";

type VapiAssistant = { id: string };
type VapiPhoneNumber = { id: string; number?: string };

const receptionistSchema = {
  type: "object",
  properties: {
    caller_name: { type: "string" }, callback_number: { type: "string" }, service_address: { type: "string" }, issue_description: { type: "string" },
    urgency: { type: "string", enum: ["emergency", "urgent", "standard", "spam", "other"] },
    lead_type: { type: "string", enum: ["new_job", "existing_customer", "complaint", "price_shopper", "spam", "other"] },
    estimated_job_value_band: { type: "string", enum: ["under_300", "300_800", "800_2000", "over_2000", "unknown"] },
    requested_timing: { type: "string" }, callback_promised_by: { type: "string" }
  },
  required: ["urgency", "lead_type"]
};

const reactivationSchema = {
  type: "object",
  properties: {
    outcome: { type: "string", enum: ["interested_now", "follow_up_later", "project_completed", "not_interested", "wrong_number", "do_not_call", "no_answer", "failed"] },
    project_type: { type: "string", enum: ["repair", "replacement", "inspection", "maintenance", "other", "unknown"] },
    requested_timing: { type: "string" }, qualification_notes: { type: "string" },
    next_step: { type: "string", enum: ["book_inspection", "owner_callback", "scheduled_follow_up", "close_record", "suppress"] },
    opt_out: { type: "boolean" }
  },
  required: ["outcome", "next_step", "opt_out"]
};

async function vapiRequest<T>(path: string, options: RequestInit, apiKey: string): Promise<T> {
  const response = await fetch(`https://api.vapi.ai${path}`, { ...options, headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", ...(options.headers ?? {}) } });
  if (!response.ok) throw new Error(`Vapi ${options.method ?? "GET"} ${path} failed (${response.status}): ${(await response.text()).slice(0, 500)}`);
  return await response.json() as T;
}

function webhookUrl(): string | null {
  const explicit = process.env.VAPI_PUBLIC_WEBHOOK_URL?.trim();
  if (explicit) return explicit;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  return appUrl ? `${appUrl.replace(/\/$/, "")}/api/webhooks/vapi` : null;
}

function desiredAreaCode(client: Client): string {
  const digits = client.owner_phone.replace(/\D/g, "");
  const local = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
  return /^\d{10}$/.test(local) ? local.slice(0, 3) : (process.env.DEFAULT_PHONE_AREA_CODE || "919");
}

function assistantPayload(client: Client, agent: CustomerAgent, webhook: string, secret: string) {
  const receptionist = agent.agent_type === "receptionist";
  return {
    name: `${agent.name} — ${client.business_name}`.slice(0, 160),
    firstMessage: agent.first_message || defaultFirstMessage(agent.agent_type, client),
    firstMessageInterruptionsEnabled: true,
    maxDurationSeconds: receptionist ? 300 : 240,
    serverMessages: ["end-of-call-report"],
    server: { url: webhook, timeoutSeconds: 20, headers: { "X-Vapi-Secret": secret } },
    artifactPlan: { recordingEnabled: true, recordingFormat: "mp3", loggingEnabled: true, transcriptPlan: { enabled: true, assistantName: "Mabel", userName: receptionist ? "Caller" : "Lead" } },
    model: { provider: "openai", model: receptionist ? "gpt-4.1" : "gpt-5.6-luna", temperature: 0.3, maxTokens: 350, messages: [{ role: "system", content: receptionist ? receptionistPrompt(client, agent) : leadReactivationPrompt(client, agent) }] },
    transcriber: { provider: "deepgram", model: "nova-3", language: "en-US", smartFormat: true, numerals: true, endpointing: 300 },
    voice: { provider: "vapi", voiceId: agent.voice_id || "Savannah", version: "latest", language: "en-US", speed: 1 },
    analysisPlan: { summaryPlan: { enabled: true, timeoutSeconds: 10 }, structuredDataPlan: { enabled: true, timeoutSeconds: 15, schema: receptionist ? receptionistSchema : reactivationSchema } },
    metadata: { app: receptionist ? "missed-call-recovery" : "lead-reactivation", clientId: client.id, agentId: agent.id, agentType: agent.agent_type }
  };
}

export async function ensureDefaultCustomerAgent(clientId: string, type: CustomerAgentType): Promise<CustomerAgent> {
  const admin = getSupabaseAdmin();
  const { data: existing, error: lookupError } = await admin.from("customer_agents").select("*").eq("client_id", clientId).eq("agent_type", type).eq("is_default", true).maybeSingle();
  if (lookupError) throw lookupError;
  if (existing) return existing as CustomerAgent;
  const name = type === "receptionist" ? "Mabel 24/7 Receptionist" : "Mabel Lead Recovery";
  const { data, error } = await admin.from("customer_agents").insert({ client_id: clientId, agent_type: type, name, is_default: true }).select("*").single();
  if (!error && data) return data as CustomerAgent;
  const { data: concurrent, error: concurrentError } = await admin.from("customer_agents").select("*").eq("client_id", clientId).eq("agent_type", type).eq("is_default", true).single();
  if (concurrentError) throw error ?? concurrentError;
  return concurrent as CustomerAgent;
}

export async function ensureDefaultCustomerAgents(clientId: string): Promise<CustomerAgent[]> {
  return Promise.all([ensureDefaultCustomerAgent(clientId, "lead_reactivation"), ensureDefaultCustomerAgent(clientId, "receptionist")]);
}

export async function provisionCustomerAgent(clientId: string, type: CustomerAgentType, options: { forceUpdate?: boolean } = {}): Promise<CustomerAgent> {
  const admin = getSupabaseAdmin();
  const agent = await ensureDefaultCustomerAgent(clientId, type);
  const { data: clientData, error: clientError } = await admin.from("clients").select("*").eq("id", clientId).single();
  if (clientError) throw clientError;
  const client = clientData as Client;
  if (!options.forceUpdate && agent.status === "ready" && agent.vapi_assistant_id && agent.vapi_phone_number_id) return agent;

  const apiKey = process.env.VAPI_API_KEY?.trim();
  const secret = process.env.VAPI_WEBHOOK_SECRET?.trim();
  const webhook = webhookUrl();
  const sharedOutboundNumber = process.env.VAPI_OUTBOUND_PHONE_NUMBER_ID?.trim();
  if (!apiKey || !secret || !webhook?.startsWith("https://") || (type === "lead_reactivation" && !sharedOutboundNumber)) {
    const message = type === "lead_reactivation"
      ? "Lead recovery needs VAPI_API_KEY, VAPI_WEBHOOK_SECRET, VAPI_OUTBOUND_PHONE_NUMBER_ID, and a public HTTPS app URL."
      : "Receptionist setup needs VAPI_API_KEY, VAPI_WEBHOOK_SECRET, and a public HTTPS app URL.";
    const { data, error } = await admin.from("customer_agents").update({ status: "needs_configuration", provisioning_error: message, last_provision_attempt_at: new Date().toISOString() }).eq("id", agent.id).eq("client_id", clientId).select("*").single();
    if (error) throw error;
    return data as CustomerAgent;
  }

  const { error: startingError } = await admin.from("customer_agents").update({ status: "provisioning", provisioning_error: null, last_provision_attempt_at: new Date().toISOString() }).eq("id", agent.id).eq("client_id", clientId);
  if (startingError) throw startingError;
  try {
    let assistantId = agent.vapi_assistant_id;
    const payload = assistantPayload(client, agent, webhook, secret);
    if (!assistantId) assistantId = (await vapiRequest<VapiAssistant>("/assistant", { method: "POST", body: JSON.stringify(payload) }, apiKey)).id;
    else if (options.forceUpdate) await vapiRequest<VapiAssistant>(`/assistant/${assistantId}`, { method: "PATCH", body: JSON.stringify(payload) }, apiKey);

    let phoneNumberId = agent.vapi_phone_number_id;
    let phoneNumber = agent.provisioned_phone_number;
    if (type === "lead_reactivation") phoneNumberId = sharedOutboundNumber!;
    else if (!phoneNumberId) {
      const provisioned = await vapiRequest<VapiPhoneNumber>("/phone-number", { method: "POST", body: JSON.stringify({ provider: "vapi", assistantId, numberDesiredAreaCode: desiredAreaCode(client) }) }, apiKey);
      phoneNumberId = provisioned.id;
      phoneNumber = provisioned.number ?? null;
    }

    const { data, error } = await admin.from("customer_agents").update({ status: "ready", vapi_assistant_id: assistantId, vapi_phone_number_id: phoneNumberId, provisioned_phone_number: phoneNumber, provisioning_error: null }).eq("id", agent.id).eq("client_id", clientId).select("*").single();
    if (error) throw error;
    if (type === "lead_reactivation") {
      const { error: campaignError } = await admin.from("reactivation_campaigns").update({ agent_id: agent.id }).eq("client_id", clientId).is("agent_id", null);
      if (campaignError) throw campaignError;
    } else {
      const { error: legacyError } = await admin.from("clients").update({ vapi_assistant_id: assistantId, vapi_phone_number_id: phoneNumberId, provisioned_phone_number: phoneNumber, number_provider: "vapi", provisioning_status: "ready", provisioning_error: null }).eq("id", clientId);
      if (legacyError) throw legacyError;
    }
    return data as CustomerAgent;
  } catch (error) {
    const message = (error instanceof Error ? error.message : "Unknown provisioning error").slice(0, 500);
    await admin.from("customer_agents").update({ status: "error", provisioning_error: message }).eq("id", agent.id).eq("client_id", clientId);
    if (type === "receptionist") await admin.from("clients").update({ provisioning_status: "error", provisioning_error: message }).eq("id", clientId);
    throw error;
  }
}
