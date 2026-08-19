import { describe, expect, it, vi } from "vitest";
import { isTransientCredentialError, retryTransientCredentialError } from "@/lib/retry";

describe("transient credential retries", () => {
  it("recognizes Supabase clock-skew authentication failures", () => {
    expect(isTransientCredentialError(new Error("JWT issued at future"))).toBe(true);
    expect(isTransientCredentialError(new Error("permission denied"))).toBe(false);
  });

  it("retries a clock-skew failure once", async () => {
    const operation = vi.fn()
      .mockRejectedValueOnce(new Error("JWT issued at future"))
      .mockResolvedValueOnce("connected");
    await expect(retryTransientCredentialError(operation, 0)).resolves.toBe("connected");
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it("does not retry permanent failures", async () => {
    const operation = vi.fn().mockRejectedValue(new Error("permission denied"));
    await expect(retryTransientCredentialError(operation, 0)).rejects.toThrow("permission denied");
    expect(operation).toHaveBeenCalledTimes(1);
  });
});
