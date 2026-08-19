"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { adminCookie, createAdminSessionToken, verifyAdminPassword, verifyAdminSessionToken } from "@/lib/admin";
import { uniqueCustomerSlug } from "@/lib/customer-slug";
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
  const slug = await uniqueCustomerSlug(supabase, businessName);
  const { error } = await supabase.from("clients").insert({
    slug,
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

const accountStatuses = new Set(["onboarding", "trialing", "active", "past_due", "canceled"]);
const provisioningStatuses = new Set(["pending", "provisioning", "ready", "needs_configuration", "error"]);

export async function updateClientAction(clientId: string, formData: FormData): Promise<void> {
  await requireAdminSession();

  const businessName = formString(formData, "business_name");
  const trade = formString(formData, "trade");
  const ownerName = formString(formData, "owner_name");
  const ownerPhone = formString(formData, "owner_phone");
  if (!businessName || !trade || !ownerName || !ownerPhone) redirect("/admin?error=client-update");

  const accountStatus = formString(formData, "account_status");
  const provisioningStatus = formString(formData, "provisioning_status");
  const avgJobValue = Number(formString(formData, "avg_job_value"));
  const closeRate = Number(formString(formData, "close_rate"));
  const admin = getSupabaseAdmin();
  const { data: existing, error: existingError } = await admin.from("clients").select("slug").eq("id", clientId).maybeSingle();
  if (existingError || !existing) throw existingError ?? new Error("Customer not found.");
  const slug = existing.slug || await uniqueCustomerSlug(admin, businessName, clientId);
  const { error } = await admin.from("clients").update({
    slug,
    business_name: businessName,
    trade,
    owner_name: ownerName,
    owner_phone: ownerPhone,
    owner_email: formString(formData, "owner_email") || null,
    service_area: formString(formData, "service_area") || null,
    pilot_start: formString(formData, "pilot_start"),
    pilot_end: formString(formData, "pilot_end"),
    avg_job_value: Number.isFinite(avgJobValue) ? avgJobValue : 500,
    close_rate: Number.isFinite(closeRate) ? closeRate : 0.4,
    account_status: accountStatuses.has(accountStatus) ? accountStatus : "onboarding",
    provisioning_status: provisioningStatuses.has(provisioningStatus) ? provisioningStatus : "pending"
  }).eq("id", clientId);

  if (error) throw error;
  revalidatePath("/admin");
  redirect("/admin?updated=client");
}

export async function deleteClientAction(clientId: string): Promise<void> {
  await requireAdminSession();
  const admin = getSupabaseAdmin();
  const { data: client, error: loadError } = await admin.from("clients")
    .select("id,user_id,vapi_assistant_id,vapi_phone_number_id")
    .eq("id", clientId)
    .maybeSingle();

  if (loadError) throw loadError;
  if (!client) redirect("/admin?error=client-missing");
  if (client.vapi_assistant_id || client.vapi_phone_number_id) redirect("/admin?error=client-connected");

  const { error } = await admin.from("clients").delete().eq("id", clientId);
  if (error) throw error;
  if (client.user_id) {
    const { error: authError } = await admin.auth.admin.deleteUser(client.user_id);
    if (authError) throw authError;
  }

  revalidatePath("/admin");
  redirect("/admin?deleted=client");
}
