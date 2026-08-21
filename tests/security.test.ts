import { describe, expect, it } from "vitest";
import { safeCompare } from "@/lib/security";

describe("webhook secret validation", () => {
  it("compares matching and missing secrets", () => {
    expect(safeCompare("secret-value", "secret-value")).toBe(true);
    expect(safeCompare(null, "secret-value")).toBe(false);
  });

  it("does not treat different-length strings as equal", () => {
    expect(safeCompare("abc", "abcd")).toBe(false);
  });
});
