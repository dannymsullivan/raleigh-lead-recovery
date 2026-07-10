import "server-only";

import Twilio from "twilio";
import type { SmsMessage } from "./webhook";

export async function sendTwilioSms(message: SmsMessage): Promise<void> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;

  if (!accountSid || !authToken || !from) {
    throw new Error("Missing Twilio SMS environment variables");
  }

  const client = Twilio(accountSid, authToken);
  await client.messages.create({
    to: message.to,
    from,
    body: message.body
  });
}
