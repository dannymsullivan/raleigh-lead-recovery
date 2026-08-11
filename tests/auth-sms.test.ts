import { describe, expect, it } from "vitest";
import { authSmsSuccessResponse, getAuthSmsMessage } from "@/lib/auth-sms";

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
    expect(getAuthSmsMessage({ user: { phone: "5550123" }, sms: { otp: "123456" } })).toBeNull();
    expect(getAuthSmsMessage({ user: { phone: "+19195550123" }, sms: { otp: "123" } })).toBeNull();
  });

  it("accepts numeric codes and normalizes formatted hook phone values", () => {
    expect(getAuthSmsMessage({
      user: { phone: "(919) 555-0123" },
      sms: { otp: 123456 }
    })).toEqual({
      to: "+19195550123",
      body: "Your Mabel verification code is 123456. It expires shortly."
    });
  });

  it("returns JSON metadata Supabase requires for a successful HTTP hook", async () => {
    const response = authSmsSuccessResponse();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");
    await expect(response.json()).resolves.toEqual({});
  });
});
