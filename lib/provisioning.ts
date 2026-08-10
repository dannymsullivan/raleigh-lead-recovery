import "server-only";

import { getSupabaseAdmin } from "./supabase-server";
import type { Client } from "./types";

type VapiAssistant = { id: string };
type VapiPhoneNumber = { id: string; number?: string; provider?: string };

const structuredDataSchema = {
  type: "object",
  properties: {
    caller_name: { type: "string" },
    callback_number: { type: "string" },
    service_address: { type: "string" },
    issue_description: { type: "string" },
    urgency: { type: "string", enum: ["emergency", "urgent", "standard", "spam", "other"] },
    lead_type: { type: "string", enum: ["new_job", "existing_customer", "complaint", "price_shopper", "spam", "other"] },
    estimated_job_value_band: { type: "string", enum: ["under_300", "300_800", "800_2000", "over_2000", "unknown"] },
    requested_timing: { type: "string" },
    callback_promised_by: { type: "string" }
  },
  required: ["urgency", "lead_type"]
};

async function vapiRequest<T>(path: string, options: RequestInit, apiKey: string): Promise<T> {
  const response = await fetch(`https://api.vapi.ai${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", ...(options.headers ?? {}) }
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Vapi ${options.method ?? "GET"} ${path} failed (${response.status}): ${body.slice(0, 500)}`);
  }
  return (await response.json()) as T;
}

function getWebhookUrl(): string | null {
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

function formatHours(client: Client): string {
  const hours = client.business_hours ?? {};
  const lines = Object.entries(hours).map(([day, schedule]) =>
    schedule.closed ? `${day}: closed` : `${day}: ${schedule.open} to ${schedule.close}`
  );
  return lines.length ? lines.join("\n") : "Business hours were not provided.";
}

function assistantPayload(client: Client, webhook: string, secret: string) {
  const services = client.services?.length ? client.services.join(", ") : client.trade;
  const prompt = `[Identity]
You are Mabel, the automated missed-call assistant for ${client.business_name}. Be warm, calm, concise, and honest that you are an automated assistant if asked.

[Business information]
Business type: ${client.trade}
Service area: ${client.service_area || "Not specified"}
Services: ${services}
Business description: ${client.business_description || "Not specified"}
Business hours:\n${formatHours(client)}

[Your job]
1. Understand why the caller is calling.
2. Capture their name, callback number, service address when relevant, issue, urgency, and requested timing—one question at a time.
3. Set this callback expectation: ${client.callback_window || "The team will call back as soon as possible."}
4. Never invent prices, availability, arrival times, or business policies.
5. Never collect payment information.
6. Flag emergencies using these customer-provided rules: ${client.emergency_rules || "Immediate danger or active property damage."}
7. For immediate threats to life or safety, tell the caller to contact 911 or the appropriate emergency service before continuing.
8. Keep the call under four minutes when possible.

[Style]
Use short natural sentences. Ask one question at a time. Avoid corporate language. Confirm the callback number before ending.`;

  return {
    name: `Mabel — ${client.business_name}`,
    firstMessage: `Thanks for calling ${client.business_name}. This is Mabel, the automated assistant. The team couldn't grab the phone, but I can get the details to them. What's going on?`,
    firstMessageInterruptionsEnabled: true,
    maxDurationSeconds: 300,
    serverMessages: ["end-of-call-report"],
    server: { url: webhook, timeoutSeconds: 20, headers: { "X-Vapi-Secret": secret } },
    model: { provider: "openai", model: "gpt-4.1", temperature: 0.3, maxTokens: 350, messages: [{ role: "system", content: prompt }] },
    transcriber: { provider: "deepgram", model: "nova-3", language: "en-US", smartFormat: true, numerals: true },
    voice: { provider: "vapi", voiceId: "Savannah", version: "latest", language: "en-US", speed: 1 },
    analysisPlan: {
      summaryPlan: { enabled: true, timeoutSeconds: 10 },
      structuredDataPlan: { enabled: true, timeoutSeconds: 15, schema: structuredDataSchema }
    },
    metadata: { app: "raleigh-lead-recovery", clientId: client.id, userId: client.user_id }
  };
}

export async function provisionClientWorkspace(userId: string, options: { forceAssistantUpdate?: boolean } = {}): Promise<void> {
  const admin = getSupabaseAdmin();
  const { data } = await admin.from("clients").select("*").eq("user_id", userId).maybeSingle();
  if (!data) return;
  const client = data as Client;
  if (!options.forceAssistantUpdate && client.provisioning_status === "ready" && client.vapi_assistant_id && client.vapi_phone_number_id) return;

  const apiKey = process.env.VAPI_API_KEY?.trim();
  const secret = process.env.VAPI_WEBHOOK_SECRET?.trim();
  const webhook = getWebhookUrl();
  if (!apiKey || !secret || !webhook || !webhook.startsWith("https://")) {
    await admin.from("clients").update({
      provisioning_status: "needs_configuration",
      provisioning_error: "Provisioning needs VAPI_API_KEY, VAPI_WEBHOOK_SECRET, and a public HTTPS app URL.",
      last_provision_attempt_at: new Date().toISOString()
    }).eq("id", client.id);
    return;
  }

  await admin.from("clients").update({ provisioning_status: "provisioning", provisioning_error: null, last_provision_attempt_at: new Date().toISOString() }).eq("id", client.id);

  try {
    let assistantId = client.vapi_assistant_id;
    if (!assistantId) {
      const assistant = await vapiRequest<VapiAssistant>("/assistant", { method: "POST", body: JSON.stringify(assistantPayload(client, webhook, secret)) }, apiKey);
      assistantId = assistant.id;
      await admin.from("clients").update({ vapi_assistant_id: assistantId }).eq("id", client.id);
    } else if (options.forceAssistantUpdate) {
      await vapiRequest<VapiAssistant>(`/assistant/${assistantId}`, { method: "PATCH", body: JSON.stringify(assistantPayload(client, webhook, secret)) }, apiKey);
    }

    let phoneNumberId = client.vapi_phone_number_id;
    let phoneNumber = client.provisioned_phone_number;
    if (!phoneNumberId) {
      const provisioned = await vapiRequest<VapiPhoneNumber>("/phone-number", {
        method: "POST",
        body: JSON.stringify({ provider: "vapi", assistantId, numberDesiredAreaCode: desiredAreaCode(client) })
      }, apiKey);
      phoneNumberId = provisioned.id;
      phoneNumber = provisioned.number ?? null;
    }

    await admin.from("clients").update({
      vapi_assistant_id: assistantId,
      vapi_phone_number_id: phoneNumberId,
      provisioned_phone_number: phoneNumber,
      number_provider: "vapi",
      provisioning_status: "ready",
      provisioning_error: null
    }).eq("id", client.id);
  } catch (error) {
    await admin.from("clients").update({
      provisioning_status: "error",
      provisioning_error: (error instanceof Error ? error.message : "Unknown provisioning error").slice(0, 500)
    }).eq("id", client.id);
  }
}
