import { createHmac } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { pilotApplicationNotes } from "@/lib/hvac-pilot";

export const runtime = "nodejs";
const reply = (body: object, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin) return reply({ error: "This request could not be verified." }, 403);
  let body: Record<string, unknown>;
  try {
    const text = await request.text();
    if (text.length > 8000) return reply({ error: "Please shorten your request." }, 413);
    body = JSON.parse(text);
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error();
  } catch { return reply({ error: "Please check your details and try again." }, 400); }
  const value = (key: string) => typeof body[key] === "string" ? (body[key] as string).trim() : "";
  if (value("fax")) return reply({ error: "Unable to submit this request." }, 400);
  const pilot = body.offer === "raleigh_hvac_pilot";
  if (body.offer !== undefined && !pilot) return reply({ error: "Please select a valid offer." }, 400);
  const name = value("name"), business = value("business"), email = value("email").toLowerCase(), submissionId = value("submissionId");
  const needs = pilot ? pilotApplicationNotes(body.pilot) : value("needs");
  if (pilot && (!needs || !value("website"))) return reply({ error: "Complete the pilot questions, website, and participation acknowledgments." }, 400);
  if (!name || name.length > 100 || !business || business.length > 160 || !needs || needs.length > 2000 || email.length > 200 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || body.consent !== true || !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(submissionId)) {
    return reply({ error: "Enter your name, business, valid email, what you need, and permission to follow up." }, 400);
  }
  let website = value("website");
  if (website) {
    try {
      if (website.length > 500) throw new Error();
      const parsed = new URL(website.includes("://") ? website : `https://${website}`);
      if (!["https:", "http:"].includes(parsed.protocol) || parsed.username || parsed.password || !parsed.hostname.includes(".")) throw new Error();
      parsed.search = ""; parsed.hash = ""; website = parsed.toString();
    } catch { return reply({ error: "Enter a valid website, or leave that field blank." }, 400); }
  }
  const secret = process.env.TRIAL_REQUEST_SECRET?.trim() || process.env.CHAT_SESSION_SECRET?.trim() || process.env.DEMO_CALL_HASH_SECRET?.trim();
  if (!secret) return reply({ error: "Trial requests are temporarily unavailable." }, 503);
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
    const { error } = await getSupabaseAdmin().rpc(pilot ? "submit_hvac_pilot_application" : "submit_website_trial_request", {
      p_submission_id: submissionId, p_ip_hash: createHmac("sha256", secret).update(ip).digest("hex"),
      p_name: name, p_business: business, p_email: email, p_website: website || null, p_needs: needs,
    });
    if (error) throw error;
    return reply({ ok: true });
  } catch (caught) {
    const message = caught && typeof caught === "object" && "message" in caught ? String(caught.message) : "";
    return message.includes("rate_limit") ? reply({ error: "Please wait before sending another request." }, 429) : reply({ error: "Your request couldn’t be saved. Please try again." }, 503);
  }
}
