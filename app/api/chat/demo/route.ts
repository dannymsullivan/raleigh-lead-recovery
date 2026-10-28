import { NextRequest, NextResponse } from "next/server";
import { answerDemoChat, DemoChatError } from "@/lib/demo-chat-server";

export const runtime = "nodejs";
export const maxDuration = 60;
const reply = (body: object, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin) return reply({ error: "This request could not be verified." }, 403);
  let body: Record<string, unknown>;
  try {
    const raw = await request.text();
    if (raw.length > 8000) return reply({ error: "Message is too long." }, 413);
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error();
    body = parsed as Record<string, unknown>;
  } catch { return reply({ error: "Please check your message and try again." }, 400); }
  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message || message.length > 1000) return reply({ error: "Please enter a message of up to 1,000 characters." }, 400);
  if (body.sessionToken !== undefined && (typeof body.sessionToken !== "string" || !/^[a-f0-9]{64}$/.test(body.sessionToken))) {
    return reply({ error: "Please start a new demo conversation.", resetSession: true }, 401);
  }
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  try {
    return reply(await answerDemoChat(message, body.sessionToken as string | undefined, ip));
  } catch (caught) {
    if (caught instanceof DemoChatError) return reply({ error: caught.message, ...(caught.sessionToken ? { sessionToken: caught.sessionToken } : {}), ...(caught.resetSession ? { resetSession: true } : {}) }, caught.status);
    return reply({ error: "The live demo is temporarily unavailable. Please try again shortly." }, 503);
  }
}
