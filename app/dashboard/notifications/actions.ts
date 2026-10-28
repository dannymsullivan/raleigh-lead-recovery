"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminWorkspace, requireCustomerWorkspace } from "@/lib/customer-workspace";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { processChatLeadNotification, validNotificationEmail } from "@/lib/chat-lead-notifications";
import type { Client } from "@/lib/types";

const customerPath = "/dashboard/notifications";
const adminPath = (client: Client) => `/admin/customers/${client.id}/notifications`;
function refresh(path: string, result: string): never {
  revalidatePath(path);
  revalidatePath("/dashboard/settings");
  redirect(`${path}?${result}`);
}
async function save(client: Client, path: string, actor: "admin" | "customer", form: FormData) {
  const enabled = form.get("enabled") === "on";
  const email = String(form.get("destination_email") || "").trim().toLowerCase();
  const label = String(form.get("destination_label") || "Your team").trim();
  const consent = form.get("recipient_consent") === "on";
  if ((email && !validNotificationEmail(email)) || label.length < 1 || label.length > 80 || (enabled && (!email || !consent))) redirect(`${path}?error=validation`);
  const { error } = await getSupabaseAdmin().from("website_chat_notification_settings").upsert({
    client_id: client.id, enabled, destination_email: email || null, destination_label: label,
    consented_at: consent && email ? new Date().toISOString() : null, configured_by: actor, updated_at: new Date().toISOString(),
  });
  if (error) redirect(`${path}?error=save`);
  refresh(path, "saved=1");
}
async function retry(client: Client, path: string, form: FormData) {
  const chatId = String(form.get("chat_id") || "");
  if (!/^[a-f0-9]{8}-[a-f0-9-]{27}$/i.test(chatId)) redirect(`${path}?error=validation`);
  await processChatLeadNotification({ clientId: client.id, chatId });
  refresh(path, "checked=1");
}
export async function saveChatNotifications(form: FormData) {
  return save(await requireCustomerWorkspace(), customerPath, "customer", form);
}
export async function retryChatNotification(form: FormData) {
  return retry(await requireCustomerWorkspace(), customerPath, form);
}
export async function saveAdminChatNotifications(clientId: string, form: FormData) {
  const client = await requireAdminWorkspace(clientId);
  return save(client, adminPath(client), "admin", form);
}
export async function retryAdminChatNotification(clientId: string, form: FormData) {
  const client = await requireAdminWorkspace(clientId);
  return retry(client, adminPath(client), form);
}
