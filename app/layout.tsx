import type { Metadata } from "next";
import "./globals.css";
import "./chat.css";
import "./chatbot-sales.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.raleighleadrecovery.com"),
  title: "Raleigh Lead Recovery | Never Lose a Good Lead",
  description: "Website chatbots and voice agents that answer customer questions, collect job details, and help service businesses follow up.",
  openGraph: {
    title: "Raleigh Lead Recovery | Never Lose a Good Lead",
    description: "Answer customer questions and collect the details your team needs to follow up.",
    type: "website",
    url: "/",
    siteName: "Raleigh Lead Recovery",
  },
  twitter: {
    card: "summary_large_image",
    title: "Raleigh Lead Recovery | Never Lose a Good Lead",
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
