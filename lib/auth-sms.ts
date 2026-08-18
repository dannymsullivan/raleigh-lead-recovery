import { normalizePhoneNumber } from "./phone";
import { buildVerificationSms } from "./messaging-consent";

type AuthSmsEvent = {
  user?: { phone?: unknown };
  sms?: { otp?: unknown };
};

export function getAuthSmsMessage(event: AuthSmsEvent): { to: string; body: string } | null {
  const phone = typeof event.user?.phone === "string"
    ? normalizePhoneNumber(event.user.phone)
    : null;
  const rawOtp = event.sms?.otp;
  const otp = typeof rawOtp === "string" || typeof rawOtp === "number"
    ? String(rawOtp).trim()
    : "";

  if (!phone || !/^\d{4,10}$/.test(otp)) return null;

  return {
    to: phone,
    body: buildVerificationSms(otp)
  };
}

export function authSmsSuccessResponse(): Response {
  return Response.json({});
}
