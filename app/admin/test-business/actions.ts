"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { adminCookie, verifyAdminSessionToken } from "@/lib/admin";
import { normalizePhoneNumber } from "@/lib/phone";
import { queueReactivationContactCall, reactivationTelephonyReady } from "@/lib/reactivation-vapi";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import type { Client, ReactivationCampaign, ReactivationContact } from "@/lib/types";

async function requireAdmin(): Promise<void> {
  const cookieStore = await cookies();
  if (!verifyAdminSessionToken(cookieStore.get(adminCookie.name)?.value)) redirect("/admin?error=session");
}

function value(formData: FormData, key: string): string {
  const item = formData.get(key);
  return typeof item === "string" ? item.trim() : "";
}

export async function createOrResetTestBusinessAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const testPhone = normalizePhoneNumber(value(formData, "test_phone"));
  if (!testPhone) redirect("/admin?error=test-phone");

  const admin = getSupabaseAdmin();
  const today = new Date();
  const pilotEnd = new Date(today);
  pilotEnd.setUTCDate(pilotEnd.getUTCDate() + 365);
  const businessName = value(formData, "business_name") || "Oak City Home Services";
  const ownerName = value(formData, "owner_name") || "Daniel";
  const assistantId = process.env.VAPI_OUTBOUND_ASSISTANT_ID?.trim() || null;
  const phoneNumberId = process.env.VAPI_OUTBOUND_PHONE_NUMBER_ID?.trim() || null;

  const { data: existing, error: existingError } = await admin.from("clients").select("id").eq("is_test_account", true).order("created_at").limit(1).maybeSingle();
  if (existingError) throw existingError;

  const clientValues = {
    business_name: businessName.slice(0, 160),
    trade: "HVAC",
    owner_name: ownerName.slice(0, 120),
    owner_phone: testPhone,
    owner_email: value(formData, "owner_email") || null,
    service_area: "Raleigh, NC",
    business_description: "Internal end-to-end QA account for lead reactivation.",
    services: ["HVAC repair", "HVAC replacement", "maintenance"],
    timezone: "America/New_York",
    callback_window: "Within 15 minutes",
    alert_phone: testPhone,
    onboarding_completed_at: new Date().toISOString(),
    trial_started_at: new Date().toISOString(),
    trial_ends_at: pilotEnd.toISOString(),
    account_status: "active",
    provisioning_status: assistantId && phoneNumberId ? "ready" : "needs_configuration",
    product_mode: "reactivation",
    pilot_start: today.toISOString().slice(0, 10),
    pilot_end: pilotEnd.toISOString().slice(0, 10),
    avg_job_value: 1800,
    close_rate: 0.4,
    vapi_assistant_id: assistantId,
    vapi_phone_number_id: phoneNumberId,
    is_test_account: true
  };

  const clientResult = existing
    ? await admin.from("clients").update(clientValues).eq("id", existing.id).select("*").single()
    : await admin.from("clients").insert(clientValues).select("*").single();
  if (clientResult.error) throw clientResult.error;
  const client = clientResult.data as Client;

  const { data: existingCampaign, error: campaignLoadError } = await admin.from("reactivation_campaigns").select("*").eq("client_id", client.id).eq("name", "QA — HVAC lead recovery").limit(1).maybeSingle();
  if (campaignLoadError) throw campaignLoadError;
  const campaignValues = {
    client_id: client.id,
    name: "QA — HVAC lead recovery",
    status: "ready",
    service_type: "HVAC replacement",
    calling_timezone: "America/New_York",
    calling_window_start: "08:00",
    calling_window_end: "20:00",
    max_attempts: 5,
    daily_limit: 1,
    eligibility_attested_at: new Date().toISOString(),
    eligibility_attested_by: null
  };
  const campaignResult = existingCampaign
    ? await admin.from("reactivation_campaigns").update(campaignValues).eq("id", existingCampaign.id).select("*").single()
    : await admin.from("reactivation_campaigns").insert(campaignValues).select("*").single();
  if (campaignResult.error) throw campaignResult.error;
  const campaign = campaignResult.data as ReactivationCampaign;

  const { error: contactError } = await admin.from("reactivation_contacts").upsert({
    client_id: client.id,
    campaign_id: campaign.id,
    name: ownerName.slice(0, 120),
    phone_e164: testPhone,
    source: "Website estimate request",
    lead_age_days: 167,
    notes: "Asked about replacing an aging HVAC system, then paused the project.",
    status: "queued",
    outcome: null,
    attempt_count: 0,
    next_attempt_at: null
  }, { onConflict: "campaign_id,phone_e164" });
  if (contactError) throw contactError;

  revalidatePath("/admin");
  revalidatePath(`/admin/customers/${client.id}`);
  redirect(`/admin/customers/${client.id}?setup=1`);
}

export async function placeTestBusinessCallAction(clientId: string, contactId: string): Promise<void> {
  await requireAdmin();
  if (!reactivationTelephonyReady()) redirect(`/admin/customers/${clientId}?error=telephony`);
  const admin = getSupabaseAdmin();
  const [{ data: clientData }, { data: contactData }] = await Promise.all([
    admin.from("clients").select("*").eq("id", clientId).eq("is_test_account", true).maybeSingle(),
    admin.from("reactivation_contacts").select("*").eq("id", contactId).eq("client_id", clientId).maybeSingle()
  ]);
  if (!clientData || !contactData) redirect(`/admin/customers/${clientId}?error=test-record`);
  const contact = contactData as ReactivationContact;
  const { data: campaignData } = await admin.from("reactivation_campaigns").select("*").eq("id", contact.campaign_id).eq("client_id", clientId).maybeSingle();
  if (!campaignData) redirect(`/admin/customers/${clientId}?error=test-record`);

  try {
    await queueReactivationContactCall(clientData as Client, campaignData as ReactivationCampaign, contact);
  } catch (error) {
    const code = error instanceof Error && error.message.includes("configured owner") ? "test-guard" : "call";
    redirect(`/admin/customers/${clientId}?error=${code}`);
  }
  revalidatePath(`/admin/customers/${clientId}`);
  redirect(`/admin/customers/${clientId}?called=1`);
}
