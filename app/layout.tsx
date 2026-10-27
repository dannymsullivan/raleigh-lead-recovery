import type { Metadata } from "next";
import "./globals.css";
import "./chat.css";
import "./chatbot-sales.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://snappyleads.xyz"),
  title: "Snappy Leads | Never Lose a Good Lead",
  description: "Website chatbots and voice agents that answer customer questions, collect job details, and help service businesses follow up.",
  openGraph: {
    title: "Snappy Leads | Never Lose a Good Lead",
    description: "Answer customer questions and collect the details your team needs to follow up.",
    type: "website",
    url: "/",
    siteName: "Snappy Leads",
  },
  twitter: {
    card: "summary_large_image",
    title: "Snappy Leads | Never Lose a Good Lead",
    description: "Answer customer questions and collect the details your team needs to follow up.",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
