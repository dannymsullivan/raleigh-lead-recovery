import { describe, expect, it } from "vitest";
import { getRedirectUrl, unstable_getResponseFromNextConfig } from "next/experimental/testing/server";
import nextConfig from "../next.config";

async function route(url: string) {
  return unstable_getResponseFromNextConfig({ url, headers: { host: new URL(url).host }, nextConfig });
}

describe("Snappy Leads domain migration", () => {
  it("preserves marketing paths and attribution when moving the old domain", async () => {
    const response = await route("https://www.raleighleadrecovery.com/blog/plumbing-calls-going-to-voicemail?utm_source=customer");
    expect(response.status).toBe(308);
    expect(getRedirectUrl(response)).toBe("https://snappyleads.xyz/blog/plumbing-calls-going-to-voicemail?utm_source=customer");
  });

  it("canonicalizes www without losing the destination", async () => {
    expect(getRedirectUrl(await route("https://www.snappyleads.xyz/voice?demo=1"))).toBe("https://snappyleads.xyz/voice?demo=1");
  });

  it.each(["/api/webhooks/retell", "/auth/callback?code=sample", "/chat/customer", "/widget.js", "/dashboard"])("keeps existing integrations and sessions at %s on their original host", async (path) => {
    expect(getRedirectUrl(await route(`https://www.raleighleadrecovery.com${path}`))).toBeNull();
  });

  it.each(["www.raleighleadrecovery.com", "raleigh-lead-recovery.vercel.app"])("starts sign-ins from %s on the same domain as their email callback", async (host) => {
    expect(getRedirectUrl(await route(`https://${host}/login`))).toBe("https://snappyleads.xyz/login");
  });

  it.each(["https://snappyleads.xyz/voice", "http://localhost:3000/voice"])("does not redirect %s", async (url) => {
    expect(getRedirectUrl(await route(url))).toBeNull();
  });
});
