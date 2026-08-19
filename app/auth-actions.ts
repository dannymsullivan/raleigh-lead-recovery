"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { normalizePhoneNumber } from "@/lib/phone";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { getSupabaseAuth, isSupabaseAuthConfigured } from "@/lib/supabase-auth";
import { alertConsentText, messagingConsentVersion, verificationConsentText } from "@/lib/messaging-consent";
import { uniqueCustomerSlug } from "@/lib/customer-slug";

const pendingPhoneCookie = "mabel_pending_phone";
const pendingModeCookie = "mabel_pending_auth_mode";

function value(formData: FormData, key: string): string {
  const entry = formData.get(key);
  return typeof entry === "string" ? entry.trim() : "";
}

async function rememberPendingPhone(phone: string, mode: "signup" | "login"): Promise<void> {
  const cookieStore = await cookies();
  const options = {
    httpOnly: true,
    maxAge: 10 * 60,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production"
  };
  cookieStore.set(pendingPhoneCookie, phone, options);
  cookieStore.set(pendingModeCookie, mode, options);
}

export async function requestSignupCodeAction(formData: FormData): Promise<void> {
  if (!isSupabaseAuthConfigured()) redirect("/signup?error=configuration");

  const ownerName = value(formData, "owner_name");
  const phone = normalizePhoneNumber(value(formData, "phone"));

  if (!ownerName || !phone) redirect("/signup?error=missing");
  if (formData.get("sms_consent") !== "on") redirect("/signup?error=consent");

  const consentedAt = new Date().toISOString();

  const admin = getSupabaseAdmin();
  const { error: consentError } = await admin.from("messaging_consents").insert({
    phone_e164: phone,
    purpose: "verification",
    consent_version: messagingConsentVersion,
    consent_text: verificationConsentText,
    source: "signup_checkbox",
    consented_at: consentedAt
  });
  if (consentError) redirect("/signup?error=signup");

  const supabase = await getSupabaseAuth();
  const { error } = await supabase.auth.signInWithOtp({
    phone,
    options: {
      shouldCreateUser: true,
      data: { owner_name: ownerName, verification_sms_consent_at: consentedAt, verification_sms_consent_version: messagingConsentVersion }
    }
  });

  if (error) redirect("/signup?error=sms");
  await rememberPendingPhone(phone, "signup");
  redirect("/verify");
}

export async function requestLoginCodeAction(formData: FormData): Promise<void> {
  if (!isSupabaseAuthConfigured()) redirect("/login?error=configuration");

  const phone = normalizePhoneNumber(value(formData, "phone"));
  if (!phone) redirect("/login?error=phone");

  const admin = getSupabaseAdmin();
  const { error: consentError } = await admin.from("messaging_consents").insert({
    phone_e164: phone,
    purpose: "verification",
    consent_version: messagingConsentVersion,
    consent_text: verificationConsentText,
    source: "login_code_request",
    consented_at: new Date().toISOString()
  });
  if (consentError) redirect("/login?error=phone");

  const supabase = await getSupabaseAuth();
  const { error } = await supabase.auth.signInWithOtp({
    phone,
    options: { shouldCreateUser: false }
  });

  if (error) redirect("/login?error=phone");
  await rememberPendingPhone(phone, "login");
  redirect("/verify");
}

export async function verifyPhoneCodeAction(formData: FormData): Promise<void> {
  if (!isSupabaseAuthConfigured()) redirect("/login?error=configuration");

  const cookieStore = await cookies();
  const phone = cookieStore.get(pendingPhoneCookie)?.value;
  const mode = cookieStore.get(pendingModeCookie)?.value;
  const token = value(formData, "code").replace(/\D/g, "");

  if (!phone || (mode !== "signup" && mode !== "login")) redirect("/signup?error=expired");
  if (token.length < 4 || token.length > 10) redirect("/verify?error=code");

  const supabase = await getSupabaseAuth();
  const { data, error } = await supabase.auth.verifyOtp({ phone, token, type: "sms" });
  if (error || !data.user || !data.session) redirect("/verify?error=code");

  cookieStore.delete(pendingPhoneCookie);
  cookieStore.delete(pendingModeCookie);

  const admin = getSupabaseAdmin();
  if (mode === "login") {
    const { data: existingClient } = await admin.from("clients").select("id").eq("user_id", data.user.id).maybeSingle();
    await admin.from("messaging_consents").upsert({
      client_id: existingClient?.id ?? null,
      user_id: data.user.id,
      phone_e164: phone,
      purpose: "verification",
      consent_version: messagingConsentVersion,
      consent_text: verificationConsentText,
      source: "login_code_request",
      consented_at: new Date().toISOString(),
      revoked_at: null
    }, { onConflict: "user_id,phone_e164,purpose,consent_version" });
    redirect("/dashboard");
  }

  const ownerName = typeof data.user.user_metadata.owner_name === "string"
    ? data.user.user_metadata.owner_name.trim()
    : "";
  if (!ownerName) redirect("/signup?error=missing");

  const today = new Date();
  const pilotEnd = new Date(today);
  pilotEnd.setUTCDate(pilotEnd.getUTCDate() + 14);
  const workspaceName = `${ownerName} workspace`;
  const workspaceSlug = await uniqueCustomerSlug(admin, workspaceName);

  const { data: workspace, error: clientError } = await admin.from("clients").upsert(
    {
      user_id: data.user.id,
      slug: workspaceSlug,
      business_name: workspaceName,
      trade: "service business",
      owner_name: ownerName,
      owner_phone: "Not set",
      owner_email: data.user.email ?? null,
      alert_phone: phone,
      pilot_start: today.toISOString().slice(0, 10),
      pilot_end: pilotEnd.toISOString().slice(0, 10),
      account_status: "onboarding"
    },
    { onConflict: "user_id" }
  ).select("id").single();

  if (clientError || !workspace) redirect("/signup?error=workspace");
  await admin.from("messaging_consents").upsert({
    client_id: workspace.id,
    user_id: data.user.id,
    phone_e164: phone,
    purpose: "verification",
    consent_version: messagingConsentVersion,
    consent_text: verificationConsentText,
    source: "signup_checkbox",
    consented_at: typeof data.user.user_metadata.verification_sms_consent_at === "string" ? data.user.user_metadata.verification_sms_consent_at : new Date().toISOString(),
    revoked_at: null
  }, { onConflict: "user_id,phone_e164,purpose,consent_version" });
  redirect("/onboarding");
}

export async function completeOnboardingAction(formData: FormData): Promise<void> {
  if (!isSupabaseAuthConfigured()) redirect("/login?error=configuration");

  const auth = await getSupabaseAuth();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) redirect("/login");

  const businessName = value(formData, "business_name");
  const ownerName = value(formData, "owner_name");
  const ownerPhone = value(formData, "owner_phone");
  const trade = value(formData, "trade");
  const serviceArea = value(formData, "service_area");
  const alertPhone = normalizePhoneNumber(value(formData, "alert_phone") || ownerPhone);

  if (!businessName || !ownerName || !ownerPhone || !trade || !serviceArea || !alertPhone) {
    redirect("/onboarding?error=missing");
  }
  if (formData.get("alert_sms_consent") !== "on") redirect("/onboarding?error=consent");

  const dayNames = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  const businessHours = Object.fromEntries(dayNames.map((day) => [day, {
    closed: formData.get(`${day}_closed`) === "on",
    open: value(formData, `${day}_open`) || "08:00",
    close: value(formData, `${day}_close`) || "17:00"
  }]));

  const services = value(formData, "services")
    .split(/[\n,]/)
    .map((service) => service.trim())
    .filter(Boolean)
    .slice(0, 30);

  const trialStartedAt = new Date();
  const trialEndsAt = new Date(trialStartedAt);
  trialEndsAt.setUTCDate(trialEndsAt.getUTCDate() + 14);

  const admin = getSupabaseAdmin();
  const { data: existingClient, error: existingClientError } = await admin.from("clients").select("id,slug").eq("user_id", user.id).single();
  if (existingClientError || !existingClient) redirect("/onboarding?error=save");
  const slug = await uniqueCustomerSlug(admin, businessName, existingClient.id);
  const { error } = await admin.from("clients").update({
    slug,
    business_name: businessName,
    owner_name: ownerName,
    owner_phone: ownerPhone,
    trade,
    service_area: serviceArea,
    business_description: value(formData, "business_description") || null,
    services,
    business_hours: businessHours,
    timezone: value(formData, "timezone") || "America/New_York",
    emergency_rules: value(formData, "emergency_rules") || null,
    callback_window: value(formData, "callback_window") || "Within 15 minutes for emergencies; within 2 hours otherwise",
    alert_phone: alertPhone,
    alert_sms_consent_at: trialStartedAt.toISOString(),
    alert_sms_consent_phone: alertPhone,
    onboarding_completed_at: trialStartedAt.toISOString(),
    trial_started_at: trialStartedAt.toISOString(),
    trial_ends_at: trialEndsAt.toISOString(),
    pilot_start: trialStartedAt.toISOString().slice(0, 10),
    pilot_end: trialEndsAt.toISOString().slice(0, 10),
    account_status: "trialing",
    product_mode: "reactivation",
    provisioning_status: "pending",
    provisioning_error: null
  }).eq("user_id", user.id);

  if (error) redirect("/onboarding?error=save");
  const { data: client, error: clientLookupError } = await admin.from("clients").select("id").eq("user_id", user.id).single();
  if (clientLookupError || !client) redirect("/onboarding?error=save");
  await admin.from("messaging_consents").upsert({
    client_id: client.id,
    user_id: user.id,
    phone_e164: alertPhone,
    purpose: "lead_alerts",
    consent_version: messagingConsentVersion,
    consent_text: alertConsentText,
    source: "onboarding_checkbox",
    consented_at: trialStartedAt.toISOString(),
    revoked_at: null
  }, { onConflict: "user_id,phone_e164,purpose,consent_version" });
  redirect("/dashboard/reactivation?welcome=1");
}

export async function logoutCustomerAction(): Promise<void> {
  if (isSupabaseAuthConfigured()) {
    const supabase = await getSupabaseAuth();
    await supabase.auth.signOut();
  }
  redirect("/");
}
