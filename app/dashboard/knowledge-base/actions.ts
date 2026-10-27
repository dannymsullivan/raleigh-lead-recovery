"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminWorkspace, requireCustomerWorkspace } from "@/lib/customer-workspace";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { businessProfileKnowledge } from "@/lib/chat-knowledge";
import { customerCrmPath } from "@/lib/customer-slug";
import type { Client } from "@/lib/types";

const customerPath = "/dashboard/knowledge-base";
const resultPath = (path: string, result: string) => `${path}${path.includes("?") ? "&" : "?"}${result}`;
function refreshed(path: string) {
  revalidatePath(path.split("?")[0]);
  revalidatePath(customerPath);
  redirect(resultPath(path, "knowledge_saved=1"));
}
async function saveForWorkspace(client: Client, path: string, form: FormData) {
  const id = String(form.get("id") || "");
  const title = String(form.get("title") || "").trim();
  const content = String(form.get("content") || "").trim();
  const keywords = String(form.get("keywords") || "").trim();
  if (!title || title.length > 120 || !content || content.length > 3000 || keywords.length > 500 || (id && !/^[a-f0-9-]{36}$/i.test(id))) redirect(resultPath(path, "knowledge_error=validation"));
  const admin = getSupabaseAdmin();
  const values = { title, content, keywords, published: form.get("published") === "on", updated_at: new Date().toISOString() };
  if (id) {
    const { data, error } = await admin.from("website_knowledge").update(values).eq("id", id).eq("client_id", client.id).select("id").maybeSingle();
    if (error || !data) redirect(resultPath(path, "knowledge_error=save"));
  } else {
    const { count, error: countError } = await admin.from("website_knowledge").select("id", { count: "exact", head: true }).eq("client_id", client.id);
    if (countError || (count ?? 0) >= 200) redirect(resultPath(path, "knowledge_error=limit"));
    const { error } = await admin.from("website_knowledge").insert({ ...values, client_id: client.id });
    if (error) redirect(resultPath(path, "knowledge_error=save"));
  }
  refreshed(path);
}
async function toggleForWorkspace(client: Client, path: string, form: FormData) {
  const enabled = form.get("enabled") === "on";
  const useProfile = form.get("use_business_profile") === "on";
  const admin = getSupabaseAdmin();
  if (enabled) {
    if (!(process.env.CHAT_SESSION_SECRET?.trim() || process.env.DEMO_CALL_HASH_SECRET?.trim())) redirect(resultPath(path, "knowledge_error=configuration"));
    const { count, error } = await admin.from("website_knowledge").select("id", { count: "exact", head: true }).eq("client_id", client.id).eq("published", true);
    if (error || (!count && !(useProfile && businessProfileKnowledge(client).length))) redirect(resultPath(path, "knowledge_error=knowledge"));
  }
  const { error } = await admin.from("website_chat_settings").upsert({ client_id: client.id, enabled, use_business_profile: useProfile, updated_at: new Date().toISOString() });
  if (error) redirect(resultPath(path, "knowledge_error=save"));
  refreshed(path);
}
export async function saveKnowledge(form: FormData) {
  return saveForWorkspace(await requireCustomerWorkspace(), customerPath, form);
}
export async function toggleChat(form: FormData) {
  return toggleForWorkspace(await requireCustomerWorkspace(), customerPath, form);
}
export async function saveAdminKnowledge(clientId: string, form: FormData) {
  const client = await requireAdminWorkspace(clientId);
  return saveForWorkspace(client, `${customerCrmPath(client)}?view=knowledge`, form);
}
export async function toggleAdminChat(clientId: string, form: FormData) {
  const client = await requireAdminWorkspace(clientId);
  return toggleForWorkspace(client, `${customerCrmPath(client)}?view=knowledge`, form);
}
