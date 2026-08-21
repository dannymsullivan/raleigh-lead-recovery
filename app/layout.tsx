import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.raleighleadrecovery.com"),
  title: "Raleigh Lead Recovery | Never Lose a Good Lead",
  description: "Raleigh Lead Recovery answers missed and after-hours calls, captures what the customer needs, and helps service businesses recover qualified past leads.",
  openGraph: {
    title: "Raleigh Lead Recovery | Never Lose a Good Lead",
    description: "Answer new demand and recover the demand you already earned.",
    type: "website",
    url: "/",
    siteName: "Raleigh Lead Recovery",
  },
  twitter: {
    card: "summary_large_image",
    title: "Raleigh Lead Recovery | Never Lose a Good Lead",
    description: "Answer new demand and recover the demand you already earned.",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
