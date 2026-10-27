"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { getSupabaseAuth, isSupabaseAuthConfigured } from "@/lib/supabase-auth";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { provisionCustomerAgents } from "@/lib/customer-agent-provisioning";
import { normalizePhoneNumber } from "@/lib/phone";
import { alertConsentText, messagingConsentVersion } from "@/lib/messaging-consent";
import { industryKeyForTrade, industryPresets } from "@/lib/industry-presets";

type LeadStatus = "new" | "contacted" | "booked" | "lost" | "spam";

async function currentWorkspace(): Promise<{ userId: string; clientId: string }> {
  if (!isSupabaseAuthConfigured()) redirect("/login?error=configuration");
  const auth = await getSupabaseAuth();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) redirect("/login");

  const admin = getSupabaseAdmin();
  const { data } = await admin.from("clients").select("id").eq("user_id", user.id).maybeSingle();
  if (!data) redirect("/signup?error=workspace");
  return { userId: user.id, clientId: data.id as string };
}

export async function updateLeadStatusAction(callId: string, status: LeadStatus, formData: FormData): Promise<void> {
  const { clientId } = await currentWorkspace();
  const update: Record<string, unknown> = {
    lead_status: status,
    callback_completed_at: status === "contacted" || status === "booked" ? new Date().toISOString() : null
  };

  const bookedValue = formData.get("booked_value");
  if (status === "booked" && typeof bookedValue === "string" && bookedValue.trim()) {
    const parsed = Number(bookedValue);
    if (Number.isFinite(parsed) && parsed >= 0) update.booked_value = parsed;
  }

  const admin = getSupabaseAdmin();
  const { error } = await admin.from("calls").update(update).eq("id", callId).eq("client_id", clientId);
  if (error) throw error;
  revalidatePath("/dashboard");
}

export async function saveCallNotesAction(callId: string, formData: FormData): Promise<void> {
  const { clientId } = await currentWorkspace();
  const notes = formData.get("owner_notes");
  const admin = getSupabaseAdmin();
  const { error } = await admin.from("calls").update({ owner_notes: typeof notes === "string" ? notes.trim().slice(0, 2000) || null : null }).eq("id", callId).eq("client_id", clientId);
  if (error) throw error;
  revalidatePath("/dashboard");
}

export async function retryProvisioningAction(): Promise<void> {
  const { clientId } = await currentWorkspace();
  await provisionCustomerAgents(clientId);
  revalidatePath("/dashboard");
}

export async function markForwardingCompleteAction(): Promise<void> {
  const { clientId } = await currentWorkspace();
  const admin = getSupabaseAdmin();
  const { error } = await admin.from("clients").update({ forwarding_completed_at: new Date().toISOString() }).eq("id", clientId);
  if (error) throw error;
  revalidatePath("/dashboard");
}

function formValue(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function saveAssistantSettingsAction(formData: FormData): Promise<void> {
  const { userId, clientId } = await currentWorkspace();
  const businessName = formValue(formData, "business_name");
  const ownerPhone = formValue(formData, "owner_phone");
  const admin = getSupabaseAdmin();
  const { data: workspace, error: workspaceError } = await admin.from("clients").select("product_mode").eq("id", clientId).single();
  if (workspaceError || !workspace) redirect("/dashboard/settings?error=save");
  if (workspace.product_mode === "website_chat") {
    if (!businessName || businessName.length > 160) redirect("/dashboard/settings?error=missing");
    const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
    const timezone = formValue(formData, "timezone") || "America/New_York";
    if (!["America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles"].includes(timezone)) redirect("/dashboard/settings?error=missing");
    const hours = Object.fromEntries(days.map(day => [day, { closed: formData.get(`${day}_closed`) === "on", open: formValue(formData, `${day}_open`) || "08:00", close: formValue(formData, `${day}_close`) || "17:00" }]));
    if (Object.values(hours).some(day => !/^([01]\d|2[0-3]):[0-5]\d$/.test(day.open) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(day.close))) redirect("/dashboard/settings?error=missing");
    const { error } = await admin.from("clients").update({
      business_name: businessName, owner_phone: ownerPhone.slice(0, 40) || "Not set",
      trade: formValue(formData, "trade").slice(0, 100) || "service business",
      service_area: formValue(formData, "service_area").slice(0, 1000) || null,
      business_description: formValue(formData, "business_description").slice(0, 3000) || null,
      services: formValue(formData, "services").split(/[\n,]/).map(item => item.trim().slice(0, 200)).filter(Boolean).slice(0, 30),
      business_hours: hours, timezone, onboarding_completed_at: new Date().toISOString(),
    }).eq("id", clientId);
    if (error) redirect("/dashboard/settings?error=save");
    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard/knowledge-base");
    redirect("/dashboard/settings?saved=1");
  }
  const alertPhone = normalizePhoneNumber(formValue(formData, "alert_phone") || ownerPhone);
  if (!businessName || !ownerPhone || !alertPhone) redirect("/dashboard/settings?error=missing");
  if (formData.get("alert_sms_consent") !== "on") redirect("/dashboard/settings?error=consent");

  const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  const businessHours = Object.fromEntries(days.map((day) => [day, {
    closed: formData.get(`${day}_closed`) === "on",
    open: formValue(formData, `${day}_open`) || "08:00",
    close: formValue(formData, `${day}_close`) || "17:00"
  }]));
  const services = formValue(formData, "services").split(/[\n,]/).map((item) => item.trim()).filter(Boolean).slice(0, 30);

  const consentedAt = new Date().toISOString();
  const nextTrade = formValue(formData, "trade") || "service business";
  const { data: currentClient } = await admin.from("clients").select("trade").eq("id", clientId).single();
  const nextIndustry = industryKeyForTrade(nextTrade);
  const preset = nextIndustry === "other" ? null : industryPresets[nextIndustry];
  const useNewPreset = Boolean(preset && currentClient?.trade !== nextTrade);
  const { data: readyAgentRows } = await admin.from("customer_agents").select("agent_type").eq("client_id", clientId).eq("status", "ready");
  const readyAgentTypes = (readyAgentRows ?? []).map((agent) => agent.agent_type).filter((type): type is "receptionist" | "lead_reactivation" => type === "receptionist" || type === "lead_reactivation");
  const receptionistActive = readyAgentTypes.includes("receptionist");
  const { error } = await admin.from("clients").update({
    business_name: businessName,
    owner_phone: ownerPhone,
    trade: nextTrade,
    service_area: formValue(formData, "service_area") || null,
    business_description: useNewPreset ? preset?.description : formValue(formData, "business_description") || null,
    services: useNewPreset ? preset?.services.split("\n") : services,
    business_hours: businessHours,
    timezone: formValue(formData, "timezone") || "America/New_York",
    emergency_rules: useNewPreset ? preset?.emergencyRules : formValue(formData, "emergency_rules") || null,
    callback_window: formValue(formData, "callback_window") || "The team will call back as soon as possible.",
    alert_phone: alertPhone,
    alert_sms_consent_at: consentedAt,
    alert_sms_consent_phone: alertPhone,
    ...(receptionistActive ? { provisioning_status: "provisioning", provisioning_error: null } : {})
  }).eq("id", clientId);

  if (error) redirect("/dashboard/settings?error=save");
  await admin.from("messaging_consents").upsert({
    client_id: clientId,
    user_id: userId,
    phone_e164: alertPhone,
    purpose: "lead_alerts",
    consent_version: messagingConsentVersion,
    consent_text: alertConsentText,
    source: "settings_checkbox",
    consented_at: consentedAt,
    revoked_at: null
  }, { onConflict: "user_id,phone_e164,purpose,consent_version" });
  if (readyAgentTypes.length) {
    after(async () => {
      try {
        await provisionCustomerAgents(clientId, { forceUpdate: true });
      } catch (provisioningError) {
        console.error("Customer call-flow synchronization failed", provisioningError);
      }
    });
  }
  revalidatePath("/dashboard");
  redirect("/dashboard/settings?saved=1");
}
