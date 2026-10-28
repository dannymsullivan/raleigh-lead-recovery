import "server-only";
import { getSupabaseAdmin } from "./supabase-server";
import { getAppOrigin } from "./app-url";

type Environment = Record<string, string | undefined>;
export type ChatNotificationSettings = { enabled: boolean; destination_email: string | null; destination_label: string; consented_at: string | null };
export type ChatNotification = {
  id: string; chat_id: string; client_id: string; destination_email: string; destination_label: string;
  status: "queued" | "sending" | "sent" | "failed"; attempts: number; first_attempt_at: string | null;
  last_attempt_at: string | null; last_error: string | null; created_at: string; sent_at: string | null;
  claim_token: string | null; payload: EmailPayload | null;
  lead_snapshot: { business_name?: string; name?: string; email?: string; phone?: string; request?: string };
};
type EmailPayload = { from: string; to: string[]; subject: string; text: string };

export function validNotificationEmail(value: string): boolean {
  return value.length <= 200 && /^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/.test(value);
}
export function chatEmailConfigured(environment: Environment = process.env): boolean {
  return environment.CHAT_LEAD_EMAIL_PROVIDER === "resend" && Boolean(environment.RESEND_API_KEY?.trim())
    && validNotificationEmail(environment.CHAT_LEAD_EMAIL_FROM?.trim() || "");
}
const line = (value: string | undefined, maximum: number) => (value || "Not provided").replace(/[\r\n\u0000-\u001f]/g, " ").slice(0, maximum);

export function chatLeadEmail(item: Pick<ChatNotification, "destination_email" | "destination_label" | "lead_snapshot">, from: string, origin: string): EmailPayload {
  const lead = item.lead_snapshot;
  return {
    from, to: [item.destination_email], subject: `New website inquiry · ${line(lead.business_name, 160)}`,
    text: [
      `A website visitor asked ${line(item.destination_label, 80)} to follow up.`,
      `Business: ${line(lead.business_name, 160)}`,
      `Name: ${line(lead.name, 100)}`, `Email: ${line(lead.email, 200)}`, `Phone: ${line(lead.phone, 40)}`,
      "", "Visitor's request:", (lead.request || "Not provided").replace(/\u0000/g, "").slice(0, 2000), "",
      "The visitor gave permission to be contacted about this inquiry. No appointment has been booked.",
      `Sign in to review the conversation and update the lead: ${new URL("/dashboard/chats", origin).href}`,
    ].join("\n"),
  };
}

export function chatNotificationIssue(code: string | null): string | null {
  if (!code) return null;
  if (code === "delivery_not_configured") return "Email delivery is not configured. The lead is saved; connect the sender, then retry.";
  if (code === "destination_paused_or_changed") return "The destination was paused or changed. This alert remains assigned to its original address; follow up from the dashboard.";
  if (code === "review_required") return "This alert needs review before retrying. Check the email provider first to avoid duplicate alerts.";
  return "The email provider did not confirm this attempt. The lead is saved. Retry when the sender is ready.";
}

/** Call only after a consented lead has been saved. The database trigger owns durable enqueueing. */
export async function processChatLeadNotification({ clientId, chatId }: { clientId: string; chatId: string }): Promise<void> {
  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin.from("website_chat_notification_outbox").select("*").eq("client_id", clientId).eq("chat_id", chatId).maybeSingle();
    if (error) throw error;
    if (!data || data.status === "sent") return;
    const item = data as ChatNotification;
    if (!chatEmailConfigured()) {
      const { error: unavailable } = await admin.from("website_chat_notification_outbox")
        .update({ status: "failed", last_error: "delivery_not_configured", updated_at: new Date().toISOString() })
        .eq("id", item.id).in("status", ["queued", "failed"]);
      if (unavailable) throw unavailable;
      return;
    }
    const payload = item.payload || chatLeadEmail(item, process.env.CHAT_LEAD_EMAIL_FROM!.trim(), getAppOrigin());
    const { data: claimed, error: claimError } = await admin.rpc("claim_website_chat_notification", {
      p_client_id: clientId, p_chat_id: chatId, p_payload: payload,
    });
    if (claimError) throw claimError;
    const claim = claimed?.[0] as ChatNotification | undefined;
    if (!claim) return;
    let messageId: string | null = null;
    let failure: string | null = null;
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST", headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY!.trim()}`, "Content-Type": "application/json", "Idempotency-Key": `website-chat-lead/${claim.id}` },
        body: JSON.stringify(claim.payload), signal: AbortSignal.timeout(10_000),
      });
      if (response.ok) {
        const result = await response.json() as { id?: unknown };
        if (typeof result.id === "string" && result.id.length > 0 && result.id.length <= 200) messageId = result.id;
        else failure = "provider_response_invalid";
      } else failure = `provider_http_${response.status}`;
    } catch { failure = "provider_request_failed"; }
    const { error: finishError } = await admin.rpc("finish_website_chat_notification", {
      p_id: claim.id, p_claim_token: claim.claim_token, p_message_id: messageId, p_error: failure,
    });
    if (finishError) throw finishError;
  } catch {
    // No visitor PII or provider secrets in logs; a failed worker never rolls back lead capture.
    console.error("Website lead alert processing needs attention", { clientId, chatId });
  }
}

/** Caller must authorize the workspace before reading destinations or alert history. */
export async function loadChatLeadNotifications(clientId: string) {
  const admin = getSupabaseAdmin();
  const [settings, history] = await Promise.all([
    admin.from("website_chat_notification_settings").select("enabled,destination_email,destination_label,consented_at").eq("client_id", clientId).maybeSingle(),
    admin.from("website_chat_notification_outbox").select("id,chat_id,destination_email,destination_label,status,attempts,first_attempt_at,last_attempt_at,last_error,created_at,sent_at").eq("client_id", clientId).order("created_at", { ascending: false }).limit(20),
  ]);
  return { checkedAt: Date.now(), unavailable: Boolean(settings.error || history.error), configured: chatEmailConfigured(), settings: settings.data as ChatNotificationSettings | null, history: (history.data || []) as ChatNotification[] };
}
