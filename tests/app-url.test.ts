import { describe, expect, it } from "vitest";
import { getAppOrigin, getEmailConfirmationRedirect } from "@/lib/app-url";

describe("application URLs", () => {
  it("never uses a configured localhost URL in production", () => {
    const environment = {
      VERCEL_ENV: "production",
      NEXT_PUBLIC_APP_URL: "http://localhost:3000"
    };

    expect(getEmailConfirmationRedirect(environment)).toBe(
      "https://snappyleads.xyz/login?confirmed=1"
    );
  });

  it("strips paths from configured application URLs", () => {
    expect(getAppOrigin({
      NEXT_PUBLIC_APP_URL: "https://snappyleads.xyz/api/webhooks/retell"
    })).toBe("https://snappyleads.xyz");
  });

  it("uses the local app during local development", () => {
    expect(getEmailConfirmationRedirect({})).toBe(
      "http://localhost:3000/login?confirmed=1"
    );
  });
});
