import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { BrandMark } from "../components/brand-mark";
import { PublicSiteNav } from "../components/public-site-nav";
import { WebVoiceDemo } from "../components/web-voice-demo";
import { contactEmail } from "@/lib/contact";

export const metadata: Metadata = {
  title: "Reactivate Past HVAC Customers | Raleigh Lead Recovery",
  description: "Hear Raleigh Lead Recovery reconnect with a past HVAC customer about seasonal maintenance, then test it with 25 eligible contacts at no cost.",
  alternates: { canonical: "/hvac" },
  openGraph: {
    title: "Turn Past HVAC Customers Into Tune-Up Calls",
    description: "Hear the live follow-up, then test Raleigh Lead Recovery with 25 eligible past customers at no cost.",
    url: "/hvac",
    type: "website",
    images: ["/raleigh-lead-recovery-social.png"],
  },
};

export default function HvacLandingPage() {
  return (
    <main className="landing-page hvac-page">
      <PublicSiteNav
        cta={{ href: `mailto:${contactEmail}?subject=25-contact%20HVAC%20pilot`, label: "Ask about 25 contacts" }}
      />

      <section className="page-shell hvac-hero">
        <div className="hvac-hero-copy">
          <p className="hvac-kicker"><span>SEASONAL MAINTENANCE FOLLOW-UP</span><span>RALEIGH, NC</span></p>
          <h1>Hear how past HVAC customers become <em>tune-up calls.</em></h1>
          <p className="hvac-hero-lede">Play the homeowner in the exact seasonal-maintenance call. It happens live in your browser.</p>
          <div className="hvac-hero-actions">
            <a className="hvac-text-link" href="#listen">Jump to the live call <ArrowDown aria-hidden="true" /></a>
          </div>
        </div>
        <div className="hvac-hero-illustration" aria-label="Seasonal tune-up follow-up illustration">
          <div className="hvac-illustration-top"><span>WORK ORDER</span><strong>READY</strong></div>
          <div className="hvac-illustration-main"><div className="hvac-illustration-dial">72°</div><div><small>CAMPAIGN MODE</small><h2>SEASONAL<br />TUNE-UP</h2></div></div>
          <div className="hvac-illustration-grid"><div><small>SEGMENT</small><strong>Eligible past customers</strong></div><div><small>REASON</small><strong>Seasonal maintenance</strong></div><div><small>HANDOFF</small><strong>Interested customer + summary</strong></div><div><small>SOURCE</small><strong>Your approved list</strong></div></div>
          <div className="hvac-illustration-call"><span>●</span><div><small>RALEIGH LEAD RECOVERY IS CALLING</small><strong>“Is now a good time to talk about seasonal maintenance?”</strong></div></div>
          <div className="hvac-illustration-result"><span>✓</span><div><small>INTEREST DETECTED</small><strong>Preferred window: Tuesday morning</strong></div><ArrowRight aria-hidden="true" /></div>
        </div>
      </section>

      <section className="hvac-demo-wrap" id="listen">
        <div className="page-shell hvac-single-demo">
          <div className="hvac-demo-copy">
            <p className="eyebrow"><span /> Live browser demo</p>
            <h2>Hear the call before a customer does.</h2>
            <p>No CRM access or customer data. Answer naturally and decide whether you would trust the conversation with your list.</p>
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
          <div><p className="eyebrow">A small, founder-led pilot</p><h2>Test it with 25 eligible past customers. Free.</h2><p><ShieldCheck aria-hidden="true" /> You choose the contacts and approve the conversation. Danny reviews the setup and first calls personally.</p></div>
          <div className="hvac-pilot-card"><a className="hvac-button hvac-button-dark" href={`mailto:${contactEmail}?subject=25-contact%20HVAC%20pilot&body=Hi%20Danny%2C%0A%0AI%27d%20like%20to%20talk%20about%20testing%20Raleigh%20Lead%20Recovery%20with%2025%20eligible%20past%20customers.%0A%0ACompany%3A%20`}>Ask Danny about 25 contacts <ArrowRight /></a><span className="hvac-text-link">No card or CRM access to start · Founding rate after: $99/month for your first year</span></div>
        </div>
      </section>

      <footer className="hvac-footer">
        <div className="page-shell"><BrandMark inverted /><p>Seasonal-maintenance reactivation for HVAC companies.</p><nav><Link href="/">Missed-call pilot</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/login">Sign in</Link><a href={`mailto:${contactEmail}`}>{contactEmail}</a></nav></div>
      </footer>
    </main>
  );
}
