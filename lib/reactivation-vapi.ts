import "server-only";

import { getSupabaseAdmin } from "./supabase-server";
import type { Client, ReactivationCampaign, ReactivationContact } from "./types";

type VapiCall = { id: string; status?: string };

function requiredEnv(key: string): string {
  const value = process.env[key]?.trim();
  if (!value) throw new Error(`Missing ${key}`);
  return value;
}

export function reactivationTelephonyReady(): boolean {
  return Boolean(process.env.VAPI_API_KEY?.trim() && process.env.VAPI_OUTBOUND_ASSISTANT_ID?.trim() && process.env.VAPI_OUTBOUND_PHONE_NUMBER_ID?.trim());
}

function localTime(timezone: string, date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: timezone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(date);
  const hour = parts.find((part) => part.type === "hour")?.value ?? "00";
  const minute = parts.find((part) => part.type === "minute")?.value ?? "00";
  return `${hour}:${minute}`;
}

export function isWithinCallingWindow(campaign: Pick<ReactivationCampaign, "calling_timezone" | "calling_window_start" | "calling_window_end">, date = new Date()): boolean {
  const now = localTime(campaign.calling_timezone, date);
  return now >= campaign.calling_window_start.slice(0, 5) && now < campaign.calling_window_end.slice(0, 5);
}

async function createVapiCall(client: Client, campaign: ReactivationCampaign, contact: ReactivationContact): Promise<VapiCall> {
  const apiKey = requiredEnv("VAPI_API_KEY");
  const assistantId = requiredEnv("VAPI_OUTBOUND_ASSISTANT_ID");
  const phoneNumberId = requiredEnv("VAPI_OUTBOUND_PHONE_NUMBER_ID");
  const response = await fetch("https://api.vapi.ai/call", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      assistantId,
      phoneNumberId,
      customer: { number: contact.phone_e164, name: contact.name, email: contact.email ?? undefined },
      metadata: { app: "lead-reactivation", clientId: client.id, campaignId: campaign.id, contactId: contact.id },
      assistantOverrides: {
        variableValues: {
          business_name: client.business_name,
          owner_name: client.owner_name,
          contact_name: contact.name,
          service_type: campaign.service_type || client.trade,
          lead_source: contact.source || "a previous inquiry",
          lead_age_context: contact.lead_age_days ? `${contact.lead_age_days} days ago` : "some time ago",
          prior_context: contact.notes || "No additional context was provided.",
          callback_expectation: client.callback_window || "as soon as possible"
        }
      }
    })
  });
  if (!response.ok) throw new Error(`Vapi call failed (${response.status}): ${(await response.text()).slice(0, 500)}`);
  return (await response.json()) as VapiCall;
}

export async function runReactivationBatch(campaignId: string, clientId?: string, requestedLimit = 5): Promise<{ queued: number; failed: number; skipped: string | null }> {
  if (!reactivationTelephonyReady()) return { queued: 0, failed: 0, skipped: "telephony_not_configured" };
  const admin = getSupabaseAdmin();
  let campaignQuery = admin.from("reactivation_campaigns").select("*").eq("id", campaignId);
  if (clientId) campaignQuery = campaignQuery.eq("client_id", clientId);
  const { data: campaignData, error: campaignError } = await campaignQuery.maybeSingle();
  if (campaignError) throw campaignError;
  if (!campaignData) return { queued: 0, failed: 0, skipped: "campaign_not_found" };
  const campaign = campaignData as ReactivationCampaign;
  if (campaign.status !== "running" || !campaign.eligibility_attested_at) return { queued: 0, failed: 0, skipped: "campaign_not_running" };
  if (!isWithinCallingWindow(campaign)) return { queued: 0, failed: 0, skipped: "outside_calling_window" };

  const { data: clientData, error: clientError } = await admin.from("clients").select("*").eq("id", campaign.client_id).single();
  if (clientError) throw clientError;
  const client = clientData as Client;
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const { count } = await admin.from("reactivation_attempts").select("id", { count: "exact", head: true }).eq("campaign_id", campaign.id).gte("created_at", today.toISOString());
  const remainingToday = Math.max(0, campaign.daily_limit - (count ?? 0));
  const limit = Math.min(Math.max(1, requestedLimit), 10, remainingToday);
  if (!limit) return { queued: 0, failed: 0, skipped: "daily_limit_reached" };

  const { data: contactData, error: contactError } = await admin
    .from("reactivation_contacts")
    .select("*")
    .eq("campaign_id", campaign.id)
    .in("status", ["queued", "no_answer", "failed"])
    .lt("attempt_count", campaign.max_attempts)
    .or(`next_attempt_at.is.null,next_attempt_at.lte.${new Date().toISOString()}`)
    .order("created_at", { ascending: true })
    .limit(limit);
  if (contactError) throw contactError;
  const contacts = (contactData ?? []) as ReactivationContact[];
  let queued = 0;
  let failed = 0;

  for (const contact of contacts) {
    const { data: suppressed } = await admin.from("suppression_entries").select("id").eq("client_id", client.id).eq("phone_e164", contact.phone_e164).maybeSingle();
    if (suppressed) {
      await admin.from("reactivation_contacts").update({ status: "do_not_call", outcome: "suppressed" }).eq("id", contact.id);
      continue;
    }
    const { data: attempt, error: insertError } = await admin.from("reactivation_attempts").insert({ client_id: client.id, campaign_id: campaign.id, contact_id: contact.id, status: "queued" }).select("id").single();
    if (insertError) throw insertError;
    try {
      const call = await createVapiCall(client, campaign, contact);
      await admin.from("reactivation_attempts").update({ vapi_call_id: call.id, status: "in_progress" }).eq("id", attempt.id);
      await admin.from("reactivation_contacts").update({ status: "calling", attempt_count: contact.attempt_count + 1, last_attempt_at: new Date().toISOString() }).eq("id", contact.id);
      queued += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown Vapi error";
      await admin.from("reactivation_attempts").update({ status: "failed", error: message.slice(0, 500) }).eq("id", attempt.id);
      await admin.from("reactivation_contacts").update({ status: "failed", outcome: "call_failed", attempt_count: contact.attempt_count + 1 }).eq("id", contact.id);
      failed += 1;
    }
  }
  return { queued, failed, skipped: null };
}
