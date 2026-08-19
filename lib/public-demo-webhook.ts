type JsonRecord = Record<string, unknown>;
const record = (value: unknown): JsonRecord => typeof value === "object" && value !== null && !Array.isArray(value) ? value as JsonRecord : {};
const text = (value: unknown): string | null => typeof value === "string" && value.trim() ? value.trim() : null;

export function extractPublicDemoCallEvent(payload: unknown): { callId: string | null; eventType: string | null } | null {
  const root = record(payload);
  const message = Object.keys(record(root.message)).length ? record(root.message) : root;
  const call = record(message.call);
  const metadata = record(call.metadata);
  if (text(metadata.app) !== "public-demo") return null;
  return { callId: text(call.id ?? message.callId), eventType: text(message.type) };
}

export async function processPublicDemoCallEvent(event: { callId: string | null; eventType: string | null }): Promise<string> {
  if (!event.callId || event.eventType !== "end-of-call-report") return "ignored_public_demo_event";
  const { getSupabaseAdmin } = await import("./supabase-server");
  const { error } = await getSupabaseAdmin()
    .from("public_demo_call_requests")
    .update({ status: "completed", updated_at: new Date().toISOString() })
    .eq("vapi_call_id", event.callId);
  if (error) throw error;
  return "public_demo_completed";
}
