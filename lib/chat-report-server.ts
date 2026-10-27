import "server-only";
import { getSupabaseAdmin } from "./supabase-server";
import { chatMetrics, type ChatRecord } from "./chat";

/** Caller must authorize this workspace. One query path for admin and customer reporting. */
export async function loadChatReport(clientId: string, requestedPage: unknown = 1) {
  const page = Math.max(1, Math.min(10000, Math.floor(Number(requestedPage) || 1)));
  const sinceDate = new Date();
  sinceDate.setUTCDate(sinceDate.getUTCDate() - 30);
  const since = sinceDate.toISOString();
  const admin = getSupabaseAdmin();
  const [summary, recent] = await Promise.all([
    admin.from("website_chats").select("attribution,lead_captured_at,lead_status,booked_value").eq("client_id", clientId).gte("created_at", since).order("created_at", { ascending: false }).limit(1000),
    admin.from("website_chats").select("id,created_at,attribution,messages,lead_name,lead_email,lead_phone,lead_request,lead_captured_at,lead_status,booked_value", { count: "exact" }).eq("client_id", clientId).gte("created_at", since).order("created_at", { ascending: false }).range((page - 1) * 20, page * 20 - 1)
  ]);
  return { page, unavailable: Boolean(summary.error || recent.error), records: (recent.data ?? []) as ChatRecord[], metrics: chatMetrics((summary.data ?? []) as ChatRecord[]), total: recent.count ?? 0 };
}
