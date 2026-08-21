import { describe, expect, it } from "vitest";
import { createCustomerInvitationToken, customerInvitationExpiresAt, customerInvitationPath, hashCustomerInvitationToken, isCustomerInvitationExpired, isCustomerInvitationToken } from "@/lib/customer-invitations";

describe("customer workspace invitations", () => {
  it("creates URL-safe, high-entropy one-time tokens", () => {
    const token = createCustomerInvitationToken();
    expect(isCustomerInvitationToken(token)).toBe(true);
    expect(token).not.toBe(createCustomerInvitationToken());
    expect(customerInvitationPath(token)).toBe(`/invite/${token}`);
  });

  it("stores only a deterministic hash", () => {
    const token = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNO123";
    expect(isCustomerInvitationToken(token)).toBe(true);
    expect(hashCustomerInvitationToken(token)).toHaveLength(64);
    expect(hashCustomerInvitationToken(token)).toBe(hashCustomerInvitationToken(token));
    expect(hashCustomerInvitationToken(token)).not.toContain(token);
  });

  it("expires invitations seven days after creation", () => {
    expect(customerInvitationExpiresAt(new Date("2026-08-21T12:00:00.000Z"))).toBe("2026-08-28T12:00:00.000Z");
    expect(isCustomerInvitationExpired("2026-08-28T12:00:00.000Z", new Date("2026-08-28T12:00:00.000Z"))).toBe(true);
    expect(isCustomerInvitationExpired("2026-08-28T12:00:00.000Z", new Date("2026-08-27T12:00:00.000Z"))).toBe(false);
  });

  it("rejects malformed route tokens", () => {
    expect(isCustomerInvitationToken("short")).toBe(false);
    expect(isCustomerInvitationToken("a".repeat(41) + "/unsafe")).toBe(false);
  });
});
