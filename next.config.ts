import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async redirects() {
    // Move public pages while preserving existing auth cookies, webhooks, and embeds.
    const publicPaths = ["/", "/voice", "/get-started", "/contact", "/blog/:path*", "/privacy", "/terms", "/hvac", "/lead-recovery", "/dashboard-demo", "/pricing", "/knowledge-base", "/login", "/signup", "/invite/:token"];
    return [
      { source: "/:path*", has: [{ type: "host" as const, value: "www.snappyleads.xyz" }], destination: "https://snappyleads.xyz/:path*", permanent: true },
      ...["raleighleadrecovery.com", "www.raleighleadrecovery.com", "raleigh-lead-recovery.vercel.app"].flatMap((host) =>
        publicPaths.map((source) => ({ source, has: [{ type: "host" as const, value: host }], destination: `https://snappyleads.xyz${source}`, permanent: true }))
      ),
    ];
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb"
    }
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.pexels.com"
      }
    ]
  }
};

export default nextConfig;
