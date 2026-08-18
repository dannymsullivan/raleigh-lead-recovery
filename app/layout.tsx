import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.raleighleadrecovery.com"),
  title: "Raleigh Lead Recovery | Turn Old Leads Into New Business",
  description: "Mabel reactivates old and unresponsive leads, qualifies the people who are still interested, and sends real opportunities back to your team.",
  openGraph: {
    title: "Raleigh Lead Recovery | Turn Old Leads Into New Business",
    description: "Mabel re-engages past prospects, qualifies interest, and returns live opportunities to your team.",
    type: "website",
    url: "/",
    siteName: "Raleigh Lead Recovery",
    images: [
      {
        url: "/raleigh-lead-recovery-social.png",
        width: 1200,
        height: 630,
        alt: "Raleigh Lead Recovery turns old leads into new business",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Raleigh Lead Recovery | Turn Old Leads Into New Business",
    description: "Mabel re-engages past prospects, qualifies interest, and returns live opportunities to your team.",
    images: ["/raleigh-lead-recovery-social.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
