import { createHmac } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { getRetellClient, requiredRetellApiKey } from "@/lib/retell";
import {
  buildPublicDemoCallRequest,
  isPublicDemoCallingWindow,
  hasElevatedPublicDemoLimit,
  parsePublicDemoCallInput,
  PUBLIC_DEMO_CONSENT_TEXT,
  PUBLIC_DEMO_CONSENT_VERSION
} from "@/lib/public-demo-call";

export const runtime = "nodejs";

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
    requiredRetellApiKey();
    const verticalAgentId = {
      general: undefined,
      hvac: process.env.RETELL_HVAC_DEMO_AGENT_ID?.trim(),
      plumbing: process.env.RETELL_PLUMBING_DEMO_AGENT_ID?.trim(),
      roofing: process.env.RETELL_ROOFING_DEMO_AGENT_ID?.trim(),
      real_estate: process.env.RETELL_REAL_ESTATE_DEMO_AGENT_ID?.trim(),
      home_services: process.env.RETELL_HOME_SERVICES_DEMO_AGENT_ID?.trim(),
      events: process.env.RETELL_EVENTS_DEMO_AGENT_ID?.trim()
    }[input.demoType];
    const agentId = verticalAgentId || requiredEnv("RETELL_DEMO_AGENT_ID");
    const phoneNumber = requiredEnv("RETELL_DEMO_PHONE_NUMBER");
    const hashSecret = requiredEnv("DEMO_CALL_HASH_SECRET");
    admin = getSupabaseAdmin();
    const { data, error } = await admin.rpc("create_public_demo_call_request_v2", {
      p_name: input.name,
      p_business_name: input.businessName,
      p_phone_e164: input.phoneE164,
      p_phone_hash: fingerprint(input.phoneE164, hashSecret),
      p_ip_hash: fingerprint(clientIp(request), hashSecret),
      p_consent_version: PUBLIC_DEMO_CONSENT_VERSION,
      p_consent_text: PUBLIC_DEMO_CONSENT_TEXT,
      p_user_agent: request.headers.get("user-agent") || "unknown",
      p_bypass_rate_limits: hasElevatedPublicDemoLimit(input.phoneE164)
    });
    if (error) {
      if (error.message.includes("rate_limit")) {
        return NextResponse.json({ ok: false, error: "That number or connection has reached the demo-call limit. Please try again later." }, { status: 429 });
      }
      throw error;
    }
    requestId = data as string;

    const call = await getRetellClient().call.createPhoneCall(buildPublicDemoCallRequest(input, { agentId, phoneNumber, requestId }));
    await admin.from("public_demo_call_requests").update({ retell_call_id: call.call_id, status: "in_progress", updated_at: new Date().toISOString() }).eq("id", requestId);
    return NextResponse.json({ ok: true, message: "Snappy Leads is calling now. It may take up to a minute." }, { status: 202 });
  } catch (error) {
    if (admin && requestId) {
      const message = error instanceof Error ? error.message : "unknown_error";
      await admin.from("public_demo_call_requests").update({ status: "failed", error: message.slice(0, 300), updated_at: new Date().toISOString() }).eq("id", requestId);
    }
    console.error("Public demo call failed", { requestId, error: error instanceof Error ? error.message : "unknown_error" });
    return NextResponse.json({ ok: false, error: "The live demo is temporarily unavailable. Please try again shortly." }, { status: 503 });
  }
}
