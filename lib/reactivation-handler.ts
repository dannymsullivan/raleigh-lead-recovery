import "server-only";

import { contactStatusForOutcome, isPriorityOutcome } from "./reactivation";
import { buildInterestedLeadSms, type ReactivationReport } from "./reactivation-webhook";
import { getSupabaseAdmin } from "./supabase-server";
import type { Client, ReactivationContact } from "./types";
import { hasAlertSmsConsent } from "./messaging-consent";

export async function processReactivationReport(
  report: ReactivationReport,
  rawPayload: unknown,
  sendSms: (message: { to: string; body: string }) => Promise<void>
): Promise<{ status: string; alert: string }> {
  if (report.eventType !== "call_analyzed") return { status: "ignored", alert: "skipped" };
  if (!report.callId || !report.clientId || !report.campaignId || !report.contactId) return { status: "invalid", alert: "skipped" };
  const admin = getSupabaseAdmin();
  const [{ data: contactData }, { data: clientData }, { data: campaignData }] = await Promise.all([
    admin.from("reactivation_contacts").select("*").eq("id", report.contactId).eq("client_id", report.clientId).eq("campaign_id", report.campaignId).maybeSingle(),
    admin.from("clients").select("*").eq("id", report.clientId).maybeSingle(),
    admin.from("reactivation_campaigns").select("max_attempts").eq("id", report.campaignId).eq("client_id", report.clientId).maybeSingle()
  ]);
  if (!contactData || !clientData || !campaignData) return { status: "unmatched", alert: "skipped" };
  const contact = contactData as ReactivationContact;
  const client = clientData as Client;
  const now = new Date();
  const nextAttempt = report.outcome === "no_answer" && contact.attempt_count < Number(campaignData.max_attempts)
    ? new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()
    : null;

  const { data: attempt, error: attemptError } = await admin.from("reactivation_attempts").upsert({
    client_id: report.clientId,
    campaign_id: report.campaignId,
    contact_id: report.contactId,
    retell_call_id: report.callId,
    status: "completed",
    outcome: report.outcome,
    summary: report.summary,
    transcript: report.transcript,
    recording_url: report.recordingUrl,
    duration_seconds: report.durationSeconds,
    structured_data: report.structuredData,
    raw_payload: rawPayload,
    error: report.outcome === "failed" ? "Call ended without a recognized outcome" : null
  }, { onConflict: "retell_call_id" }).select("id,owner_alert_sent_at").single();
  if (attemptError) throw attemptError;

  const { error: contactError } = await admin.from("reactivation_contacts").update({
    status: contactStatusForOutcome(report.outcome),
    outcome: report.outcome,
    project_type: report.projectType,
    requested_timing: report.requestedTiming,
    qualification_notes: report.qualificationNotes ?? report.summary,
    next_step: report.nextStep,
    next_attempt_at: nextAttempt
  }).eq("id", report.contactId).eq("client_id", report.clientId);
  if (contactError) throw contactError;

  if (report.optOut) {
    await admin.from("suppression_entries").upsert({ client_id: report.clientId, phone_e164: contact.phone_e164, reason: "opt_out", source: "retell_call" }, { onConflict: "client_id,phone_e164" });
  }
  if (report.outcome === "interested_now" && report.nextStep === "book_inspection") {
    await admin.from("reactivation_appointments").upsert({ client_id: report.clientId, campaign_id: report.campaignId, contact_id: report.contactId, requested_window: report.requestedTiming, status: "requested" }, { onConflict: "contact_id" });
  }
  if (!isPriorityOutcome(report.outcome) || attempt.owner_alert_sent_at) return { status: "processed", alert: "skipped" };
  if (!hasAlertSmsConsent(client)) return { status: "processed", alert: "no_consent" };

  const { data: claimed } = await admin.from("reactivation_attempts").update({ owner_alert_sent_at: now.toISOString() }).eq("id", attempt.id).is("owner_alert_sent_at", null).select("id").maybeSingle();
  if (!claimed) return { status: "processed", alert: "already_sent" };
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://snappyleads.xyz").replace(/\/$/, "");
  try {
    await sendSms({
      to: client.alert_phone || client.owner_phone,
      body: buildInterestedLeadSms(client.business_name, contact.name, contact.phone_e164, report.requestedTiming, `${appUrl}/dashboard/reactivation?lead=${contact.id}`)
    });
    return { status: "processed", alert: "sent" };
  } catch (error) {
    await admin.from("reactivation_attempts").update({ owner_alert_sent_at: null, error: `Owner alert failed: ${error instanceof Error ? error.message : "unknown"}`.slice(0, 500) }).eq("id", attempt.id);
    return { status: "processed", alert: "failed" };
  }
}
