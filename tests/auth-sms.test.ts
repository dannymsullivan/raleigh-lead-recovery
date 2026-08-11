import { describe, expect, it } from "vitest";
import { getAuthSmsMessage } from "@/lib/auth-sms";

describe("Supabase Auth SMS hook", () => {
  it("builds a verification message from a valid hook event", () => {
    expect(getAuthSmsMessage({
      user: { phone: "+19195550123" },
      sms: { otp: "123456" }
    })).toEqual({
      to: "+19195550123",
      body: "Your Mabel verification code is 123456. It expires shortly."
    });
  });

  it("rejects malformed phone numbers and codes", () => {
    expect(getAuthSmsMessage({ user: { phone: "9195550123" }, sms: { otp: "123456" } })).toBeNull();
    expect(getAuthSmsMessage({ user: { phone: "+19195550123" }, sms: { otp: "12345" } })).toBeNull();
  });
});
