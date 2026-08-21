import "server-only";

import { getSupabaseAdmin } from "./supabase-server";
import { buildReactivationCallRequest } from "./reactivation-call";
import { getRetellClient } from "./retell";
import type { Client, CustomerAgent, ReactivationCampaign, ReactivationContact } from "./types";
import { assessOpportunityDate } from "./lead-eligibility";

class ReactivationAttemptCreatedError extends Error {
  readonly attemptCreated = true;
}

type ReactivationIdentifiers = { agentId: string; phoneNumber: string; agentVersion: number | null };

async function reactivationIdentifiers(campaign: ReactivationCampaign): Promise<ReactivationIdentifiers> {
  if (campaign.agent_id) {
    const { data, error } = await getSupabaseAdmin().from("customer_agents").select("*").eq("id", campaign.agent_id).eq("client_id", campaign.client_id).eq("agent_type", "lead_reactivation").maybeSingle();
    if (error) throw error;
    const agent = data as CustomerAgent | null;
    if (!agent || agent.status !== "ready" || !agent.retell_agent_id || !agent.retell_phone_number) throw new Error("Customer lead-recovery agent is not ready.");
    return { agentId: agent.retell_agent_id, phoneNumber: agent.retell_phone_number, agentVersion: agent.retell_agent_version };
  }
  const agentId = process.env.RETELL_OUTBOUND_AGENT_ID?.trim();
  const phoneNumber = process.env.RETELL_OUTBOUND_PHONE_NUMBER?.trim();
  if (!agentId || !phoneNumber) throw new Error("Lead-recovery agent is not configured.");
  return { agentId, phoneNumber, agentVersion: null };
}

export async function reactivationCampaignTelephonyReady(campaignId: string, clientId: string): Promise<boolean> {
  if (!process.env.RETELL_API_KEY?.trim()) return false;
  const { data, error } = await getSupabaseAdmin().from("reactivation_campaigns").select("*").eq("id", campaignId).eq("client_id", clientId).maybeSingle();
  if (error || !data) return false;
  try {
    await reactivationIdentifiers(data as ReactivationCampaign);
    return true;
  } catch {
    return false;
  }
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

async function createRetellCall(client: Client, campaign: ReactivationCampaign, contact: ReactivationContact, identifiers: ReactivationIdentifiers) {
  return getRetellClient().call.createPhoneCall(buildReactivationCallRequest(client, campaign, contact, identifiers));
}

export async function queueReactivationContactCall(
  client: Client,
  campaign: ReactivationCampaign,
  contact: ReactivationContact,
  identifiers?: ReactivationIdentifiers
): Promise<{ callId: string; attemptId: string }> {
  const admin = getSupabaseAdmin();
  const dateEligibility = assessOpportunityDate({ serviceType: campaign.service_type, metadata: contact.import_metadata, notes: contact.notes });
  if (!dateEligibility.eligible) throw new Error("Contact opportunity date is not eligible.");
  const { data: suppressed } = await admin.from("suppression_entries").select("id").eq("client_id", client.id).eq("phone_e164", contact.phone_e164).maybeSingle();
  if (suppressed) throw new Error("This phone number is suppressed.");

  // Claim the contact immediately before dialing. The status/attempt predicates
  // prevent overlapping cron runs from placing the same call twice, while the
  // owner-contact check gives CRM syncs and manual dashboard updates a final veto.
  const now = new Date().toISOString();
  const { data: claimedContact, error: claimError } = await admin
    .from("reactivation_contacts")
    .update({ status: "calling", attempt_count: contact.attempt_count + 1, last_attempt_at: now })
    .eq("id", contact.id)
    .eq("client_id", client.id)
    .eq("campaign_id", campaign.id)
    .eq("attempt_count", contact.attempt_count)
    .in("status", ["queued", "no_answer", "failed"])
    .or("import_bucket.is.null,import_bucket.neq.exclude")
    .is("owner_contacted_at", null)
    .select("id")
    .maybeSingle();
  if (claimError) throw claimError;
  if (!claimedContact) throw new Error("Contact is no longer eligible.");

  const { data: attempt, error: insertError } = await admin.from("reactivation_attempts").insert({
    client_id: client.id,
    campaign_id: campaign.id,
    contact_id: contact.id,
    status: "queued"
  }).select("id").single();
  if (insertError) {
    await admin.from("reactivation_contacts").update({ status: "failed", outcome: "attempt_create_failed" }).eq("id", contact.id).eq("status", "calling");
    throw insertError;
  }

  try {
    const call = await createRetellCall(client, campaign, contact, identifiers ?? await reactivationIdentifiers(campaign));
    await admin.from("reactivation_attempts").update({ retell_call_id: call.call_id, status: "in_progress" }).eq("id", attempt.id);
    return { callId: call.call_id, attemptId: attempt.id as string };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Retell error";
    await admin.from("reactivation_attempts").update({ status: "failed", error: message.slice(0, 500) }).eq("id", attempt.id);
    await admin.from("reactivation_contacts").update({ status: "failed", outcome: "call_failed" }).eq("id", contact.id).eq("status", "calling");
    throw new ReactivationAttemptCreatedError(message);
  }
}

export async function runReactivationBatch(campaignId: string, clientId?: string, requestedLimit = 5): Promise<{ queued: number; failed: number; skipped: string | null }> {
  if (!process.env.RETELL_API_KEY?.trim()) return { queued: 0, failed: 0, skipped: "telephony_not_configured" };
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
  let identifiers: ReactivationIdentifiers;
  try {
    identifiers = await reactivationIdentifiers(campaign);
  } catch {
    return { queued: 0, failed: 0, skipped: "customer_agent_not_ready" };
  }
  const requestedCapacity = Math.min(Math.max(1, requestedLimit), 50);
  const { data: contactData, error: contactError } = await admin
    .from("reactivation_contacts")
    .select("*")
    .eq("campaign_id", campaign.id)
    .in("status", ["queued", "no_answer", "failed"])
    .or("import_bucket.is.null,import_bucket.neq.exclude")
    .lt("attempt_count", campaign.max_attempts)
    .or(`next_attempt_at.is.null,next_attempt_at.lte.${new Date().toISOString()}`)
    .order("priority_score", { ascending: false })
    .order("event_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true })
    .limit(requestedCapacity);
  if (contactError) throw contactError;
  const candidates = (contactData ?? []) as ReactivationContact[];
  if (!candidates.length) return { queued: 0, failed: 0, skipped: "no_contacts_ready" };

  const { data: reservedCapacity, error: capacityError } = await admin.rpc("reserve_reactivation_daily_capacity", {
    p_campaign_id: campaign.id,
    p_requested: candidates.length
  });
  if (capacityError) throw capacityError;
  const limit = Math.max(0, Number(reservedCapacity) || 0);
  if (!limit) return { queued: 0, failed: 0, skipped: "daily_limit_reached" };

  const contacts = candidates.slice(0, limit);
  let queued = 0;
  let failed = 0;
  let usedReservations = 0;

  try {
    for (const contact of contacts) {
      try {
        await queueReactivationContactCall(client, campaign, contact, identifiers);
        usedReservations += 1;
        queued += 1;
      } catch (error) {
        if (error instanceof ReactivationAttemptCreatedError) usedReservations += 1;
        const message = error instanceof Error ? error.message : "Unknown Retell error";
        if (message === "This phone number is suppressed.") {
          await admin.from("reactivation_contacts").update({ status: "do_not_call", outcome: "suppressed" }).eq("id", contact.id);
        } else if (message === "Contact opportunity date is not eligible.") {
          await admin.from("reactivation_contacts").update({ status: "completed_project", outcome: "date_ineligible", import_bucket: "exclude" }).eq("id", contact.id);
        } else if (message === "Contact is no longer eligible.") {
          // A rep, CRM sync, or overlapping batch changed this record after the
          // queue query. Skipping is the safe and expected outcome.
        } else {
          failed += 1;
        }
      }
    }
  } finally {
    const unusedReservations = limit - usedReservations;
    if (unusedReservations > 0) {
      const { error: releaseError } = await admin.rpc("release_reactivation_daily_capacity", {
        p_campaign_id: campaign.id,
        p_unused: unusedReservations
      });
      if (releaseError) throw releaseError;
    }
  }
  return { queued, failed, skipped: null };
}
