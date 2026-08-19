import { createHmac } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import {
  buildPublicDemoCallRequest,
  isPublicDemoCallingWindow,
  parsePublicDemoCallInput,
  PUBLIC_DEMO_CONSENT_TEXT,
  PUBLIC_DEMO_CONSENT_VERSION
} from "@/lib/public-demo-call";

export const runtime = "nodejs";

type VapiCall = { id?: string };

function requiredEnv(key: string): string {
  const value = process.env[key]?.trim();
  if (!value) throw new Error(`missing_${key.toLowerCase()}`);
  return value;
}

function fingerprint(value: string, secret: string): string {
  return createHmac("sha256", secret).update(value).digest("hex");
}

function clientIp(request: NextRequest): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")?.trim()
    || "unknown";
}

function friendlyValidationError(error: unknown): string {
  const code = error instanceof Error ? error.message : "invalid_request";
  if (code === "consent_required") return "Please confirm the one-time call and recording consent.";
  if (code === "phone_invalid") return "Enter a valid U.S. or Canadian phone number.";
  if (code.includes("required")) return "Please complete your name and phone number.";
  return "Please check the form and try again.";
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const origin = request.headers.get("origin");
  if (!origin || origin !== request.nextUrl.origin) {
    return NextResponse.json({ ok: false, error: "This request could not be verified." }, { status: 403 });
  }

  if (!isPublicDemoCallingWindow()) {
    return NextResponse.json({ ok: false, error: "Demo calls are available daily from 9 AM to 8 PM Eastern." }, { status: 409 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "Please check the form and try again." }, { status: 400 });
  }
  if (typeof body.website === "string" && body.website.trim()) {
    return NextResponse.json({ ok: true, message: "Your demo call is on its way." }, { status: 202 });
  }

  let input;
  try {
    input = parsePublicDemoCallInput(body);
  } catch (error) {
    return NextResponse.json({ ok: false, error: friendlyValidationError(error) }, { status: 400 });
  }

  let admin;
  let requestId: string | null = null;
  try {
    const apiKey = requiredEnv("VAPI_API_KEY");
    const verticalAssistantId = {
      general: undefined,
      hvac: process.env.VAPI_HVAC_DEMO_ASSISTANT_ID?.trim(),
      plumbing: process.env.VAPI_PLUMBING_DEMO_ASSISTANT_ID?.trim(),
      roofing: process.env.VAPI_ROOFING_DEMO_ASSISTANT_ID?.trim(),
      real_estate: process.env.VAPI_REAL_ESTATE_DEMO_ASSISTANT_ID?.trim(),
      home_services: process.env.VAPI_HOME_SERVICES_DEMO_ASSISTANT_ID?.trim(),
      events: process.env.VAPI_EVENTS_DEMO_ASSISTANT_ID?.trim()
    }[input.demoType];
    const assistantId = verticalAssistantId || requiredEnv("VAPI_OUTBOUND_ASSISTANT_ID");
    const phoneNumberId = requiredEnv("VAPI_OUTBOUND_PHONE_NUMBER_ID");
    const hashSecret = process.env.DEMO_CALL_HASH_SECRET?.trim() || requiredEnv("VAPI_WEBHOOK_SECRET");
    admin = getSupabaseAdmin();
    const { data, error } = await admin.rpc("create_public_demo_call_request", {
      p_name: input.name,
      p_business_name: input.businessName,
      p_phone_e164: input.phoneE164,
      p_phone_hash: fingerprint(input.phoneE164, hashSecret),
      p_ip_hash: fingerprint(clientIp(request), hashSecret),
      p_consent_version: PUBLIC_DEMO_CONSENT_VERSION,
      p_consent_text: PUBLIC_DEMO_CONSENT_TEXT,
      p_user_agent: request.headers.get("user-agent") || "unknown"
    });
    if (error) {
      if (error.message.includes("rate_limit")) {
        return NextResponse.json({ ok: false, error: "That number or connection has reached the demo-call limit. Please try again later." }, { status: 429 });
      }
      throw error;
    }
    requestId = data as string;

    const vapiResponse = await fetch("https://api.vapi.ai/call", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(buildPublicDemoCallRequest(input, { assistantId, phoneNumberId, requestId }))
    });
    if (!vapiResponse.ok) throw new Error(`vapi_call_failed_${vapiResponse.status}`);
    const call = await vapiResponse.json() as VapiCall;
    if (!call.id) throw new Error("vapi_call_id_missing");
    await admin.from("public_demo_call_requests").update({ vapi_call_id: call.id, status: "in_progress", updated_at: new Date().toISOString() }).eq("id", requestId);
    return NextResponse.json({ ok: true, message: "Mabel is calling now. It may take up to a minute." }, { status: 202 });
  } catch (error) {
    if (admin && requestId) {
      const message = error instanceof Error ? error.message : "unknown_error";
      await admin.from("public_demo_call_requests").update({ status: "failed", error: message.slice(0, 300), updated_at: new Date().toISOString() }).eq("id", requestId);
    }
    console.error("Public demo call failed", { requestId, error: error instanceof Error ? error.message : "unknown_error" });
    return NextResponse.json({ ok: false, error: "The live demo is temporarily unavailable. Please try again shortly." }, { status: 503 });
  }
}
