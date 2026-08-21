import type { Metadata } from "next";
import { BrandMark } from "../components/brand-mark";
import { DemoCallForm } from "../components/demo-call-form";

export const metadata: Metadata = {
  title: "Try Chloe Live | Raleigh Lead Recovery",
  description: "Choose your industry and hear Chloe follow up with a lead in a personalized live phone demo.",
  robots: { index: false, follow: false },
};

const bookingUrl = process.env.NEXT_PUBLIC_PILOT_BOOKING_URL?.trim()
  || "https://calendly.com/hello-raleighaiguy/lead-recovery-fit-call";

export default function DemoPage() {
  return (
    <main className="landing-page recovery-page min-h-screen">
      <header className="site-header recovery-header">
        <div className="page-shell nav-row">
          <BrandMark />
          <p className="handout-demo-label"><span /> Industry-tuned live demo</p>
        </div>
      </header>
      <DemoCallForm bookingUrl={bookingUrl} analyticsLocation="print_handout_demo" handout initialDemoType="home_services" />
    </main>
  );
}
