type JsonRecord = Record<string, unknown>;
const record = (value: unknown): JsonRecord => typeof value === "object" && value !== null && !Array.isArray(value) ? value as JsonRecord : {};
const text = (value: unknown): string | null => typeof value === "string" && value.trim() ? value.trim() : null;

export function extractPublicDemoCallEvent(payload: unknown): { callId: string | null; eventType: string | null; channel: "phone" | "web" } | null {
  const root = record(payload);
  const call = record(root.call);
  const metadata = record(call.metadata);
  const app = text(metadata.app);
  if (app !== "public-demo" && app !== "public-web-demo") return null;
  return { callId: text(call.call_id), eventType: text(root.event), channel: app === "public-web-demo" ? "web" : "phone" };
}

export async function processPublicDemoCallEvent(event: { callId: string | null; eventType: string | null; channel: "phone" | "web" }): Promise<string> {
  if (!event.callId || event.eventType !== "call_analyzed") return "ignored_public_demo_event";
  const { getSupabaseAdmin } = await import("./supabase-server");
  const { error } = await getSupabaseAdmin()
    .from(event.channel === "web" ? "public_web_call_requests" : "public_demo_call_requests")
    .update({ status: "completed", updated_at: new Date().toISOString() })
    .eq("retell_call_id", event.callId);
  if (error) throw error;
  return "public_demo_completed";
}
