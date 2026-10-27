import { PublicSiteFooter } from "@/app/components/public-site-footer";
import type { Metadata } from "next";
import {
  ArrowDown,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { PublicSiteNav } from "../components/public-site-nav";
import { WebVoiceDemo } from "../components/web-voice-demo";

export const metadata: Metadata = {
  title: "Follow Up with Past HVAC Customers | Raleigh Lead Recovery",
  description: "Hear Raleigh Lead Recovery reconnect with a past HVAC customer about seasonal maintenance, and learn how to set up a campaign for your business.",
  alternates: { canonical: "/hvac" },
  openGraph: {
    title: "Turn Past HVAC Customers Into Tune-Up Calls",
    description: "Hear the live follow-up, then request setup for your own seasonal maintenance campaign.",
    url: "/hvac",
    type: "website",
    images: ["/lead-recovery/opengraph-image"],
  },
};

export default function HvacLandingPage() {
  return (
    <main className="landing-page hvac-page rlr-home rlr-retro retro-secondary">
      <PublicSiteNav
        cta={{ href: "/get-started?service=voice", label: "Request HVAC setup" }}
      />

      <section className="page-shell hvac-hero">
        <div className="hvac-hero-copy">
          <p className="hvac-kicker"><span>SEASONAL MAINTENANCE FOLLOW-UP</span><span>BUILT FOR HVAC TEAMS</span></p>
          <h1>Hear how past HVAC customers become <em>tune-up calls.</em></h1>
          <p className="hvac-hero-lede">Try a sample maintenance reminder call. You play the homeowner and speak to the agent through your browser.</p>
          <div className="hvac-hero-actions">
            <a className="hvac-text-link" href="#listen">Jump to the live call <ArrowDown aria-hidden="true" /></a>
          </div>
        </div>
        <div className="hvac-hero-illustration" aria-label="Seasonal tune-up follow-up illustration">
          <div className="hvac-illustration-top"><span>WORK ORDER</span><strong>READY</strong></div>
          <div className="hvac-illustration-main"><div className="hvac-illustration-dial">72°</div><div><small>CAMPAIGN MODE</small><h2>SEASONAL<br />TUNE-UP</h2></div></div>
          <div className="hvac-illustration-grid"><div><small>SEGMENT</small><strong>Eligible past customers</strong></div><div><small>REASON</small><strong>Seasonal maintenance</strong></div><div><small>HANDOFF</small><strong>Interested customer + summary</strong></div><div><small>SOURCE</small><strong>Your approved list</strong></div></div>
          <div className="hvac-illustration-call"><span>●</span><div><small>LEAD RECOVERY IS CALLING</small><strong>“Is now a good time to talk about seasonal maintenance?”</strong></div></div>
          <div className="hvac-illustration-result"><span>✓</span><div><small>INTEREST DETECTED</small><strong>Preferred window: Tuesday morning</strong></div><ArrowRight aria-hidden="true" /></div>
        </div>
      </section>

      <section className="hvac-demo-wrap" id="listen">
        <div className="page-shell hvac-single-demo">
          <div className="hvac-demo-copy">
            <p className="eyebrow"><span /> Live browser demo</p>
            <h2>Hear the call before a customer does.</h2>
            <p>Use your microphone to try a sample conversation. You don’t need to connect your customer list or share real customer details.</p>
          </div>
          <div className="hvac-demo-console">
            <div className="hvac-demo-console-top"><span>LIVE SCENARIO</span><strong>SEASONAL TUNE-UP</strong></div>
            <div className="hvac-demo-prompt"><span>YOU PLAY THE CUSTOMER</span><strong>Press “Try it now” and start talking.</strong></div>
            <WebVoiceDemo mode="reactivation" />
          </div>
        </div>
      </section>

      <section className="hvac-pilot" id="pilot">
        <div className="page-shell hvac-pilot-grid">
          <div><p className="eyebrow">Setup for your HVAC business</p><h2>Start with the customers you want to reach.</h2><p><ShieldCheck aria-hidden="true" /> You choose the contacts and approve the conversation. Danny reviews the setup and first calls personally.</p></div>
          <div className="hvac-pilot-card"><a className="hvac-button hvac-button-dark" href="/get-started?service=voice">Request HVAC setup <ArrowRight /></a><span className="hvac-text-link">We confirm who can be called, how many calls are included, and the price before launch.</span></div>
        </div>
      </section>

      <PublicSiteFooter />
    </main>
  );
}
