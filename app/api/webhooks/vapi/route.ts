import { NextRequest, NextResponse } from "next/server";
import { isValidVapiSecret } from "@/lib/security";
import {
  claimSmsSend,
  findClientByVapiIds,
  markSmsSent,
  releaseSmsClaim,
  upsertCall
} from "@/lib/supabase-server";
import { sendTwilioSms } from "@/lib/sms";
import { processVapiWebhook } from "@/lib/webhook";
import { processReactivationReport } from "@/lib/reactivation-handler";
import { extractReactivationReport } from "@/lib/reactivation-webhook";

export const runtime = "nodejs";

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isValidVapiSecret(request.headers.get("x-vapi-secret"))) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const reactivation = extractReactivationReport(payload);
  if (reactivation) {
    const result = await processReactivationReport(reactivation, payload, sendTwilioSms);
    return NextResponse.json({ ok: true, result });
  }

  const result = await processVapiWebhook(payload, {
    store: {
      findClientByVapiIds,
      upsertCall,
      claimSmsSend,
      markSmsSent,
      releaseSmsClaim
    },
    sendOwnerSms: sendTwilioSms,
    logger: console
  });

  return NextResponse.json({ ok: true, result });
}
