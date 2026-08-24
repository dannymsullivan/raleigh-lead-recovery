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
  title: "HVAC Tune-Up Reactivation | Raleigh Lead Recovery",
  description: "Raleigh Lead Recovery helps HVAC companies reconnect with eligible past customers who may be due for seasonal maintenance and route interested homeowners back to the team.",
  alternates: { canonical: "/hvac" },
  openGraph: {
    title: "Turn Dormant HVAC Customers Into Booked Tune-Ups",
    description: "Let Raleigh Lead Recovery work the eligible list, reopen the conversation, and hand interested homeowners back to your HVAC team.",
    url: "/hvac",
    type: "website",
    images: ["/raleigh-lead-recovery-social.png"],
  },
};

export default function HvacLandingPage() {
  return (
    <main className="landing-page hvac-page">
      <PublicSiteNav
        variant="hvac"
        items={[]}
        cta={{ href: "/signup", label: "Start free pilot" }}
      />

      <section className="page-shell hvac-hero">
        <div className="hvac-hero-copy">
          <p className="hvac-kicker"><span>HVAC FOLLOW-UP</span><span>RALEIGH, NC</span></p>
          <h1>Hear how old HVAC leads become <em>tune-up calls.</em></h1>
          <p className="hvac-hero-lede">Press play. You play the homeowner. The follow-up happens live in your browser.</p>
          <div className="hvac-hero-actions">
            <a className="hvac-text-link" href="#listen">Jump to the live call <ArrowDown aria-hidden="true" /></a>
          </div>
        </div>
      </section>

      <section className="hvac-demo-wrap" id="listen">
        <div className="page-shell hvac-single-demo">
          <div className="hvac-demo-copy">
            <p className="eyebrow"><span /> Live browser demo</p>
            <h2>Try the call.</h2>
            <p>Answer naturally and hear what a tune-up follow-up sounds like.</p>
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
          <div><p className="eyebrow">Want this for your list?</p><h2>Start with 25 contacts free.</h2><p><ShieldCheck aria-hidden="true" /> Approved list. Consistent follow-up. Interested homeowners handed back to your team.</p></div>
          <div className="hvac-pilot-card"><Link className="hvac-button hvac-button-dark" href="/signup">Start free <ArrowRight /></Link><a className="hvac-text-link" href={`mailto:${contactEmail}`}>Contact Danny <ArrowRight /></a></div>
        </div>
      </section>

      <footer className="hvac-footer">
        <div className="page-shell"><BrandMark inverted /><p>Call coverage and lead recovery for HVAC companies.</p><nav><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/login">Sign in</Link><a href={`mailto:${contactEmail}`}>{contactEmail}</a></nav></div>
      </footer>
    </main>
  );
}
