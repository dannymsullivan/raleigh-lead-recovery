import { Webhook } from "standardwebhooks";
import { getAuthSmsMessage } from "@/lib/auth-sms";
import { sendTwilioSms } from "@/lib/sms";

export async function POST(request: Request): Promise<Response> {
  const secret = process.env.SUPABASE_AUTH_HOOK_SECRET;
  if (!secret) return Response.json({ error: "Hook is not configured" }, { status: 500 });

  const payload = await request.text();
  let event: unknown;

  try {
    event = new Webhook(secret).verify(payload, {
      "webhook-id": request.headers.get("webhook-id") ?? "",
      "webhook-signature": request.headers.get("webhook-signature") ?? "",
      "webhook-timestamp": request.headers.get("webhook-timestamp") ?? ""
    });
  } catch {
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }

  const message = getAuthSmsMessage(event as Parameters<typeof getAuthSmsMessage>[0]);
  if (!message) return Response.json({ error: "Invalid SMS payload" }, { status: 400 });

  try {
    await sendTwilioSms(message);
    return new Response(null, { status: 200 });
  } catch {
    return Response.json({ error: "SMS delivery failed" }, { status: 502 });
  }
}
