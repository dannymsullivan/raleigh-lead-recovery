import type { Metadata } from "next";
import "./globals.css";
import "./chat.css";
import "./chatbot-sales.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://snappyleads.xyz"),
  title: "Snappy Leads | Turn Cold Traffic into Warm Leads",
  description: "Your team's approved knowledge, ready for complex buying questions. Help visitors understand their options before requesting a quote.",
  openGraph: {
    title: "Snappy Leads | Turn Cold Traffic into Warm Leads",
    description: "The right answers, fast. Put your team's knowledge to work before the quote.",
    type: "website",
    url: "/",
    siteName: "Snappy Leads",
  },
  twitter: {
    card: "summary_large_image",
    title: "Snappy Leads | Turn Cold Traffic into Warm Leads",
    description: "The right answers, fast. Put your team's knowledge to work before the quote.",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
