"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCustomerWorkspace } from "@/lib/customer-workspace";
import { getSupabaseAdmin } from "@/lib/supabase-server";

export async function updateChatLead(form: FormData) {
  const client = await requireCustomerWorkspace();
  const id = String(form.get("id") || "");
  const status = String(form.get("status") || "");
  const rawValue = String(form.get("booked_value") || "").trim();
  const value = rawValue ? Number(rawValue) : null;
  if (!/^[a-f0-9-]{36}$/i.test(id) || !["new", "contacted", "booked", "lost"].includes(status) || (value !== null && (!Number.isFinite(value) || value < 0 || value > 9999999999))) redirect("/dashboard/chats?error=validation");
  const { data, error } = await getSupabaseAdmin().from("website_chats").update({ lead_status: status, booked_value: status === "booked" ? value : null }).eq("id", id).eq("client_id", client.id).not("lead_captured_at", "is", null).select("id").maybeSingle();
  if (error || !data) redirect("/dashboard/chats?error=save");
  revalidatePath("/dashboard/chats");
  redirect("/dashboard/chats?saved=1");
}
