import { normalizePhoneNumber } from "./phone";

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
    body: `Your Mabel verification code is ${otp}. It expires shortly.`
  };
}
