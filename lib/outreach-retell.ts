import "server-only";

import { buildOutreachCallRequest, isWithinManualOutreachWindow } from "./outreach-call";
import type { OutreachProspect } from "./outreach";
import { normalizePhoneNumber } from "./phone";
import { getRetellClient } from "./retell";
import { getSupabaseAdmin } from "./supabase-server";

export const outreachCallLeaseMs = 15 * 60 * 1_000;

function hasActiveCallLease(value: string | null, now: Date): boolean {
  if (!value) return false;
  const startedAt = Date.parse(value);
  return !Number.isFinite(startedAt) || startedAt > now.getTime() - outreachCallLeaseMs;
}

function logPersistenceError(context: string, error: unknown): void {
  if (error) console.error(`[outreach] ${context}`, error);
}

function outreachIdentifiers(): { agentId: string; phoneNumber: string } {
  const agentId = process.env.RETELL_OUTREACH_AGENT_ID?.trim();
  const phoneNumber = process.env.RETELL_OUTREACH_PHONE_NUMBER?.trim();
  if (!process.env.RETELL_API_KEY?.trim() || !agentId || !phoneNumber) {
    throw new Error("Outreach calling is not configured.");
  }
  return { agentId, phoneNumber };
}

export function outreachCallingConfigured(): boolean {
  try {
    outreachIdentifiers();
    return true;
  } catch {
    return false;
  }
}

export async function queueOutreachProspectCall(
  prospectId: string,
  eligibilityAttested: boolean,
  now = new Date(),
): Promise<{ callId: string; attemptId: string }> {
  if (!eligibilityAttested) throw new Error("Confirm call eligibility before dialing.");
  if (!isWithinManualOutreachWindow(now)) throw new Error("Outreach calls are limited to weekdays from 9 AM to 5 PM Eastern.");

  const admin = getSupabaseAdmin();
  const { data, error } = await admin.from("outreach_prospects").select("*").eq("id", prospectId).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Prospect not found.");
  const prospect = data as OutreachProspect;
  const phoneE164 = normalizePhoneNumber(prospect.phone ?? "");
  if (!phoneE164) throw new Error("Prospect needs a valid phone number.");
  const { data: suppression, error: suppressionError } = await admin
    .from("outreach_suppression_entries")
    .select("phone_e164")
    .eq("phone_e164", phoneE164)
    .maybeSingle();
  if (suppressionError) throw suppressionError;
  if (prospect.do_not_call_at || prospect.last_call_outcome === "do_not_call") {
    throw new Error("This prospect is on the do-not-call list.");
  }
  if (suppression) throw new Error("This phone number is on the do-not-call list.");
  if (hasActiveCallLease(prospect.call_in_progress_at, now)) {
    throw new Error("A call is already in progress for this prospect.");
  }

  const attestedAt = now.toISOString();
  const { data: attempt, error: attemptError } = await admin.from("outreach_call_attempts").insert({
    prospect_id: prospect.id,
    status: "queued",
    eligibility_attested_at: attestedAt,
  }).select("id").single();
  if (attemptError) throw attemptError;

  const { data: claimed, error: claimError } = await admin.from("outreach_prospects").update({
    call_in_progress_at: attestedAt,
    automated_call_attempt_count: prospect.automated_call_attempt_count + 1,
  })
    .eq("id", prospect.id)
    .is("do_not_call_at", null)
    .or("last_call_outcome.is.null,last_call_outcome.neq.do_not_call")
    .or(`call_in_progress_at.is.null,call_in_progress_at.lt.${new Date(now.getTime() - outreachCallLeaseMs).toISOString()}`)
    .select("id")
    .maybeSingle();
  if (claimError) throw claimError;
  if (!claimed) {
    const { error: releaseError } = await admin
      .from("outreach_call_attempts")
      .update({ status: "failed", error: "Prospect was no longer eligible or was already being called." })
      .eq("id", attempt.id);
    logPersistenceError("failed to close an unclaimed attempt", releaseError);
    throw new Error("This prospect is no longer eligible or a call is already in progress.");
  }

  let call: { call_id: string };
  try {
    call = await getRetellClient().call.createPhoneCall(
      buildOutreachCallRequest(prospect, outreachIdentifiers(), attempt.id as string),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Retell error";
    const [attemptResult, prospectResult] = await Promise.all([
      admin.from("outreach_call_attempts").update({ status: "failed", error: message.slice(0, 500) }).eq("id", attempt.id),
      admin
        .from("outreach_prospects")
        .update({ call_in_progress_at: null })
        .eq("id", prospect.id)
        .eq("call_in_progress_at", attestedAt),
    ]);
    logPersistenceError("failed to record a rejected Retell call", attemptResult.error);
    logPersistenceError("failed to release a rejected Retell call", prospectResult.error);
    throw error;
  }

  const [attemptResult, prospectResult] = await Promise.all([
    admin.from("outreach_call_attempts").update({ retell_call_id: call.call_id, status: "in_progress" }).eq("id", attempt.id),
    admin
      .from("outreach_prospects")
      .update({ last_retell_call_id: call.call_id })
      .eq("id", prospect.id)
      .eq("call_in_progress_at", attestedAt),
  ]);
  // Retell has accepted the call. Keep the lease in place even if either bookkeeping
  // write fails; the signed call_analyzed webhook can still reconcile the attempt.
  logPersistenceError("call started but attempt bookkeeping failed", attemptResult.error);
  logPersistenceError("call started but prospect bookkeeping failed", prospectResult.error);
  return { callId: call.call_id, attemptId: attempt.id as string };
}
