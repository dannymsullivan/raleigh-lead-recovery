type AuthSmsEvent = {
  user?: { phone?: unknown };
  sms?: { otp?: unknown };
};

export function getAuthSmsMessage(event: AuthSmsEvent): { to: string; body: string } | null {
  const phone = event.user?.phone;
  const otp = event.sms?.otp;

  if (typeof phone !== "string" || !/^\+[1-9]\d{7,14}$/.test(phone)) return null;
  if (typeof otp !== "string" || !/^\d{6}$/.test(otp)) return null;

  return {
    to: phone,
    body: `Your Mabel verification code is ${otp}. It expires shortly.`
  };
}
