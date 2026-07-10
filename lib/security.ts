import { timingSafeEqual } from "node:crypto";

export function safeCompare(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) {
    return false;
  }

  const left = Buffer.from(a);
  const right = Buffer.from(b);

  if (left.length !== right.length) {
    return false;
  }

  return timingSafeEqual(left, right);
}

export function isValidVapiSecret(incomingSecret: string | null): boolean {
  return safeCompare(incomingSecret, process.env.VAPI_WEBHOOK_SECRET);
}
