import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  Check,
  ShieldCheck,
  Volume2,
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
          <p className="hvac-kicker"><span>HVAC REACTIVATION SYSTEM</span><span>RALEIGH, NC</span></p>
          <h1>Your customer list is full of <em>tune-ups</em> waiting to happen.</h1>
          <div className="hvac-hero-actions">
            <a className="hvac-demo-trigger" href="#live-demo" aria-label="Listen to the live HVAC demo">
              <span className="hvac-demo-trigger-icon"><Volume2 aria-hidden="true" /></span>
              <span><strong>Listen to the 45-second example</strong><small>Hear the tune-up follow-up live</small></span>
            </a>
            <Link className="hvac-button hvac-button-accent" href="/signup">Start with 25 contacts <ArrowRight aria-hidden="true" /></Link>
            <a className="hvac-text-link" href={`mailto:${contactEmail}`}>Contact Danny <ArrowRight aria-hidden="true" /></a>
          </div>
          <p className="hvac-fine-print"><ShieldCheck aria-hidden="true" /> Free pilot · no CRM access required · approved lists, calling windows, disclosures, and opt-out controls come first.</p>
        </div>

        <a className="hvac-hero-listen-card" href="#live-demo" aria-label="Press to listen to the HVAC tune-up demo">
          <span className="hvac-hero-listen-ring"><Volume2 aria-hidden="true" /></span>
          <span className="hvac-hero-listen-label">LIVE HVAC DEMO</span>
          <strong>Press to hear the follow-up call.</strong>
          <span className="hvac-hero-listen-action">Listen now <ArrowRight aria-hidden="true" /></span>
        </a>
      <a className="hvac-scroll-cue" href="#live-demo" aria-label="Continue to learn more"><ArrowDown aria-hidden="true" /></a>
      </section>

      <div className="hvac-demo-wrap" id="live-demo">
        <div className="page-shell hvac-single-demo">
          <div className="hvac-demo-copy">
            <p className="eyebrow"><span /> Live HVAC browser demo</p>
            <h2>Hear the tune-up call—live.</h2>
            <p>Press play and hear the follow-up in action.</p>
          </div>
          <div className="hvac-demo-console">
            <div className="hvac-demo-console-top"><span>LIVE SCENARIO</span><strong>SEASONAL TUNE-UP</strong></div>
            <div className="hvac-demo-prompt"><span>YOU PLAY THE CUSTOMER</span><strong>Answer naturally. Ask a real question. See where the conversation goes.</strong></div>
            <WebVoiceDemo mode="reactivation" />
          </div>
        </div>
      </div>

      <section className="hvac-pilot">
        <div className="page-shell hvac-pilot-grid">
          <div>
            <p className="eyebrow">Free 25-contact pilot</p>
            <h2>Start with 25. Scale what works.</h2>
            <p>Consistent tune-up follow-up for an approved list, with interested homeowners handed back to your team.</p>
          </div>
          <div className="hvac-pilot-card">
            <div className="hvac-pilot-stamp">PILOT</div>
            <p>INITIAL RUN</p>
            <strong>25</strong><span>eligible contacts</span>
            <ul><li><Check /> 14 days to test</li><li><Check /> $0 setup fee</li><li><Check /> Call review before scaling</li></ul>
            <Link className="hvac-button hvac-button-dark" href="/signup">Start free <ArrowRight /></Link>
          </div>
        </div>
      </section>

      <footer className="hvac-footer">
        <div className="page-shell"><BrandMark inverted /><p>Call coverage and lead recovery for HVAC companies.</p><nav><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/login">Sign in</Link><a href={`mailto:${contactEmail}`}>{contactEmail}</a></nav></div>
      </footer>
    </main>
  );
}
