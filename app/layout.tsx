import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.raleighleadrecovery.com"),
  title: "Mabel | 24/7 AI Receptionist and Lead Recovery",
  description: "Mabel answers missed and after-hours calls, captures what the customer needs, and helps service businesses recover qualified past leads.",
  openGraph: {
    title: "Mabel | 24/7 AI Receptionist and Lead Recovery",
    description: "Answer new demand and recover the demand you already earned with Mabel.",
    type: "website",
    url: "/",
    siteName: "Mabel by Raleigh Lead Recovery",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mabel | 24/7 AI Receptionist and Lead Recovery",
    description: "Answer new demand and recover the demand you already earned with Mabel.",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
