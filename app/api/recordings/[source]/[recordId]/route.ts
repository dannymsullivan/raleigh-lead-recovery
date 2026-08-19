import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { adminCookie, verifyAdminSessionToken } from "@/lib/admin";
import { getSupabaseAuth, isSupabaseAuthConfigured } from "@/lib/supabase-auth";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import {
  signedRecordingLocation,
  type RecordingSource,
  vapiMonoRecordingEndpoint
} from "@/lib/vapi-recording";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ source: string; recordId: string }>;
};

type RecordingTarget = {
  clientId: string;
  vapiCallId: string;
};

const recordingTables: Record<RecordingSource, string> = {
  calls: "calls",
  "reactivation-attempts": "reactivation_attempts"
};

function isRecordingSource(value: string): value is RecordingSource {
  return value === "calls" || value === "reactivation-attempts";
}

async function findRecordingTarget(source: RecordingSource, recordId: string): Promise<RecordingTarget | null> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from(recordingTables[source])
    .select("client_id,vapi_call_id,recording_url")
    .eq("id", recordId)
    .maybeSingle();

  if (error) throw error;
  if (!data?.client_id || !data.vapi_call_id || !data.recording_url) return null;

  return {
    clientId: data.client_id as string,
    vapiCallId: data.vapi_call_id as string
  };
}

async function canAccessClient(clientId: string): Promise<boolean> {
  const cookieStore = await cookies();
  if (verifyAdminSessionToken(cookieStore.get(adminCookie.name)?.value)) return true;
  if (!isSupabaseAuthConfigured()) return false;

  const auth = await getSupabaseAuth();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return false;

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("clients")
    .select("id")
    .eq("id", clientId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data);
}

function privateResponse(body: BodyInit | null, init: ResponseInit): Response {
  const headers = new Headers(init.headers);
  headers.set("Cache-Control", "private, no-store");
  headers.set("X-Content-Type-Options", "nosniff");
  return new Response(body, { ...init, headers });
}

export async function GET(request: NextRequest, context: RouteContext): Promise<Response> {
  const { source, recordId } = await context.params;
  if (!isRecordingSource(source) || !recordId) {
    return privateResponse("Not found", { status: 404 });
  }

  try {
    const target = await findRecordingTarget(source, recordId);
    if (!target || !(await canAccessClient(target.clientId))) {
      return privateResponse("Not found", { status: 404 });
    }

    const apiKey = process.env.VAPI_API_KEY?.trim();
    if (!apiKey) {
      return privateResponse("Recording service is not configured", { status: 503 });
    }

    const upstream = await fetch(vapiMonoRecordingEndpoint(target.vapiCallId), {
      headers: { Authorization: `Bearer ${apiKey}` },
      redirect: "manual",
      cache: "no-store",
      signal: request.signal
    });
    const signedUrl = signedRecordingLocation(upstream);

    if (upstream.status >= 300 && upstream.status < 400 && signedUrl) {
      return privateResponse(null, { status: 302, headers: { Location: signedUrl } });
    }
    if (!upstream.ok) {
      return privateResponse(upstream.status === 404 ? "Recording not found" : "Recording is temporarily unavailable", {
        status: upstream.status === 404 ? 404 : 502
      });
    }

    const headers = new Headers();
    for (const name of ["accept-ranges", "content-length", "content-range", "content-type"]) {
      const value = upstream.headers.get(name);
      if (value) headers.set(name, value);
    }
    return privateResponse(upstream.body, { status: upstream.status, headers });
  } catch (error) {
    console.error("Unable to retrieve Vapi recording", error);
    return privateResponse("Recording is temporarily unavailable", { status: 502 });
  }
}
