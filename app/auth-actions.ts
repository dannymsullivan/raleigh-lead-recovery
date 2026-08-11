"use server";

import { redirect } from "next/navigation";
import { after } from "next/server";
import { getEmailConfirmationRedirect } from "@/lib/app-url";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { getSupabaseAuth, isSupabaseAuthConfigured } from "@/lib/supabase-auth";
import { provisionClientWorkspace } from "@/lib/provisioning";

function value(formData: FormData, key: string): string {
  const entry = formData.get(key);
  return typeof entry === "string" ? entry.trim() : "";
}

export async function signUpAction(formData: FormData): Promise<void> {
  if (!isSupabaseAuthConfigured()) redirect("/signup?error=configuration");

  const email = value(formData, "email").toLowerCase();
  const password = value(formData, "password");
  const ownerName = value(formData, "owner_name");

  if (!email || password.length < 8 || !ownerName) {
    redirect("/signup?error=missing");
  }

  const supabase = await getSupabaseAuth();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { owner_name: ownerName },
      emailRedirectTo: getEmailConfirmationRedirect()
    }
  });

  if (error || !data.user) {
    redirect(`/signup?error=${error?.status === 422 ? "exists" : "signup"}`);
  }

  const today = new Date();
  const pilotEnd = new Date(today);
  pilotEnd.setUTCDate(pilotEnd.getUTCDate() + 14);

  const admin = getSupabaseAdmin();
  const { error: clientError } = await admin.from("clients").upsert(
    {
      user_id: data.user.id,
      business_name: "New workspace",
      trade: "service business",
      owner_name: ownerName,
      owner_phone: "Not set",
      owner_email: email,
      pilot_start: today.toISOString().slice(0, 10),
      pilot_end: pilotEnd.toISOString().slice(0, 10),
      account_status: "onboarding"
    },
    { onConflict: "user_id" }
  );

  if (clientError) redirect("/signup?error=workspace");
  redirect(data.session ? "/onboarding" : "/login?check_email=1");
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

  if (!businessName || !ownerName || !ownerPhone || !trade || !serviceArea) {
    redirect("/onboarding?error=missing");
  }

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
  const { error } = await admin.from("clients").update({
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
    alert_phone: value(formData, "alert_phone") || ownerPhone,
    onboarding_completed_at: trialStartedAt.toISOString(),
    trial_started_at: trialStartedAt.toISOString(),
    trial_ends_at: trialEndsAt.toISOString(),
    pilot_start: trialStartedAt.toISOString().slice(0, 10),
    pilot_end: trialEndsAt.toISOString().slice(0, 10),
    account_status: "trialing",
    provisioning_status: "pending",
    provisioning_error: null
  }).eq("user_id", user.id);

  if (error) redirect("/onboarding?error=save");
  after(() => provisionClientWorkspace(user.id));
  redirect("/dashboard?welcome=1");
}

export async function loginCustomerAction(formData: FormData): Promise<void> {
  if (!isSupabaseAuthConfigured()) redirect("/login?error=configuration");

  const supabase = await getSupabaseAuth();
  const { error } = await supabase.auth.signInWithPassword({
    email: value(formData, "email").toLowerCase(),
    password: value(formData, "password")
  });

  if (error) redirect("/login?error=credentials");
  redirect("/dashboard");
}

export async function logoutCustomerAction(): Promise<void> {
  if (isSupabaseAuthConfigured()) {
    const supabase = await getSupabaseAuth();
    await supabase.auth.signOut();
  }
  redirect("/");
}
