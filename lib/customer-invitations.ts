import "server-only";

import { createHash, randomBytes } from "node:crypto";

export const customerInvitationLifetimeDays = 7;
export const adminInvitationCookie = "rlr_admin_invitation";

export function createCustomerInvitationToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashCustomerInvitationToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function customerInvitationExpiresAt(now = new Date()): string {
  const expires = new Date(now);
  expires.setUTCDate(expires.getUTCDate() + customerInvitationLifetimeDays);
  return expires.toISOString();
}

export function customerInvitationPath(token: string): string {
  return `/invite/${encodeURIComponent(token)}`;
}

export function isCustomerInvitationToken(value: string): boolean {
  return /^[A-Za-z0-9_-]{40,80}$/.test(value);
}

export function isCustomerInvitationExpired(expiresAt: string, now = new Date()): boolean {
  return new Date(expiresAt).getTime() <= now.getTime();
}
