import "server-only";
import { createHash, createHmac, randomUUID } from "node:crypto";
import { getSupabaseAdmin } from "./supabase-server";
import { getRetellClient } from "./retell";
import type { KnowledgeEntry } from "./chat";
import { customerChatProviderOptions, customerKnowledgeHash, parseCustomerCompletion, rejectDemoChatResources } from "./customer-chat-config";

export class CustomerChatError extends Error {
  constructor(message: string, public status: number, public sessionToken: string, public resetSession = false) {
    super(message); this.name = "CustomerChatError";
  }
}

function customerChatFailure(caught: unknown, token: string, paidAttempt: boolean): CustomerChatError {
  const detail = caught && typeof caught === "object" && "message" in caught ? String(caught.message) : "";
  if (/chat_session_expired|chat_session_restart/.test(detail)) return new CustomerChatError("Please start a new conversation to use the latest business information. Your earlier request is still saved if you submitted one.", 401, token, true);
  if (/chat_session_busy|chat_message_replayed/.test(detail)) return new CustomerChatError("Please wait for the current answer before sending another question.", 409, token);
  if (/chat_rate_limit/.test(detail)) return new CustomerChatError("The assistant has reached its current question allowance. You can still ask the team to follow up below.", 429, token);
  if (/chat_ai_not_ready/.test(detail)) return new CustomerChatError("The assistant’s business information is being updated. You can still ask the team to follow up below.", 503, token);
  if (/chat_disabled/.test(detail)) return new CustomerChatError("This business has paused website chat.", 409, token);
  return new CustomerChatError(paidAttempt ? "This answer couldn’t be completed. Start a new conversation, or ask the team to follow up below." : "The assistant is temporarily unavailable. You can still ask the team to follow up below.", 503, token, paidAttempt);
}

export async function answerCustomerChat(input: { clientId: string; businessName: string; knowledge: KnowledgeEntry[]; message: string; sessionToken: string; ip: string }) {
  const secret = process.env.CHAT_SESSION_SECRET?.trim() || process.env.DEMO_CALL_HASH_SECRET?.trim();
  const tokenHash = createHash("sha256").update(input.sessionToken).digest("hex");
  const claimId = randomUUID();
  const admin = getSupabaseAdmin();
  let claimed = false;
  try {
    if (!secret || !process.env.RETELL_API_KEY?.trim()) throw new Error("Customer AI is not configured");
    const ipHash = createHmac("sha256", secret).update(input.ip).digest("hex");
    const { data: claim, error } = await admin.rpc("claim_customer_chat_turn", {
      p_client_id: input.clientId, p_token_hash: tokenHash, p_ip_hash: ipHash, p_claim_id: claimId,
      p_message_hash: createHmac("sha256", secret).update(input.message).digest("hex"),
      p_knowledge_hash: customerKnowledgeHash(input.businessName, input.knowledge),
    });
    if (error) throw error;
    if (!claim || typeof claim.agent_id !== "string" || !Number.isInteger(claim.agent_version)) throw new Error("Invalid customer chat claim");
    claimed = true;
    rejectDemoChatResources({ agentId: claim.agent_id, llmId: claim.llm_id, knowledgeBaseId: claim.knowledge_base_id });
    const retell = getRetellClient();
    let chatId = typeof claim.chat_id === "string" && claim.chat_id ? claim.chat_id : undefined;
    if (!chatId) {
      const created = await retell.chat.create({ agent_id: claim.agent_id, agent_version: claim.agent_version }, customerChatProviderOptions);
      chatId = created.chat_id;
      if (!chatId || chatId.length > 200) throw new Error("Invalid provider conversation");
      const { data: attached, error: attachError } = await admin.rpc("attach_customer_chat", { p_client_id: input.clientId, p_token_hash: tokenHash, p_claim_id: claimId, p_chat_id: chatId });
      if (attachError || attached !== true) throw attachError || new Error("Customer claim expired");
    }
    const completion = await retell.chat.createChatCompletion({ chat_id: chatId, content: input.message }, customerChatProviderOptions);
    const answer = parseCustomerCompletion(completion, input.knowledge);
    const { data: saved, error: saveError } = await admin.rpc("finish_customer_chat_turn", {
      p_client_id: input.clientId, p_token_hash: tokenHash, p_claim_id: claimId, p_success: true,
      p_user: input.message, p_answer: answer.content, p_source: answer.source ?? null,
    });
    if (saveError || saved !== true) throw saveError || new Error("Customer answer could not be saved");
    claimed = false;
    return answer;
  } catch (caught) {
    if (claimed) {
      try { await admin.rpc("finish_customer_chat_turn", { p_client_id: input.clientId, p_token_hash: tokenHash, p_claim_id: claimId, p_success: false }); } catch { /* The lease expires; never expose provider/storage internals. */ }
    }
    throw customerChatFailure(caught, input.sessionToken, claimed);
  }
}
