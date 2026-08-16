import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Raleigh Lead Recovery | Be first to every new lead",
  description: "Mabel responds to service leads in seconds, qualifies the job, and moves customers toward a booking before competitors follow up."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
