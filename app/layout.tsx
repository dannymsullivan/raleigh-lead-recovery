import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Raleigh Lead Recovery | Turn Old Leads Into New Business",
  description: "Mabel reactivates old and unresponsive roofing leads, qualifies the homeowners who are still interested, and sends real opportunities back to your team."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
