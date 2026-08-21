import type { Call, Client, ExtractedRetellCall } from "./types";
import { extractRetellCall } from "./retell";
import { hasAlertSmsConsent } from "./messaging-consent";

export type SmsMessage = {
  to: string;
  body: string;
};

export type WebhookStore = {
  findClientByRetellIds(ids: { agentId: string | null; phoneNumber: string | null }): Promise<Client | null>;
  upsertCall(clientId: string, call: ExtractedRetellCall, rawPayload: unknown, now: Date): Promise<Call>;
  claimSmsSend(retellCallId: string, now: Date): Promise<boolean>;
  markSmsSent(retellCallId: string, sentAt: Date): Promise<void>;
  releaseSmsClaim(retellCallId: string, error: string): Promise<void>;
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

export function shouldSendOwnerSms(call: Pick<ExtractedRetellCall, "leadType">): boolean {
  return call.leadType !== "spam";
}

export function buildOwnerSms(call: ExtractedRetellCall): string {
  const caller = call.callerName ?? "Unknown caller";
  const issue = call.issueDescription ?? call.summary ?? "No issue captured";
  const callback = call.callbackNumber ?? call.callerNumber ?? "No callback number";
  const address = call.serviceAddress ?? "No address captured";
  const timing = call.requestedTiming ?? "Timing not captured";

  return `Raleigh Lead Recovery alert: CAUGHT MISSED CALL (${call.urgency}): ${caller} - ${issue}. Call: ${callback}. Addr: ${address}. Wants: ${timing}. Reply STOP to unsubscribe; HELP for help.`;
}

export async function processRetellWebhook(payload: unknown, deps: WebhookDeps): Promise<WebhookProcessingResult> {
  const logger = deps.logger ?? console;
  const now = deps.now?.() ?? new Date();
  const extracted = extractRetellCall(payload);

  if (extracted.eventType !== "call_analyzed") {
    return { status: "ignored", reason: "non_report_event" };
  }

  if (!extracted.retellCallId) {
    logger.warn("Retell analyzed-call webhook missing call id");
    return { status: "invalid", reason: "missing_call_id" };
  }

  const client = await deps.store.findClientByRetellIds({
    agentId: extracted.agentId,
    phoneNumber: extracted.phoneNumber
  });

  if (!client) {
    logger.warn("No client matched Retell webhook", {
      agentId: extracted.agentId,
      phoneNumber: extracted.phoneNumber
    });
    return {
      status: "unmatched_client",
      assistantId: extracted.agentId,
      phoneNumberId: extracted.phoneNumber
    };
  }

  await deps.store.upsertCall(client.id, extracted, payload, now);

  if (!shouldSendOwnerSms(extracted) || !hasAlertSmsConsent(client)) {
    return { status: "processed", callId: extracted.retellCallId, sms: "skipped" };
  }

  const claimed = await deps.store.claimSmsSend(extracted.retellCallId, now);
  if (!claimed) {
    return { status: "processed", callId: extracted.retellCallId, sms: "already_claimed" };
  }

  try {
    await deps.sendOwnerSms({
      to: client.alert_phone || client.owner_phone,
      body: buildOwnerSms(extracted)
    });
    await deps.store.markSmsSent(extracted.retellCallId, now);
    return { status: "processed", callId: extracted.retellCallId, sms: "sent" };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown SMS error";
    logger.error("Owner SMS failed", { callId: extracted.retellCallId, error: message });
    await deps.store.releaseSmsClaim(extracted.retellCallId, message);
    return { status: "processed", callId: extracted.retellCallId, sms: "failed" };
  }
}
