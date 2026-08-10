import type { Call, Client, ExtractedVapiCall } from "./types";
import { extractVapiCall } from "./vapi";

export type SmsMessage = {
  to: string;
  body: string;
};

export type WebhookStore = {
  findClientByVapiIds(ids: { assistantId: string | null; phoneNumberId: string | null }): Promise<Client | null>;
  upsertCall(clientId: string, call: ExtractedVapiCall, rawPayload: unknown, now: Date): Promise<Call>;
  claimSmsSend(vapiCallId: string, now: Date): Promise<boolean>;
  markSmsSent(vapiCallId: string, sentAt: Date): Promise<void>;
  releaseSmsClaim(vapiCallId: string, error: string): Promise<void>;
};

export type WebhookDeps = {
  store: WebhookStore;
  sendOwnerSms(message: SmsMessage): Promise<void>;
  logger?: Pick<Console, "warn" | "error" | "info">;
  now?: () => Date;
};

export type WebhookProcessingResult =
  | { status: "ignored"; reason: "non_report_event" }
  | { status: "invalid"; reason: "missing_call_id" }
  | { status: "unmatched_client"; assistantId: string | null; phoneNumberId: string | null }
  | { status: "processed"; callId: string; sms: "sent" | "skipped" | "already_claimed" | "failed" };

export function shouldSendOwnerSms(call: Pick<ExtractedVapiCall, "leadType">): boolean {
  return call.leadType !== "spam";
}

export function buildOwnerSms(call: ExtractedVapiCall): string {
  const caller = call.callerName ?? "Unknown caller";
  const issue = call.issueDescription ?? call.summary ?? "No issue captured";
  const callback = call.callbackNumber ?? call.callerNumber ?? "No callback number";
  const address = call.serviceAddress ?? "No address captured";
  const timing = call.requestedTiming ?? "Timing not captured";

  return `CAUGHT MISSED CALL (${call.urgency}): ${caller} - ${issue}. Call: ${callback}. Addr: ${address}. Wants: ${timing}.`;
}

export async function processVapiWebhook(payload: unknown, deps: WebhookDeps): Promise<WebhookProcessingResult> {
  const logger = deps.logger ?? console;
  const now = deps.now?.() ?? new Date();
  const extracted = extractVapiCall(payload);

  if (extracted.eventType !== "end-of-call-report") {
    return { status: "ignored", reason: "non_report_event" };
  }

  if (!extracted.vapiCallId) {
    logger.warn("Vapi end-of-call report missing call id");
    return { status: "invalid", reason: "missing_call_id" };
  }

  const client = await deps.store.findClientByVapiIds({
    assistantId: extracted.assistantId,
    phoneNumberId: extracted.phoneNumberId
  });

  if (!client) {
    logger.warn("No client matched Vapi webhook", {
      assistantId: extracted.assistantId,
      phoneNumberId: extracted.phoneNumberId
    });
    return {
      status: "unmatched_client",
      assistantId: extracted.assistantId,
      phoneNumberId: extracted.phoneNumberId
    };
  }

  await deps.store.upsertCall(client.id, extracted, payload, now);

  if (!shouldSendOwnerSms(extracted)) {
    return { status: "processed", callId: extracted.vapiCallId, sms: "skipped" };
  }

  const claimed = await deps.store.claimSmsSend(extracted.vapiCallId, now);
  if (!claimed) {
    return { status: "processed", callId: extracted.vapiCallId, sms: "already_claimed" };
  }

  try {
    await deps.sendOwnerSms({
      to: client.alert_phone || client.owner_phone,
      body: buildOwnerSms(extracted)
    });
    await deps.store.markSmsSent(extracted.vapiCallId, now);
    return { status: "processed", callId: extracted.vapiCallId, sms: "sent" };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown SMS error";
    logger.error("Owner SMS failed", { callId: extracted.vapiCallId, error: message });
    await deps.store.releaseSmsClaim(extracted.vapiCallId, message);
    return { status: "processed", callId: extracted.vapiCallId, sms: "failed" };
  }
}
