import { NextRequest, NextResponse } from "next/server";
import {
  claimSmsSend,
  findClientByRetellIds,
  getSupabaseAdmin,
  markSmsSent,
  releaseSmsClaim,
  upsertCall
} from "@/lib/supabase-server";
import { sendRetellSms, verifyRetellWebhook } from "@/lib/retell";
import { processRetellWebhook } from "@/lib/webhook";
import { processReactivationReport } from "@/lib/reactivation-handler";
import { extractReactivationReport } from "@/lib/reactivation-webhook";
import { extractPublicDemoCallEvent, processPublicDemoCallEvent } from "@/lib/public-demo-webhook";
import { extractOutreachCallReport, processOutreachCallReport } from "@/lib/outreach-webhook";

export const runtime = "nodejs";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const rawBody = await request.text();
  try {
    if (!(await verifyRetellWebhook(rawBody, request.headers.get("x-retell-signature")))) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }
  } catch {
    return NextResponse.json({ ok: false, error: "webhook_not_configured" }, { status: 503 });
  }
  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const outreach = extractOutreachCallReport(payload);
  if (outreach) {
    const admin = getSupabaseAdmin();
    const result = await processOutreachCallReport(outreach, payload, {
      async completeAttempt(attemptId, prospectId, callId, values) {
        const { data: existing, error: lookupError } = await admin
          .from("outreach_call_attempts")
          .select("prospect_id, retell_call_id, status, eligibility_attested_at")
          .eq("id", attemptId)
          .maybeSingle();
        if (lookupError) throw lookupError;
        if (
          !existing ||
          existing.prospect_id !== prospectId ||
          !["queued", "in_progress"].includes(existing.status) ||
          (existing.retell_call_id && existing.retell_call_id !== callId)
        ) return null;

        let query = admin
          .from("outreach_call_attempts")
          .update({ ...values, retell_call_id: callId })
          .eq("id", attemptId)
          .eq("prospect_id", prospectId)
          .in("status", ["queued", "in_progress"]);
        query = existing.retell_call_id
          ? query.eq("retell_call_id", callId)
          : query.is("retell_call_id", null);
        const { data, error } = await query.select("eligibility_attested_at").maybeSingle();
        if (error) throw error;
        return data?.eligibility_attested_at ?? null;
      },
      async updateProspect(prospectId, eligibilityAttestedAt, values) {
        const { data, error } = await admin
          .from("outreach_prospects")
          .update(values)
          .eq("id", prospectId)
          .eq("call_in_progress_at", eligibilityAttestedAt)
          .select("id")
          .maybeSingle();
        if (error) throw error;
        return Boolean(data);
      },
      async suppressPhone(phoneE164, prospectId, callId) {
        const { error } = await admin.from("outreach_suppression_entries").upsert({
          phone_e164: phoneE164,
          reason: "opt_out",
          source_prospect_id: prospectId,
          source_retell_call_id: callId,
        }, { onConflict: "phone_e164" });
        if (error) throw error;
      },
    });
    return NextResponse.json({ ok: true, result });
  }

  const reactivation = extractReactivationReport(payload);
  if (reactivation) {
    const result = await processReactivationReport(reactivation, payload, sendRetellSms);
    return NextResponse.json({ ok: true, result });
  }

  const publicDemo = extractPublicDemoCallEvent(payload);
  if (publicDemo) {
    const result = await processPublicDemoCallEvent(publicDemo);
    return NextResponse.json({ ok: true, result });
  }

  const result = await processRetellWebhook(payload, {
    store: {
      findClientByRetellIds,
      upsertCall,
      claimSmsSend,
      markSmsSent,
      releaseSmsClaim
    },
    sendOwnerSms: sendRetellSms,
    logger: console
  });

  return NextResponse.json({ ok: true, result });
}
