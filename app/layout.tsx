import type { Metadata } from "next";
import "./globals.css";
import "./chat.css";
import "./chatbot-sales.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.raleighleadrecovery.com"),
  title: "Raleigh Lead Recovery | Never Lose a Good Lead",
  description: "Website chatbots, business knowledge, and lead attribution for service businesses. Voice agents and lead recovery are available as separate services.",
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
