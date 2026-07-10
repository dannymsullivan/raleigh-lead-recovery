"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { adminCookie, createAdminSessionToken, verifyAdminPassword, verifyAdminSessionToken } from "@/lib/admin";
import { getSupabaseAdmin } from "@/lib/supabase-server";

function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

async function requireAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(adminCookie.name)?.value;
  if (!verifyAdminSessionToken(token)) {
    redirect("/admin?error=session");
  }
}

export async function loginAction(formData: FormData): Promise<void> {
  const password = formString(formData, "password");

  if (!verifyAdminPassword(password)) {
    redirect("/?error=login");
  }

  const cookieStore = await cookies();
  cookieStore.set(adminCookie.name, createAdminSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: adminCookie.maxAge
  });

  redirect("/admin");
}

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(adminCookie.name);
  redirect("/admin");
}

export async function addClientAction(formData: FormData): Promise<void> {
  await requireAdminSession();

  const businessName = formString(formData, "business_name");
  const trade = formString(formData, "trade");
  const ownerName = formString(formData, "owner_name");
  const ownerPhone = formString(formData, "owner_phone");

  if (!businessName || !trade || !ownerName || !ownerPhone) {
    redirect("/admin?error=client");
  }

  const avgJobValue = Number(formString(formData, "avg_job_value") || "500");
  const closeRate = Number(formString(formData, "close_rate") || "0.4");
  const pilotStart = formString(formData, "pilot_start") || new Date().toISOString().slice(0, 10);
  const defaultPilotEnd = new Date(`${pilotStart}T00:00:00.000Z`);
  defaultPilotEnd.setUTCDate(defaultPilotEnd.getUTCDate() + 7);

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("clients").insert({
    business_name: businessName,
    trade,
    owner_name: ownerName,
    owner_phone: ownerPhone,
    owner_email: formString(formData, "owner_email") || null,
    pilot_start: pilotStart,
    pilot_end: formString(formData, "pilot_end") || defaultPilotEnd.toISOString().slice(0, 10),
    avg_job_value: Number.isFinite(avgJobValue) ? avgJobValue : 500,
    close_rate: Number.isFinite(closeRate) ? closeRate : 0.4,
    vapi_assistant_id: formString(formData, "vapi_assistant_id") || null,
    vapi_phone_number_id: formString(formData, "vapi_phone_number_id") || null
  });

  if (error) {
    throw error;
  }

  revalidatePath("/admin");
  redirect("/admin?created=1");
}

export async function requestAuditAction(formData: FormData): Promise<void> {
  const businessName = formString(formData, "business_name");
  const ownerName = formString(formData, "owner_name");
  const ownerPhone = formString(formData, "owner_phone");

  if (!businessName || !ownerName || !ownerPhone) {
    redirect("/?request=missing#request");
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("pilot_requests").insert({
    business_name: businessName,
    owner_name: ownerName,
    owner_phone: ownerPhone,
    owner_email: formString(formData, "owner_email") || null,
    website: formString(formData, "website") || null,
    service_area: formString(formData, "service_area") || "Raleigh",
    weekly_missed_calls: formString(formData, "weekly_missed_calls") || null,
    current_after_hours: formString(formData, "current_after_hours") || null,
    notes: formString(formData, "notes") || null,
    source: formString(formData, "source") || "raleigh_lead_recovery_landing"
  });

  if (error) {
    throw error;
  }

  redirect("/thanks");
}
