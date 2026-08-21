"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { after } from "next/server";
import { normalizePhoneNumber } from "@/lib/phone";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { getSupabaseAuth, isSupabaseAuthConfigured } from "@/lib/supabase-auth";
import { alertConsentText, messagingConsentVersion, verificationConsentText } from "@/lib/messaging-consent";
import { uniqueCustomerSlug } from "@/lib/customer-slug";
import { hashCustomerInvitationToken, isCustomerInvitationToken } from "@/lib/customer-invitations";
import { ensureDefaultCustomerAgent, provisionCustomerAgent } from "@/lib/customer-agent-provisioning";

const pendingPhoneCookie = "mabel_pending_phone";
const pendingModeCookie = "mabel_pending_auth_mode";
const pendingInvitationCookie = "mabel_pending_customer_invitation";

function value(formData: FormData, key: string): string {
  const entry = formData.get(key);
  return typeof entry === "string" ? entry.trim() : "";
}

async function rememberPendingPhone(phone: string, mode: "signup" | "login" | "invite", invitationToken?: string): Promise<void> {
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
  if (invitationToken) cookieStore.set(pendingInvitationCookie, invitationToken, options);
  else cookieStore.delete(pendingInvitationCookie);
}

export async function requestInviteCodeAction(invitationToken: string, formData: FormData): Promise<void> {
  if (!isSupabaseAuthConfigured()) redirect(`/invite/${encodeURIComponent(invitationToken)}?error=configuration`);
  if (!isCustomerInvitationToken(invitationToken)) redirect(`/invite/${encodeURIComponent(invitationToken)}?error=invalid`);

  const phone = normalizePhoneNumber(value(formData, "phone"));
  if (!phone) redirect(`/invite/${encodeURIComponent(invitationToken)}?error=phone`);
  if (formData.get("sms_consent") !== "on") redirect(`/invite/${encodeURIComponent(invitationToken)}?error=consent`);

  const admin = getSupabaseAdmin();
  const now = new Date().toISOString();
  const { data: invitation } = await admin.from("customer_workspace_invitations").select("id,client_id").eq("token_hash", hashCustomerInvitationToken(invitationToken)).is("accepted_at", null).is("revoked_at", null).gt("expires_at", now).maybeSingle();
  if (!invitation) redirect(`/invite/${encodeURIComponent(invitationToken)}?error=invalid`);
  const { data: client } = await admin.from("clients").select("id,user_id,owner_name").eq("id", invitation.client_id).maybeSingle();
  if (!client || client.user_id) redirect(`/invite/${encodeURIComponent(invitationToken)}?error=claimed`);

  const { error: consentError } = await admin.from("messaging_consents").insert({
    client_id: client.id,
    phone_e164: phone,
    purpose: "verification",
    consent_version: messagingConsentVersion,
    consent_text: verificationConsentText,
    source: "customer_invitation",
    consented_at: now
  });
  if (consentError) redirect(`/invite/${encodeURIComponent(invitationToken)}?error=sms`);

  const supabase = await getSupabaseAuth();
  const { error } = await supabase.auth.signInWithOtp({
    phone,
    options: { shouldCreateUser: true, data: { owner_name: client.owner_name, invited_client_id: client.id } }
  });
  if (error) redirect(`/invite/${encodeURIComponent(invitationToken)}?error=sms`);
  await rememberPendingPhone(phone, "invite", invitationToken);
  redirect("/verify?source=invite");
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
  const invitationToken = cookieStore.get(pendingInvitationCookie)?.value;
  const token = value(formData, "code").replace(/\D/g, "");

  if (!phone || (mode !== "signup" && mode !== "login" && mode !== "invite")) redirect("/signup?error=expired");
  if (token.length < 4 || token.length > 10) redirect("/verify?error=code");

  const supabase = await getSupabaseAuth();
  const { data, error } = await supabase.auth.verifyOtp({ phone, token, type: "sms" });
  if (error || !data.user || !data.session) redirect(`/verify?error=code${mode === "invite" ? "&source=invite" : ""}`);

  cookieStore.delete(pendingPhoneCookie);
  cookieStore.delete(pendingModeCookie);
  cookieStore.delete(pendingInvitationCookie);

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

  if (mode === "invite") {
    if (!invitationToken || !isCustomerInvitationToken(invitationToken)) redirect("/login?error=invitation");
    const now = new Date().toISOString();
    const invitationHash = hashCustomerInvitationToken(invitationToken);
    const { data: invitation } = await admin.from("customer_workspace_invitations").select("id,client_id").eq("token_hash", invitationHash).is("accepted_at", null).is("revoked_at", null).gt("expires_at", now).maybeSingle();
    if (!invitation) redirect(`/invite/${encodeURIComponent(invitationToken)}?error=invalid`);
    const [{ data: targetClient }, { data: existingClient }] = await Promise.all([
      admin.from("clients").select("id,user_id,product_mode,onboarding_completed_at").eq("id", invitation.client_id).maybeSingle(),
      admin.from("clients").select("id").eq("user_id", data.user.id).maybeSingle()
    ]);
    if (!targetClient || (targetClient.user_id && targetClient.user_id !== data.user.id) || (existingClient && existingClient.id !== targetClient.id)) redirect(`/invite/${encodeURIComponent(invitationToken)}?error=account`);

    if (!targetClient.user_id) {
      const update: Record<string, unknown> = { user_id: data.user.id };
      if (targetClient.product_mode === "reactivation" && !targetClient.onboarding_completed_at) update.onboarding_completed_at = now;
      const { data: linkedClient, error: linkError } = await admin.from("clients").update(update).eq("id", targetClient.id).is("user_id", null).select("id").maybeSingle();
      if (linkError || !linkedClient) redirect(`/invite/${encodeURIComponent(invitationToken)}?error=account`);
    }

    const { error: acceptError } = await admin.from("customer_workspace_invitations").update({ accepted_at: now, accepted_user_id: data.user.id }).eq("id", invitation.id).is("accepted_at", null);
    if (acceptError) redirect(`/invite/${encodeURIComponent(invitationToken)}?error=account`);
    await admin.from("customer_workspace_invitations").update({ revoked_at: now }).eq("client_id", targetClient.id).neq("id", invitation.id).is("accepted_at", null).is("revoked_at", null);
    await admin.from("messaging_consents").upsert({
      client_id: targetClient.id,
      user_id: data.user.id,
      phone_e164: phone,
      purpose: "verification",
      consent_version: messagingConsentVersion,
      consent_text: verificationConsentText,
      source: "customer_invitation",
      consented_at: now,
      revoked_at: null
    }, { onConflict: "user_id,phone_e164,purpose,consent_version" });
    redirect(targetClient.product_mode === "reactivation" ? "/dashboard/reactivation?invited=1" : "/onboarding?invited=1");
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
  const { data: existingCampaign, error: campaignLookupError } = await admin
    .from("reactivation_campaigns")
    .select("id")
    .eq("client_id", client.id)
    .limit(1)
    .maybeSingle();
  if (campaignLookupError) redirect("/onboarding?error=save");
  const leadAgent = await ensureDefaultCustomerAgent(client.id, "lead_reactivation");
  await ensureDefaultCustomerAgent(client.id, "receptionist");
  if (!existingCampaign) {
    const { error: campaignError } = await admin.from("reactivation_campaigns").insert({
      client_id: client.id,
      agent_id: leadAgent.id,
      name: `${businessName} lead recovery`.slice(0, 160),
      service_type: trade.slice(0, 100),
      calling_timezone: value(formData, "timezone") || "America/New_York",
      calling_window_start: "09:00",
      calling_window_end: "18:00",
      max_attempts: 2,
      daily_limit: 25
    });
    if (campaignError) redirect("/onboarding?error=save");
  } else {
    const { error: campaignAgentError } = await admin.from("reactivation_campaigns").update({ agent_id: leadAgent.id }).eq("id", existingCampaign.id).eq("client_id", client.id).is("agent_id", null);
    if (campaignAgentError) redirect("/onboarding?error=save");
  }
  after(() => provisionCustomerAgent(client.id, "lead_reactivation"));
  redirect("/dashboard/reactivation?welcome=1");
}

export async function logoutCustomerAction(): Promise<void> {
  if (isSupabaseAuthConfigured()) {
    const supabase = await getSupabaseAuth();
    await supabase.auth.signOut();
  }
  redirect("/");
}
