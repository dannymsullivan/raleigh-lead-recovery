import { createHmac } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { adminCookie, verifyAdminSessionToken } from "@/lib/admin";
import { getRetellClient } from "@/lib/retell";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { parseWebDemoMode, webDemoAgentId, webDemoDynamicVariables } from "@/lib/web-demo-config";

export const runtime = "nodejs";

function clientIp(request: NextRequest): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")?.trim()
    || "unknown";
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const origin = request.headers.get("origin");
  if (!origin || origin !== request.nextUrl.origin) {
    return NextResponse.json({ ok: false, error: "This request could not be verified." }, { status: 403 });
  }

  const hashSecret = process.env.DEMO_CALL_HASH_SECRET?.trim();
  if (!hashSecret || !process.env.RETELL_API_KEY?.trim()) {
    return NextResponse.json({ ok: false, error: "The live demo is being configured." }, { status: 503 });
  }

  let body: Record<string, unknown> = {};
  try {
    const parsed = await request.json();
    body = parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    // An empty body is valid.
  }
  if (typeof body.website === "string" && body.website.trim()) {
    return NextResponse.json({ ok: false, error: "Unable to start the demo." }, { status: 400 });
  }
  const mode = parseWebDemoMode(body.mode);
  if (!mode) {
    return NextResponse.json({ ok: false, error: "Unable to start the demo." }, { status: 400 });
  }
  const agentId = webDemoAgentId(mode);
  if (!agentId) {
    return NextResponse.json({ ok: false, error: "The live demo is being configured." }, { status: 503 });
  }

  let requestId: string | undefined;
  try {
  const admin = getSupabaseAdmin();
  const ipHash = createHmac("sha256", hashSecret).update(clientIp(request)).digest("hex");
  const ownerSession = request.cookies.get(adminCookie.name)?.value;
  const { data, error } = await admin.rpc("create_public_web_call_request", {
    p_ip_hash: ipHash,
    p_bypass_rate_limits: verifyAdminSessionToken(ownerSession)
  });
  if (error) {
    const limited = error.message.includes("rate_limit");
    return NextResponse.json({ ok: false, error: limited ? "You’ve reached today’s browser-demo limit." : "The live demo is temporarily unavailable." }, { status: limited ? 429 : 503 });
  }

  requestId = data as string;
    const call = await getRetellClient().call.createWebCall({
      agent_id: agentId,
      agent_version: "latest_published",
      metadata: { app: "public-web-demo", requestId, mode },
      retell_llm_dynamic_variables: webDemoDynamicVariables(mode)
    });
    await admin.from("public_web_call_requests").update({ retell_call_id: call.call_id, status: "in_progress" }).eq("id", requestId);
    return NextResponse.json({ ok: true, callId: call.call_id, accessToken: call.access_token, transport: call.transport, iceServers: call.ice_servers }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown_error";
    if (requestId) {
      try { await getSupabaseAdmin().from("public_web_call_requests").update({ status: "failed", error: message.slice(0, 300) }).eq("id", requestId); } catch { /* Preserve the safe response if the database is unavailable. */ }
    }
    return NextResponse.json({ ok: false, error: "The live demo is temporarily unavailable." }, { status: 503 });
  }
}
