"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { adminCookie, createAdminSessionToken, verifyAdminPassword, verifyAdminSessionToken } from "@/lib/admin";
import { isClientDeletionLocked } from "@/lib/client-deletion";
import { uniqueCustomerSlug } from "@/lib/customer-slug";
import { adminInvitationCookie, createCustomerInvitationToken, customerInvitationExpiresAt, hashCustomerInvitationToken } from "@/lib/customer-invitations";
import { normalizePhoneNumber } from "@/lib/phone";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { ensureDefaultCustomerAgent, provisionCustomerAgent } from "@/lib/customer-agent-provisioning";

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

async function createWorkspaceInvitation(clientId: string): Promise<string> {
  const admin = getSupabaseAdmin();
  const token = createCustomerInvitationToken();
  const now = new Date().toISOString();
  const { error: revokeError } = await admin.from("customer_workspace_invitations").update({ revoked_at: now }).eq("client_id", clientId).is("accepted_at", null).is("revoked_at", null);
  if (revokeError) throw revokeError;
  const { error } = await admin.from("customer_workspace_invitations").insert({
    client_id: clientId,
    token_hash: hashCustomerInvitationToken(token),
    expires_at: customerInvitationExpiresAt()
  });
  if (error) throw error;
  return token;
}

async function rememberAdminInvitation(clientId: string, token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(adminInvitationCookie, encodeURIComponent(JSON.stringify({ clientId, token })), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/admin/customers",
    maxAge: 10 * 60
  });
}

export async function loginAction(formData: FormData): Promise<void> {
  const password = formString(formData, "password");

  if (!verifyAdminPassword(password)) {
    redirect("/admin?error=login");
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
  const chatOnly = formString(formData, "product_mode") === "website_chat";

  const businessName = formString(formData, "business_name");
  const trade = formString(formData, "trade");
  const ownerName = formString(formData, "owner_name");
  const rawOwnerPhone = formString(formData, "owner_phone");
  const ownerPhone = normalizePhoneNumber(rawOwnerPhone) || rawOwnerPhone;

  if (!businessName || !trade || !ownerName || !ownerPhone) {
    redirect("/admin?error=client");
  }

  const avgJobValue = Number(formString(formData, "avg_job_value") || "500");
  const closeRate = Number(formString(formData, "close_rate") || "0.4");
  const pilotStart = formString(formData, "pilot_start") || new Date().toISOString().slice(0, 10);
  const defaultPilotEnd = new Date(`${pilotStart}T00:00:00.000Z`);
  defaultPilotEnd.setUTCDate(defaultPilotEnd.getUTCDate() + (chatOnly ? 14 : 7));

  const supabase = getSupabaseAdmin();
  const slug = await uniqueCustomerSlug(supabase, businessName);
  const { data: client, error } = await supabase.from("clients").insert({
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
    product_mode: chatOnly ? "website_chat" : "reactivation"
  }).select("id").single();

  if (error) {
    throw error;
  }

  if (!chatOnly) {
    const leadAgent = await ensureDefaultCustomerAgent(client.id, "lead_reactivation");
    await ensureDefaultCustomerAgent(client.id, "receptionist");
    const { error: campaignError } = await supabase.from("reactivation_campaigns").insert({
      client_id: client.id,
      agent_id: leadAgent.id,
      name: `${businessName} lead recovery`.slice(0, 160),
      service_type: trade.slice(0, 100) || "general service",
      calling_timezone: "America/New_York",
      calling_window_start: "09:00",
      calling_window_end: "18:00",
      max_attempts: 2,
      daily_limit: 25
    });
    if (campaignError) throw campaignError;
    after(() => provisionCustomerAgent(client.id, "lead_reactivation"));
  }

  const invitationToken = await createWorkspaceInvitation(client.id);
  await rememberAdminInvitation(client.id, invitationToken);

  revalidatePath("/admin");
  redirect(`/admin/customers/${slug}?created=1#customer-access`);
}

export async function createCustomerInvitationAction(clientId: string, returnPath: string): Promise<void> {
  await requireAdminSession();
  const admin = getSupabaseAdmin();
  const { data: client, error } = await admin.from("clients").select("id,user_id").eq("id", clientId).maybeSingle();
  if (error || !client) redirect(`${returnPath}?error=customer_access`);
  if (client.user_id) redirect(`${returnPath}?error=customer_access_active#customer-access`);
  const token = await createWorkspaceInvitation(clientId);
  await rememberAdminInvitation(clientId, token);
  revalidatePath(returnPath);
  redirect(`${returnPath}?invitation=1#customer-access`);
}

const accountStatuses = new Set(["onboarding", "trialing", "active", "past_due", "canceled"]);
const provisioningStatuses = new Set(["pending", "provisioning", "ready", "needs_configuration", "error"]);

export async function updateClientAction(clientId: string, formData: FormData): Promise<void> {
  await requireAdminSession();

  const businessName = formString(formData, "business_name");
  const trade = formString(formData, "trade");
  const ownerName = formString(formData, "owner_name");
  const rawOwnerPhone = formString(formData, "owner_phone");
  const ownerPhone = normalizePhoneNumber(rawOwnerPhone) || rawOwnerPhone;
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
    .select("id,is_test_account,provisioned_phone_number")
    .eq("id", clientId)
    .maybeSingle();

  if (loadError) throw loadError;
  if (!client) redirect("/admin?error=client-missing");
  if (isClientDeletionLocked(client)) redirect("/admin?error=client-connected");

  const { error } = await admin.from("clients").delete().eq("id", clientId);
  if (error) throw error;

  revalidatePath("/admin");
  redirect("/admin?deleted=client");
}
