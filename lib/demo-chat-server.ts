import "server-only";

import { createHash, createHmac, randomBytes, randomUUID } from "node:crypto";
import { getSupabaseAdmin } from "./supabase-server";
import { getRetellClient } from "./retell";
import { demoKnowledge } from "@/lib/demo-knowledge";
import { getResearchDemo } from "./research-demo-knowledge";
import type { KnowledgeEntry } from "./chat";
import researchResources from "@/config/research-retell.json";

type Source = { id: string; title: string; content: string };
export type DemoAnswer = { content: string; source?: string; sources?: Source[] };

export class DemoChatError extends Error {
  constructor(message: string, public status: number, public sessionToken?: string, public resetSession = false) {
    super(message);
    this.name = "DemoChatError";
  }
}

const digest = (value: string) => createHash("sha256").update(value).digest("hex");
const providerOptions = { timeout: 20_000, maxRetries: 0 };

/** Only agent text and IDs present in our public demo library cross this boundary. */
export function parseDemoCompletion(value: unknown, knowledge: KnowledgeEntry[] = demoKnowledge): DemoAnswer {
  const messages = value && typeof value === "object" && "messages" in value ? value.messages : null;
  if (!Array.isArray(messages)) throw new Error("Invalid provider response");
  let content = messages.filter((message): message is { role: "agent"; content: string } =>
    Boolean(message && typeof message === "object" && message.role === "agent" && typeof message.content === "string")
  ).map((message) => message.content.trim()).filter(Boolean).join("\n\n");
  // Retell can append the marker to the last sentence despite the newline
  // instruction. Accept either spacing while still allowing only source IDs.
  const marker = content.match(/(?:^|\s)SOURCES:\s*([a-z0-9-]+(?:\s*,\s*[a-z0-9-]+)*)\s*$/i);
  const ids = new Set((marker?.[1] ?? "").split(",").map((id) => id.trim()).filter((id) => /^[a-z0-9-]+$/.test(id)));
  if (marker) content = content.slice(0, marker.index).trim();
  // This is plain text, never model-supplied HTML or a markdown link destination.
  content = content.replace(/^SOURCES:.*$/gim, "").replace(/<[^>]*>/g, "").replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1").replace(/^#{1,6}\s+/gm, "").trim();
  if (!content) throw new Error("Empty provider response");
  if (content.length > 3500) content = `${content.slice(0, 3499).trimEnd()}…`;
  const sources = knowledge.filter((entry) => entry.published !== false && ids.has(entry.id)).slice(0, 6)
    .map(({ id, title, content: sourceContent }) => ({ id, title, content: sourceContent }));
  return { content, ...(sources.length ? { sources, source: sources.map((entry) => entry.title).join(" · ") } : {}) };
}

function failure(caught: unknown, sessionToken?: string): DemoChatError {
  if (caught instanceof DemoChatError) return caught;
  const detail = caught && typeof caught === "object" && "message" in caught ? String(caught.message) : "";
  if (/demo_session_expired/.test(detail)) return new DemoChatError("This demo conversation has expired. Start a new conversation to continue.", 401, sessionToken, true);
  if (/demo_session_busy/.test(detail)) return new DemoChatError("Your previous question is still being answered. Please wait a moment.", 409, sessionToken);
  if (/demo_message_replayed/.test(detail)) return new DemoChatError("That question was just answered. Please wait a moment before sending it again.", 409, sessionToken);
  if (/demo_rate_limit_session/.test(detail)) return new DemoChatError("You’ve reached this demo’s 6-question limit. Keep exploring the free knowledge base, or see what this could do for your business.", 429, sessionToken);
  if (/demo_rate_limit_ip/.test(detail)) return new DemoChatError("This network has reached the daily AI demo limit. Please try again in 24 hours. The knowledge base is still free to browse.", 429, sessionToken);
  if (/demo_rate_limit_global/.test(detail)) return new DemoChatError("Today’s live AI demo allowance has been used. Please try again tomorrow. You can still explore every topic in the free knowledge base.", 429, sessionToken);
  if (/demo_rate_limit/.test(detail)) return new DemoChatError("Live AI demo access is temporarily limited. Keep exploring the free knowledge base, or get in touch about your own assistant.", 429, sessionToken);
  const status = caught && typeof caught === "object" && "status" in caught ? caught.status : null;
  if ((status === 400 || status === 404 || status === 409) && /chat.{0,100}(ended|expired|not found|not ongoing|does not exist)|(?:ended|expired|invalid).{0,40}chat/i.test(detail)) {
    return new DemoChatError("This demo conversation has ended. Start a new conversation to continue.", 401, sessionToken, true);
  }
  return new DemoChatError("The demo could not finish this answer. Please try again in a moment.", 503, sessionToken);
}

export async function answerDemoChat(message: string, existingToken: string | undefined, ip: string, niche?: string): Promise<{ answer: DemoAnswer; sessionToken: string }> {
  const research = niche ? getResearchDemo(niche) : undefined;
  if (niche && !research) throw new DemoChatError("Please choose one of the available industry demos.", 400);
  const secret = process.env.CHAT_SESSION_SECRET?.trim() || process.env.DEMO_CALL_HASH_SECRET?.trim();
  const agentId = research ? (researchResources as { agentId?: string }).agentId : process.env.RETELL_CHAT_DEMO_AGENT_ID?.trim();
  if (!secret || !agentId || !process.env.RETELL_API_KEY?.trim()) throw new DemoChatError("The live demo is temporarily unavailable. Please try again shortly.", 503, existingToken);
  const sessionToken = existingToken || randomBytes(32).toString("hex");
  // Namespace the capability by industry, while retaining the shared IP/global
  // budget. A token from another demo cannot resume or close this conversation.
  const tokenHash = digest(niche ? `${niche}:${sessionToken}` : sessionToken);
  const ipHash = createHmac("sha256", secret).update(ip).digest("hex");
  const claimId = randomUUID();
  let claimed = false;
  let allocated = Boolean(existingToken);
  let admin: ReturnType<typeof getSupabaseAdmin> | undefined;
  try {
    admin = getSupabaseAdmin();
    // The database serializes quota checks and claims before any paid provider call.
    const { data: claim, error: claimError } = await admin.rpc("claim_public_demo_chat_turn", {
      p_token_hash: tokenHash,
      p_ip_hash: ipHash,
      p_claim_id: claimId,
      p_message_hash: createHmac("sha256", secret).update(message).digest("hex"),
      p_create: !existingToken,
    });
    if (claimError) throw claimError;
    if (!claim || typeof claim !== "object" || !("chat_id" in claim)) throw new Error("Invalid demo claim");
    claimed = true;
    allocated = true;
    const retell = getRetellClient();
    let chatId = typeof claim.chat_id === "string" && claim.chat_id ? claim.chat_id : undefined;
    if (!chatId) {
      const created = await retell.chat.create({ agent_id: agentId, agent_version: "latest_published", ...(research ? { retell_llm_dynamic_variables: {
        research_business_name: research.name,
        research_handbook: research.knowledge.map((entry) => `SOURCE_ID: ${entry.id}\nTITLE: ${entry.title}\n${entry.content}`).join("\n\n---\n\n"),
      } } : {}) }, providerOptions);
      chatId = created.chat_id;
      if (typeof chatId !== "string" || !chatId || chatId.length > 200) throw new Error("Invalid provider chat");
      const { data: attached, error: attachError } = await admin.rpc("attach_public_demo_chat", { p_token_hash: tokenHash, p_claim_id: claimId, p_chat_id: chatId });
      if (attachError || attached !== true) throw attachError || new Error("Demo claim expired");
    }
    const completion = await retell.chat.createChatCompletion({ chat_id: chatId, content: message }, providerOptions);
    const answer = parseDemoCompletion(completion, research?.knowledge ?? demoKnowledge);
    const { data: released, error: releaseError } = await admin.rpc("finish_public_demo_chat_turn", { p_token_hash: tokenHash, p_claim_id: claimId, p_success: true });
    if (releaseError || released !== true) throw releaseError || new Error("Demo claim expired");
    claimed = false;
    return { answer, sessionToken };
  } catch (caught) {
    if (claimed && admin) {
      // Failed attempts still consume quota. A failed release expires with the lease.
      try { await admin.rpc("finish_public_demo_chat_turn", { p_token_hash: tokenHash, p_claim_id: claimId, p_success: false }); } catch { /* Never leak provider or storage details. */ }
    }
    const mapped = failure(caught, allocated ? sessionToken : existingToken);
    if (research) mapped.message = mapped.message.replaceAll("AI demo", "demo").replaceAll("free knowledge base", "sample knowledge base");
    throw mapped;
  }
}

/** Close only the provider session bound to this capability and network. */
export async function endDemoChat(sessionToken: string, ip: string, niche?: string): Promise<void> {
  if (niche && !getResearchDemo(niche)) throw new DemoChatError("Please choose one of the available industry demos.", 400);
  const secret = process.env.CHAT_SESSION_SECRET?.trim() || process.env.DEMO_CALL_HASH_SECRET?.trim();
  if (!secret || !process.env.RETELL_API_KEY?.trim()) throw new DemoChatError("The demo could not close this conversation. Please try again shortly.", 503);
  try {
    const { data: session, error } = await getSupabaseAdmin().rpc("end_public_demo_chat", {
      p_token_hash: digest(niche ? `${niche}:${sessionToken}` : sessionToken),
      p_ip_hash: createHmac("sha256", secret).update(ip).digest("hex"),
    });
    if (error) throw error;
    if (!session || typeof session !== "object" || !("chat_id" in session)) throw new Error("Invalid demo session");
    // The database expires this capability without deleting the attempts that
    // enforce network/site budgets. A repeated close can retry provider cleanup.
    if (session.chat_id === null) return;
    if (typeof session.chat_id !== "string" || !session.chat_id || session.chat_id.length > 200) throw new Error("Invalid provider chat");
    try {
      await getRetellClient().chat.end(session.chat_id, providerOptions);
    } catch (caught) {
      const detail = caught && typeof caught === "object" && "message" in caught ? String(caught.message) : "";
      const status = caught && typeof caught === "object" && "status" in caught ? caught.status : null;
      if (!((status === 400 || status === 404 || status === 409) && /chat.{0,100}(ended|expired|not found|not ongoing|does not exist)|(?:ended|expired|invalid).{0,40}chat/i.test(detail))) throw caught;
    }
  } catch (caught) {
    const mapped = failure(caught);
    if (mapped.status === 503) throw new DemoChatError("The demo could not close this conversation. Please try again shortly.", 503);
    throw mapped;
  }
}
