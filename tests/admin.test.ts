import { describe, expect, it } from "vitest";
import { isLocalAdminBypassEnabled } from "@/lib/admin";

describe("local admin access", () => {
  it("bypasses the password only in development", () => {
    expect(isLocalAdminBypassEnabled({ NODE_ENV: "development" })).toBe(true);
    expect(isLocalAdminBypassEnabled({ NODE_ENV: "development", ADMIN_LOCAL_BYPASS: "false" })).toBe(false);
    expect(isLocalAdminBypassEnabled({ NODE_ENV: "production" })).toBe(false);
    expect(isLocalAdminBypassEnabled({ NODE_ENV: "test" })).toBe(false);
  });
});
