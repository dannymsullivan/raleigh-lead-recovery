import { afterEach, describe, expect, it } from "vitest";
import { isValidVapiSecret, safeCompare } from "@/lib/security";

const originalSecret = process.env.VAPI_WEBHOOK_SECRET;

afterEach(() => {
  process.env.VAPI_WEBHOOK_SECRET = originalSecret;
});

describe("webhook secret validation", () => {
  it("accepts matching secrets", () => {
    process.env.VAPI_WEBHOOK_SECRET = "secret-value";
    expect(isValidVapiSecret("secret-value")).toBe(true);
  });

  it("rejects missing or mismatched secrets", () => {
    process.env.VAPI_WEBHOOK_SECRET = "secret-value";
    expect(isValidVapiSecret(null)).toBe(false);
    expect(isValidVapiSecret("wrong")).toBe(false);
  });

  it("does not treat different-length strings as equal", () => {
    expect(safeCompare("abc", "abcd")).toBe(false);
  });
});
