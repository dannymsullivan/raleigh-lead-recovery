"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { after } from "next/server";
import { normalizePhoneNumber } from "@/lib/phone";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { getSupabaseAuth, isSupabaseAuthConfigured } from "@/lib/supabase-auth";
import { alertConsentText, messagingConsentVersion } from "@/lib/messaging-consent";
import { isGuidedIndustry, isIndustryKey, selectedTrade } from "@/lib/industry-presets";
import { uniqueCustomerSlug } from "@/lib/customer-slug";
import { hashCustomerInvitationToken, isCustomerInvitationToken } from "@/lib/customer-invitations";
import { ensureDefaultCustomerAgent, provisionCustomerAgents } from "@/lib/customer-agent-provisioning";
import { pendingEmailCookie, pendingInvitationCookie, pendingModeCookie, pendingOwnerNameCookie, pendingPhoneCookie } from "@/lib/auth-email";

function value(formData: FormData, key: string): string {
  const entry = formData.get(key);
  return typeof entry === "string" ? entry.trim() : "";
}

async function rememberPendingEmail(email: string, mode: "signup" | "login" | "invite", invitationToken?: string): Promise<void> {
  const cookieStore = await cookies();
  const options = {
    httpOnly: true,
    maxAge: 30 * 60,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production"
  };
  cookieStore.set(pendingEmailCookie, email, options);
  cookieStore.set(pendingModeCookie, mode, options);
  if (invitationToken) cookieStore.set(pendingInvitationCookie, invitationToken, options);
  else cookieStore.delete(pendingInvitationCookie);
}

function emailRedirectUrl(): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!appUrl) throw new Error("Missing NEXT_PUBLIC_APP_URL");
  return `${appUrl.replace(/\/$/, "")}/auth/callback`;
}

function validEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function requestInviteLinkAction(invitationToken: string, formData: FormData): Promise<void> {
  if (!isSupabaseAuthConfigured()) redirect(`/invite/${encodeURIComponent(invitationToken)}?error=configuration`);
  if (!isCustomerInvitationToken(invitationToken)) redirect(`/invite/${encodeURIComponent(invitationToken)}?error=invalid`);

  const email = value(formData, "email").toLowerCase();
  if (!validEmail(email)) redirect(`/invite/${encodeURIComponent(invitationToken)}?error=email`);

  const admin = getSupabaseAdmin();
  const now = new Date().toISOString();
  const { data: invitation } = await admin.from("customer_workspace_invitations").select("id,client_id").eq("token_hash", hashCustomerInvitationToken(invitationToken)).is("accepted_at", null).is("revoked_at", null).gt("expires_at", now).maybeSingle();
  if (!invitation) redirect(`/invite/${encodeURIComponent(invitationToken)}?error=invalid`);
  const { data: client } = await admin.from("clients").select("id,user_id,owner_name").eq("id", invitation.client_id).maybeSingle();
  if (!client || client.user_id) redirect(`/invite/${encodeURIComponent(invitationToken)}?error=claimed`);

  const supabase = await getSupabaseAuth();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true, emailRedirectTo: emailRedirectUrl(), data: { owner_name: client.owner_name, invited_client_id: client.id } }
  });
  if (error) redirect(`/invite/${encodeURIComponent(invitationToken)}?error=email`);
  await rememberPendingEmail(email, "invite", invitationToken);
  redirect("/check-email?source=invite");
}

export async function requestSignupLinkAction(formData: FormData): Promise<void> {
  if (!isSupabaseAuthConfigured()) redirect("/signup?error=configuration");

  const ownerName = value(formData, "owner_name");
  const email = value(formData, "email").toLowerCase();
  if (!ownerName || !validEmail(email)) redirect("/signup?error=missing");

  const supabase = await getSupabaseAuth();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: emailRedirectUrl(),
      data: { owner_name: ownerName }
    }
  });

  if (error) redirect("/signup?error=email");
  await rememberPendingEmail(email, "signup");
  redirect("/check-email");
}

export async function requestLoginLinkAction(formData: FormData): Promise<void> {
  if (!isSupabaseAuthConfigured()) redirect("/login?error=configuration");

  const email = value(formData, "email").toLowerCase();
  if (!validEmail(email)) redirect("/login?error=email");

  const supabase = await getSupabaseAuth();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false, emailRedirectTo: emailRedirectUrl() }
  });

  if (error) redirect("/login?error=email");
  await rememberPendingEmail(email, "login");
  redirect("/check-email");
}

export async function requestPhoneOtpAction(formData: FormData): Promise<void> {
  const phone = normalizePhoneNumber(value(formData, "phone"));
  const mode = value(formData, "mode") === "signup" ? "signup" : "login";
  const ownerName = value(formData, "owner_name");
  if (!isSupabaseAuthConfigured() || !phone || (mode === "signup" && !ownerName)) redirect(`/${mode === "signup" ? "signup" : "login"}?error=phone`);
  const supabase = await getSupabaseAuth();
  const { error } = await supabase.auth.signInWithOtp({ phone, options: { shouldCreateUser: mode === "signup", data: mode === "signup" ? { owner_name: ownerName } : undefined } });
  if (error) redirect(`/${mode === "signup" ? "signup" : "login"}?error=sms`);
  const cookieStore = await cookies();
  const options = { httpOnly: true, maxAge: 10 * 60, path: "/", sameSite: "lax" as const, secure: process.env.NODE_ENV === "production" };
  cookieStore.set(pendingPhoneCookie, phone, options);
  cookieStore.set(pendingModeCookie, mode, options);
  if (mode === "signup") cookieStore.set(pendingOwnerNameCookie, ownerName, options);
  redirect("/verify-phone");
}

export async function verifyPhoneOtpAction(formData: FormData): Promise<void> {
  const token = value(formData, "token");
  const cookieStore = await cookies();
  const phone = cookieStore.get(pendingPhoneCookie)?.value;
  const mode = cookieStore.get(pendingModeCookie)?.value;
  const ownerName = cookieStore.get(pendingOwnerNameCookie)?.value || "";
  if (!phone || !/^[0-9]{6}$/.test(token) || (mode !== "login" && mode !== "signup")) redirect("/login?error=expired");
  const supabase = await getSupabaseAuth();
  const { data, error } = await supabase.auth.verifyOtp({ phone, token, type: "sms" });
  if (error || !data.user) redirect("/verify-phone?error=invalid");
  const admin = getSupabaseAdmin();
  if (mode === "login") {
    const { data: client } = await admin.from("clients").select("id").eq("user_id", data.user.id).maybeSingle();
    if (!client) { await supabase.auth.signOut(); redirect("/login?error=account"); }
    cookieStore.delete(pendingPhoneCookie); cookieStore.delete(pendingModeCookie); cookieStore.delete(pendingOwnerNameCookie);
    redirect("/dashboard");
  }
  const today = new Date();
  const pilotEnd = new Date(today); pilotEnd.setUTCDate(pilotEnd.getUTCDate() + 14);
  const { error: clientError } = await admin.from("clients").upsert({ user_id: data.user.id, business_name: `${ownerName} workspace`, trade: "service business", owner_name: ownerName, owner_phone: phone, pilot_start: today.toISOString().slice(0, 10), pilot_end: pilotEnd.toISOString().slice(0, 10), account_status: "onboarding" }, { onConflict: "user_id" });
  if (clientError) redirect("/signup?error=workspace");
  cookieStore.delete(pendingPhoneCookie); cookieStore.delete(pendingModeCookie); cookieStore.delete(pendingOwnerNameCookie);
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
  const tradeCategoryValue = value(formData, "trade_category");
  if (!isIndustryKey(tradeCategoryValue)) redirect("/onboarding?error=missing");
  const tradeCategory = tradeCategoryValue;
  const trade = selectedTrade(tradeCategory, value(formData, "other_trade"));
  const guidedSetup = isGuidedIndustry(tradeCategory);
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
    product_mode: "missed_call_recovery",
    provisioning_status: guidedSetup ? "needs_configuration" : "pending",
    provisioning_error: guidedSetup ? "Guided setup requested. Danny will help tailor these call flows before a phone number is assigned." : null
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
  const receptionistAgent = await ensureDefaultCustomerAgent(client.id, "receptionist");
  if (guidedSetup) {
    await admin.from("customer_agents").update({
      status: "needs_configuration",
      provisioning_error: "Guided setup requested. Danny will help tailor this call flow before a phone number is assigned."
    }).in("id", [leadAgent.id, receptionistAgent.id]).eq("client_id", client.id);
  }
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
  if (!guidedSetup) {
    after(async () => {
      try {
        await provisionCustomerAgents(client.id);
      } catch (provisioningError) {
        console.error("Customer call-flow provisioning failed", provisioningError);
      }
    });
  }
  redirect(guidedSetup ? "/dashboard?welcome=guided" : "/dashboard?welcome=1");
}

export async function logoutCustomerAction(): Promise<void> {
  if (isSupabaseAuthConfigured()) {
    const supabase = await getSupabaseAuth();
    await supabase.auth.signOut();
  }
  redirect("/");
}
