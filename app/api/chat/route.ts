import { createHash, createHmac, randomBytes } from "node:crypto";
import { after, NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { answerFromKnowledge, parseAttribution, type KnowledgeEntry } from "@/lib/chat";
import { businessProfileKnowledge, effectiveChatKnowledge } from "@/lib/chat-knowledge";
import { answerCustomerChat, CustomerChatError } from "@/lib/customer-chat-server";
import { processChatLeadNotification } from "@/lib/chat-lead-notifications";

export const runtime = "nodejs";
const reply = (body: object, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
const hash = (value: string) => createHash("sha256").update(value).digest("hex");

export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin) return reply({ error: "This request could not be verified." }, 403);
  const secret = process.env.CHAT_SESSION_SECRET?.trim() || process.env.DEMO_CALL_HASH_SECRET?.trim();
  if (!secret) return reply({ error: "Website chat is not configured yet. Please contact the business directly." }, 503);
  let body;
  try {
    const raw = await request.text();
    if (raw.length > 8000) return reply({ error: "Message is too long." }, 413);
    body = JSON.parse(raw) as Record<string, unknown>;
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error();
  } catch { return reply({ error: "Please check your message and try again." }, 400); }
  if (typeof body.workspace !== "string" || !/^[a-z0-9-]{1,100}$/.test(body.workspace)) return reply({ error: "Chat not found." }, 404);
  const message = typeof body.message === "string" ? body.message.trim() : "";
  const lead = body.lead && typeof body.lead === "object" ? body.lead as Record<string, unknown> : null;
  if ((!message && !lead) || message.length > 1000 || (message && lead)) return reply({ error: "Please enter a message of up to 1,000 characters." }, 400);
  const name = typeof lead?.name === "string" ? lead.name.trim() : "";
  const email = typeof lead?.email === "string" ? lead.email.trim() : "";
  const phone = typeof lead?.phone === "string" ? lead.phone.trim() : "";
  const leadRequest = typeof lead?.request === "string" ? lead.request.trim() : "";
  if (lead && (!leadRequest || leadRequest.length > 2000 || !name || name.length > 100 || email.length > 200 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || phone.length > 40 || lead.consent !== true)) return reply({ error: "Enter your name, valid email, and permission to contact you." }, 400);
  if (body.sessionToken !== undefined && (typeof body.sessionToken !== "string" || !/^[a-f0-9]{64}$/.test(body.sessionToken))) return reply({ error: "Please reload to start a new conversation." }, 401);
  try {
    const admin = getSupabaseAdmin();
    const { data: client, error: clientError } = await admin.from("clients").select("id,business_name,services,service_area,business_hours,timezone").eq("slug", body.workspace).maybeSingle();
    if (clientError) throw clientError;
    if (!client) return reply({ error: "Chat not found." }, 404);
    const { data: settings, error: settingsError } = await admin.from("website_chat_settings").select("enabled,use_business_profile,engine").eq("client_id", client.id).maybeSingle();
    if (settingsError) throw settingsError;
    if (!settings?.enabled) return reply({ error: "This business has paused website chat." }, 409);
    let sessionToken = body.sessionToken as string | undefined;
    if (!sessionToken) {
      sessionToken = randomBytes(32).toString("hex");
      const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
      const { error } = await admin.rpc("start_website_chat", { p_client_id: client.id, p_token_hash: hash(sessionToken), p_ip_hash: createHmac("sha256", secret).update(ip).digest("hex"), p_attribution: parseAttribution(body.attribution) });
      if (error) throw error;
    }
    if (lead) {
      const now = new Date().toISOString();
      const { data, error } = await admin.from("website_chats").update({ lead_name: name, lead_email: email, lead_phone: phone || null, lead_request: leadRequest, lead_captured_at: now, contact_consent_at: now, updated_at: now }).eq("client_id", client.id).eq("access_token_hash", hash(sessionToken)).is("lead_captured_at", null).gte("created_at", new Date(Date.now() - 86_400_000).toISOString()).select("id").maybeSingle();
      if (error) throw error;
      if (!data) return reply({ error: "These details were already submitted or the session expired. Please reload to start again." }, 409);
      // The database already queued the notification with the saved lead. Delivery
      // runs after the response and cannot turn a saved request into a false failure.
      after(() => processChatLeadNotification({ clientId: client.id, chatId: data.id }));
      return reply({ ok: true, sessionToken });
    }
    const { data: entries, error: entriesError } = await admin.from("website_knowledge").select("id,title,content,keywords").eq("client_id", client.id).eq("published", true).limit(200);
    if (entriesError) throw entriesError;
    const profile = settings.use_business_profile ? businessProfileKnowledge(client) : [];
    const knowledge = effectiveChatKnowledge(profile, (entries ?? []) as KnowledgeEntry[]);
    if (settings.engine === "retell") {
      const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
      const answer = await answerCustomerChat({ clientId: client.id, businessName: client.business_name, knowledge, message, sessionToken, ip });
      return reply({ ok: true, sessionToken, answer });
    }
    const answer = answerFromKnowledge(message, knowledge);
    const { error } = await admin.rpc("record_website_chat_turn", { p_client_id: client.id, p_token_hash: hash(sessionToken), p_user: message, p_answer: answer.content, p_source: answer.source ?? null });
    if (error) throw error;
    return reply({ ok: true, sessionToken, answer });
  } catch (caught) {
    if (caught instanceof CustomerChatError) return reply({ error: caught.message, sessionToken: caught.sessionToken, ...(caught.resetSession ? { resetSession: true } : {}) }, caught.status);
    const detail = caught && typeof caught === "object" && "message" in caught ? String(caught.message) : "";
    if (detail.includes("rate_limit")) return reply({ error: "Please wait a moment before trying again. This chat allows up to 40 questions per session." }, 429);
    if (detail.includes("session_expired")) return reply({ error: "This session has expired. Please reload to start again." }, 401);
    return reply({ error: "Chat is temporarily unavailable. Please contact the business directly." }, 503);
  }
}
