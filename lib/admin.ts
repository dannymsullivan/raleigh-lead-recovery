import { createHmac, timingSafeEqual } from "node:crypto";

const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

function adminSecret(): string | null {
  return process.env.ADMIN_PASSWORD || null;
}

function sign(timestamp: string, secret: string): string {
  return createHmac("sha256", secret).update(timestamp).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);

  if (left.length !== right.length) {
    return false;
  }

  return timingSafeEqual(left, right);
}

export function verifyAdminPassword(password: string): boolean {
  const secret = adminSecret();
  return Boolean(secret && safeEqual(password, secret));
}

export function createAdminSessionToken(now = new Date()): string {
  const secret = adminSecret();
  if (!secret) {
    throw new Error("Missing ADMIN_PASSWORD");
  }

  const timestamp = String(now.getTime());
  return `v1.${timestamp}.${sign(timestamp, secret)}`;
}

export function verifyAdminSessionToken(token: string | undefined): boolean {
  const secret = adminSecret();
  if (!secret || !token) {
    return false;
  }

  const [version, timestamp, signature] = token.split(".");
  if (version !== "v1" || !timestamp || !signature) {
    return false;
  }

  const issuedAt = Number(timestamp);
  if (!Number.isFinite(issuedAt)) {
    return false;
  }

  const ageSeconds = (Date.now() - issuedAt) / 1000;
  if (ageSeconds < 0 || ageSeconds > SESSION_MAX_AGE_SECONDS) {
    return false;
  }

  return safeEqual(signature, sign(timestamp, secret));
}

export const adminCookie = {
  name: "admin_session",
  maxAge: SESSION_MAX_AGE_SECONDS
};
