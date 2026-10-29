import { NextRequest, NextResponse } from "next/server";
import { DemoChatError, endDemoChat } from "@/lib/demo-chat-server";
import { getResearchNiche } from "@/lib/research-niches";

export const runtime = "nodejs";
export const maxDuration = 30;
const reply = (body: object, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin) return reply({ error: "This request could not be verified." }, 403);
  let body: Record<string, unknown>;
  try {
    const raw = await request.text();
    if (raw.length > 1000) return reply({ error: "Request is too large." }, 413);
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error();
    body = parsed as Record<string, unknown>;
  } catch { return reply({ error: "Please try closing the conversation again." }, 400); }
  if (typeof body.sessionToken !== "string" || !/^[a-f0-9]{64}$/.test(body.sessionToken)) return reply({ error: "This demo conversation has expired." }, 401);
  if (body.niche !== undefined && (typeof body.niche !== "string" || !getResearchNiche(body.niche))) return reply({ error: "Please choose an available industry demo." }, 400);
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  try {
    await endDemoChat(body.sessionToken, ip, body.niche as string | undefined);
    return reply({ ok: true });
  } catch (caught) {
    if (caught instanceof DemoChatError) return reply({ error: caught.message }, caught.status);
    return reply({ error: "The demo could not close this conversation. Please try again shortly." }, 503);
  }
}
