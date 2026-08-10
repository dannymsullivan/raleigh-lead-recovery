import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Raleigh Lead Recovery | Miss the call. Not the job.",
  description: "Mabel answers the customer calls your team misses, captures the important details, and puts every lead in your dashboard. Keep your existing number."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
