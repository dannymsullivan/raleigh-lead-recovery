import { NextRequest, NextResponse } from "next/server";
import {
  claimSmsSend,
  findClientByRetellIds,
  markSmsSent,
  releaseSmsClaim,
  upsertCall
} from "@/lib/supabase-server";
import { sendRetellSms, verifyRetellWebhook } from "@/lib/retell";
import { processRetellWebhook } from "@/lib/webhook";
import { processReactivationReport } from "@/lib/reactivation-handler";
import { extractReactivationReport } from "@/lib/reactivation-webhook";
import { extractPublicDemoCallEvent, processPublicDemoCallEvent } from "@/lib/public-demo-webhook";

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
