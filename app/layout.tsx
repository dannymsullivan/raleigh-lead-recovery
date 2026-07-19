import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Raleigh Lead Recovery",
  description: "A missed-call recovery service for Raleigh businesses that captures customer calls, alerts your team, and reports recovered leads."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
