import { describe, expect, it } from "vitest";
import { isClientDeletionLocked } from "@/lib/client-deletion";

describe("isClientDeletionLocked", () => {
  it("protects the active test customer", () => {
    expect(isClientDeletionLocked({ is_test_account: true })).toBe(true);
  });

  it("protects a customer with a provisioned Retell number", () => {
    expect(isClientDeletionLocked({ provisioned_phone_number: "+19195550123" })).toBe(true);
  });

  it("allows an ordinary unprovisioned customer to be removed", () => {
    expect(isClientDeletionLocked({})).toBe(false);
  });
});
