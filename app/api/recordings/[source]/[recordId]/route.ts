import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { adminCookie, verifyAdminSessionToken } from "@/lib/admin";
import { getRetellClient } from "@/lib/retell";
import { getSupabaseAuth, isSupabaseAuthConfigured } from "@/lib/supabase-auth";
import { getSupabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RecordingSource = "calls" | "reactivation-attempts";
type RouteContext = { params: Promise<{ source: string; recordId: string }> };
const recordingTables: Record<RecordingSource, string> = { calls: "calls", "reactivation-attempts": "reactivation_attempts" };

function isRecordingSource(value: string): value is RecordingSource {
  return value === "calls" || value === "reactivation-attempts";
}

async function canAccessClient(clientId: string): Promise<boolean> {
  const cookieStore = await cookies();
  if (verifyAdminSessionToken(cookieStore.get(adminCookie.name)?.value)) return true;
  if (!isSupabaseAuthConfigured()) return false;
  const auth = await getSupabaseAuth();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return false;
  const { data, error } = await getSupabaseAdmin().from("clients").select("id").eq("id", clientId).eq("user_id", user.id).maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

function privateResponse(body: BodyInit | null, init: ResponseInit): Response {
  const headers = new Headers(init.headers);
  headers.set("Cache-Control", "private, no-store");
  headers.set("X-Content-Type-Options", "nosniff");
  return new Response(body, { ...init, headers });
}

export async function GET(_request: NextRequest, context: RouteContext): Promise<Response> {
  const { source, recordId } = await context.params;
  if (!isRecordingSource(source) || !recordId) return privateResponse("Not found", { status: 404 });
  try {
    const { data, error } = await getSupabaseAdmin().from(recordingTables[source]).select("client_id,retell_call_id").eq("id", recordId).maybeSingle();
    if (error) throw error;
    if (!data?.client_id || !data.retell_call_id || !(await canAccessClient(data.client_id as string))) return privateResponse("Not found", { status: 404 });
    const call = await getRetellClient().call.retrieve(data.retell_call_id as string);
    if (!call.recording_url?.startsWith("https://")) return privateResponse("Recording not found", { status: 404 });
    const response = NextResponse.redirect(call.recording_url, 302);
    response.headers.set("Cache-Control", "private, no-store");
    response.headers.set("X-Content-Type-Options", "nosniff");
    return response;
  } catch (error) {
    console.error("Unable to retrieve Retell recording", error);
    return privateResponse("Recording is temporarily unavailable", { status: 502 });
  }
}
