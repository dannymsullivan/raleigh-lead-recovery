import { describe, expect, it } from "vitest";
import { formatPhoneDisplay, maskPhoneNumber, normalizePhoneNumber } from "@/lib/phone";

describe("phone authentication helpers", () => {
  it("normalizes common US phone formats", () => {
    expect(normalizePhoneNumber("(919) 555-0123")).toBe("+19195550123");
    expect(normalizePhoneNumber("1-919-555-0123")).toBe("+19195550123");
  });

  it("accepts international E.164 numbers and rejects incomplete numbers", () => {
    expect(normalizePhoneNumber("+44 20 7946 0958")).toBe("+442079460958");
    expect(normalizePhoneNumber("555-0123")).toBeNull();
  });

  it("masks phone numbers shown on the verification screen", () => {
    expect(maskPhoneNumber("+19195550123")).toBe("(***) ***-0123");
  });

  it("formats E.164 numbers for dashboard display and passes through non-US values", () => {
    expect(formatPhoneDisplay("+19195550123")).toBe("(919) 555-0123");
    expect(formatPhoneDisplay("9195550123")).toBe("(919) 555-0123");
    expect(formatPhoneDisplay("555-0123")).toBe("555-0123");
  });
});
