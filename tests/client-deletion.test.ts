import { describe, expect, it } from "vitest";
import { isClientDeletionLocked } from "@/lib/client-deletion";

describe("isClientDeletionLocked", () => {
  it("protects the active test customer", () => {
    expect(isClientDeletionLocked({ is_test_account: true })).toBe(true);
  });

  it("protects real connected Vapi resources", () => {
    expect(isClientDeletionLocked({ vapi_assistant_id: "cae15f41-b125-48a6-89fa-b65a7172a59a" })).toBe(true);
  });

  it("allows ordinary and legacy seeded customers to be removed", () => {
    expect(isClientDeletionLocked({})).toBe(false);
    expect(isClientDeletionLocked({ vapi_assistant_id: "asst_demo_riley", vapi_phone_number_id: "pn_demo_raleigh" })).toBe(false);
  });
});
