import { describe, expect, it } from "vitest";
import { createAdminSessionToken, isLocalAdminBypassEnabled, verifyAdminSessionToken } from "@/lib/admin";

describe("local admin access", () => {
  it("bypasses the password only in development", () => {
    expect(isLocalAdminBypassEnabled({ NODE_ENV: "development" })).toBe(true);
    expect(isLocalAdminBypassEnabled({ NODE_ENV: "development", ADMIN_LOCAL_BYPASS: "false" })).toBe(false);
    expect(isLocalAdminBypassEnabled({ NODE_ENV: "production" })).toBe(false);
    expect(isLocalAdminBypassEnabled({ NODE_ENV: "test" })).toBe(false);
  });

  it("recognizes a signed owner session for protected demo testing", () => {
    const previousPassword = process.env.ADMIN_PASSWORD;
    process.env.ADMIN_PASSWORD = "owner-secret";
    const token = createAdminSessionToken();

    expect(verifyAdminSessionToken(token)).toBe(true);
    expect(verifyAdminSessionToken(`${token}changed`)).toBe(false);

    if (previousPassword === undefined) delete process.env.ADMIN_PASSWORD;
    else process.env.ADMIN_PASSWORD = previousPassword;
  });
});
