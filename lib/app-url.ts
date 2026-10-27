const productionOrigin = "https://snappyleads.xyz";

type AppEnvironment = Record<string, string | undefined>;

export function getAppOrigin(environment: AppEnvironment = process.env): string {
  if (environment.VERCEL_ENV === "production") return productionOrigin;

  const configuredUrl = environment.NEXT_PUBLIC_APP_URL?.trim();
  if (configuredUrl) {
    try {
      return new URL(configuredUrl).origin;
    } catch {
      // Fall through to the deployment URL or local development URL.
    }
  }

  const vercelUrl = environment.VERCEL_URL?.trim();
  if (vercelUrl) return new URL(`https://${vercelUrl}`).origin;

  return "http://localhost:3000";
}

export function getEmailConfirmationRedirect(environment: AppEnvironment = process.env): string {
  return `${getAppOrigin(environment)}/login?confirmed=1`;
}
