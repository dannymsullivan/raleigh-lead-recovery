"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSupabaseAuth, isSupabaseAuthConfigured } from "@/lib/supabase-auth";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { parseLeadCsv } from "@/lib/reactivation";
import { reactivationTelephonyReady, runReactivationBatch } from "@/lib/reactivation-vapi";

async function workspace(): Promise<{ userId: string; clientId: string }> {
  if (!isSupabaseAuthConfigured()) redirect("/login?error=configuration");
  const auth = await getSupabaseAuth();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) redirect("/login");
  const { data } = await getSupabaseAdmin().from("clients").select("id").eq("user_id", user.id).maybeSingle();
  if (!data) redirect("/signup?error=workspace");
  return { userId: user.id, clientId: data.id as string };
}

function value(formData: FormData, key: string): string {
  const item = formData.get(key);
  return typeof item === "string" ? item.trim() : "";
}

export async function createReactivationCampaignAction(formData: FormData): Promise<void> {
  const { clientId } = await workspace();
  const name = value(formData, "name");
  if (!name) redirect("/dashboard/reactivation?error=campaign_name");
  const maxAttempts = Math.min(5, Math.max(1, Number(value(formData, "max_attempts")) || 2));
  const dailyLimit = Math.min(500, Math.max(1, Number(value(formData, "daily_limit")) || 25));
  const { error } = await getSupabaseAdmin().from("reactivation_campaigns").insert({
    client_id: clientId,
    name: name.slice(0, 160),
    service_type: value(formData, "service_type").slice(0, 100) || "general service",
    calling_timezone: value(formData, "calling_timezone") || "America/New_York",
    calling_window_start: value(formData, "calling_window_start") || "09:00",
    calling_window_end: value(formData, "calling_window_end") || "18:00",
    max_attempts: maxAttempts,
    daily_limit: dailyLimit
  });
  if (error) redirect("/dashboard/reactivation?error=campaign_save");
  revalidatePath("/dashboard/reactivation");
  redirect("/dashboard/reactivation?created=1");
}

export async function importReactivationLeadsAction(campaignId: string, formData: FormData): Promise<void> {
  const { userId, clientId } = await workspace();
  if (formData.get("eligibility_attestation") !== "on") redirect("/dashboard/reactivation?error=attestation");
  const file = formData.get("lead_file");
  if (!(file instanceof File) || !file.size || file.size > 2_000_000) redirect("/dashboard/reactivation?error=file");
  const admin = getSupabaseAdmin();
  const { data: campaign } = await admin.from("reactivation_campaigns").select("id").eq("id", campaignId).eq("client_id", clientId).maybeSingle();
  if (!campaign) redirect("/dashboard/reactivation?error=campaign");

  let parsed;
  try { parsed = parseLeadCsv(await file.text()); }
  catch { redirect("/dashboard/reactivation?error=csv_columns"); }
  const leads = parsed.leads.slice(0, 5000);
  if (!leads.length) redirect("/dashboard/reactivation?error=no_valid_leads");
  const { data: suppressed } = await admin.from("suppression_entries").select("phone_e164").eq("client_id", clientId);
  const blocked = new Set((suppressed ?? []).map((entry) => entry.phone_e164));
  const eligible = leads.filter((lead) => !blocked.has(lead.phoneE164));
  const { error } = await admin.from("reactivation_contacts").upsert(eligible.map((lead) => ({
    client_id: clientId,
    campaign_id: campaignId,
    name: lead.name,
    phone_e164: lead.phoneE164,
    email: lead.email,
    source: lead.source,
    lead_age_days: lead.leadAgeDays,
    notes: lead.notes
  })), { onConflict: "campaign_id,phone_e164", ignoreDuplicates: true });
  if (error) redirect("/dashboard/reactivation?error=import");
  await admin.from("reactivation_campaigns").update({ status: "ready", eligibility_attested_at: new Date().toISOString(), eligibility_attested_by: userId }).eq("id", campaignId).eq("client_id", clientId);
  const skipped = parsed.invalidRows + parsed.duplicateRows + (leads.length - eligible.length);
  revalidatePath("/dashboard/reactivation");
  redirect(`/dashboard/reactivation?imported=${eligible.length}&skipped=${skipped}`);
}

export async function launchReactivationCampaignAction(campaignId: string): Promise<void> {
  const { clientId } = await workspace();
  if (!reactivationTelephonyReady()) redirect("/dashboard/reactivation?error=telephony");
  const admin = getSupabaseAdmin();
  const { data: campaign } = await admin.from("reactivation_campaigns").select("id,eligibility_attested_at").eq("id", campaignId).eq("client_id", clientId).maybeSingle();
  if (!campaign?.eligibility_attested_at) redirect("/dashboard/reactivation?error=attestation");
  const { count } = await admin.from("reactivation_contacts").select("id", { count: "exact", head: true }).eq("campaign_id", campaignId).eq("client_id", clientId);
  if (!count) redirect("/dashboard/reactivation?error=no_valid_leads");
  await admin.from("reactivation_campaigns").update({ status: "running", launched_at: new Date().toISOString() }).eq("id", campaignId).eq("client_id", clientId);
  after(() => runReactivationBatch(campaignId, clientId, 5));
  revalidatePath("/dashboard/reactivation");
  redirect("/dashboard/reactivation?launched=1");
}

export async function pauseReactivationCampaignAction(campaignId: string): Promise<void> {
  const { clientId } = await workspace();
  await getSupabaseAdmin().from("reactivation_campaigns").update({ status: "paused" }).eq("id", campaignId).eq("client_id", clientId);
  revalidatePath("/dashboard/reactivation");
}

export async function resumeReactivationCampaignAction(campaignId: string): Promise<void> {
  const { clientId } = await workspace();
  if (!reactivationTelephonyReady()) redirect("/dashboard/reactivation?error=telephony");
  await getSupabaseAdmin().from("reactivation_campaigns").update({ status: "running" }).eq("id", campaignId).eq("client_id", clientId);
  after(() => runReactivationBatch(campaignId, clientId, 5));
  revalidatePath("/dashboard/reactivation");
}

export async function updateReactivationLeadAction(contactId: string, status: "contacted" | "booked" | "not_interested", formData: FormData): Promise<void> {
  const { clientId } = await workspace();
  const now = new Date().toISOString();
  const estimatedValue = Number(value(formData, "estimated_value"));
  const update: Record<string, unknown> = { status, owner_contacted_at: now };
  if (status === "booked") {
    update.booked_at = now;
    if (Number.isFinite(estimatedValue) && estimatedValue >= 0) update.estimated_value = estimatedValue;
  }
  const admin = getSupabaseAdmin();
  const { data: contact } = await admin.from("reactivation_contacts").update(update).eq("id", contactId).eq("client_id", clientId).select("campaign_id").maybeSingle();
  if (contact && status === "booked") {
    await admin.from("reactivation_appointments").upsert({ client_id: clientId, campaign_id: contact.campaign_id, contact_id: contactId, status: "confirmed", notes: value(formData, "appointment_notes") || null }, { onConflict: "contact_id" });
  }
  revalidatePath("/dashboard/reactivation");
}
