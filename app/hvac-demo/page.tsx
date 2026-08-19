import type { Metadata } from "next";
import { BrandMark } from "../components/brand-mark";
import { DemoCallForm } from "../components/demo-call-form";

export const metadata: Metadata = {
  title: "Try Mabel on an HVAC Lead | Raleigh Lead Recovery",
  description: "Hear Mabel follow up on an old HVAC estimate in a personalized live phone demo.",
  robots: { index: false, follow: false },
};

const bookingUrl =
  process.env.NEXT_PUBLIC_PILOT_BOOKING_URL?.trim()
  || "https://calendly.com/hello-raleighaiguy/lead-recovery-fit-call";

export default function HvacDemoPage() {
  return (
    <main className="landing-page recovery-page min-h-screen">
      <header className="site-header recovery-header">
        <div className="page-shell nav-row">
          <BrandMark />
          <p className="handout-demo-label"><span /> HVAC live demo</p>
        </div>
      </header>
      <DemoCallForm bookingUrl={bookingUrl} analyticsLocation="hvac_demo" handout initialDemoType="hvac" />
    </main>
  );
}
