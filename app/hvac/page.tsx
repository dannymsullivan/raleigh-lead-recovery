import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  CalendarCheck,
  Check,
  ClipboardCheck,
  Database,
  PhoneCall,
  ShieldCheck,
  Snowflake,
  Sun,
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

const faqs = [
  {
    question: "Who should be included in a tune-up campaign?",
    answer: "We start with a narrow, documented segment your business is permitted to contact—such as past customers who are due for maintenance or prior inquiries with the appropriate consent. Recent activity, opt-outs, and suppressed records stay out.",
  },
  {
    question: "Does Raleigh Lead Recovery pretend to be a person?",
    answer: "No. The approved conversation clearly identifies the business and uses the disclosures required for the campaign. You review the opening, offer, qualification questions, and handoff before calls begin.",
  },
  {
    question: "Can it work with ServiceTitan or Housecall Pro?",
    answer: "Start with an approved CSV export. A connected workflow can later move eligible records into Raleigh Lead Recovery and send outcomes back through an available API, webhook, Zapier, Make, or an approved import/export process.",
  },
  {
    question: "What happens when a homeowner is interested?",
    answer: "Raleigh Lead Recovery can collect the preferred timing and alert your team immediately. When calendar booking is connected, it can offer approved availability and complete the appointment handoff during the call.",
  },
];

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
          <p className="hvac-hero-lede">Raleigh Lead Recovery calls eligible past HVAC customers who may be due for seasonal maintenance, then hands interested homeowners back to your team.</p>
          <div className="hvac-hero-actions">
            <a className="hvac-demo-trigger" href="#live-demo" aria-label="Listen to the live HVAC demo">
              <span className="hvac-demo-trigger-icon"><Volume2 aria-hidden="true" /></span>
              <span><strong>Listen to the 45-second example</strong><small>Hear the tune-up follow-up live</small></span>
            </a>
            <Link className="hvac-button hvac-button-accent" href="/signup">Start with 25 contacts <ArrowRight aria-hidden="true" /></Link>
          </div>
          <p className="hvac-fine-print"><ShieldCheck aria-hidden="true" /> Free pilot · no CRM access required · approved lists, calling windows, disclosures, and opt-out controls come first.</p>
        </div>

        <div className="hvac-service-ticket" aria-label="Example HVAC tune-up campaign workflow">
          <div className="hvac-ticket-top">
            <span>WORK ORDER</span><strong>#RLR-01</strong><span className="hvac-ticket-status">READY</span>
          </div>
          <div className="hvac-thermostat">
            <div className="hvac-dial"><Snowflake aria-hidden="true" /><strong>72°</strong><Sun aria-hidden="true" /></div>
            <div><span>CAMPAIGN MODE</span><strong>SEASONAL TUNE-UP</strong></div>
          </div>
          <div className="hvac-ticket-grid">
            <div><span>SEGMENT</span><strong>Past customers</strong></div>
            <div><span>OFFER</span><strong>Maintenance visit</strong></div>
            <div><span>HANDOFF</span><strong>Owner alert + booking</strong></div>
            <div><span>SOURCE</span><strong>Your CRM / CSV</strong></div>
          </div>
          <div className="hvac-call-strip"><span className="hvac-pulse" /><div><span>RALEIGH LEAD RECOVERY IS CALLING</span><strong>“Is now a good time to talk about seasonal maintenance?”</strong></div></div>
          <div className="hvac-ticket-result"><Check aria-hidden="true" /><div><span>INTEREST DETECTED</span><strong>Preferred window: Tuesday morning</strong></div><ArrowRight aria-hidden="true" /></div>
        </div>
      <a className="hvac-scroll-cue" href="#live-demo" aria-label="Continue to learn more"><ArrowDown aria-hidden="true" /></a>
      </section>

      <section className="hvac-workflow" id="workflow">
        <div className="page-shell">
          <div className="hvac-section-heading">
            <div className="hvac-section-number">02</div>
            <div><p className="eyebrow">The recovery workflow</p><h2>From dormant record to clear next step.</h2></div>
          </div>
          <ol className="hvac-workflow-grid">
            <li><span>01</span><Database aria-hidden="true" /><h3>Choose the right segment.</h3><p>Export a clean list of eligible past customers who may be due for maintenance. Recent activity, opt-outs, and suppressed records stay out.</p></li>
            <li><span>02</span><ClipboardCheck aria-hidden="true" /><h3>Approve the call plan.</h3><p>Set the tune-up offer, customer context, calling hours, disclosures, qualification questions, and handoff rules.</p></li>
            <li><span>03</span><PhoneCall aria-hidden="true" /><h3>Raleigh Lead Recovery works the list.</h3><p>Calls run in controlled batches with an HVAC-specific conversation and a recorded outcome.</p></li>
            <li><span>04</span><CalendarCheck aria-hidden="true" /><h3>Your team gets the live ones.</h3><p>Interested homeowners are routed with their summary and preferred timing—or booked when calendar access is connected.</p></li>
          </ol>
        </div>
      </section>


      <div className="hvac-demo-wrap" id="live-demo">
        <div className="page-shell hvac-single-demo">
          <div className="hvac-demo-copy">
            <p className="eyebrow"><span /> Live HVAC browser demo</p>
            <h2>Hear the tune-up call—live.</h2>
            <p>Put yourself in the customer&apos;s shoes. Raleigh Lead Recovery follows up about seasonal maintenance, listens for interest, and prepares a useful handoff.</p>
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
            <div className="hvac-section-number">04</div>
            <p className="eyebrow">Start with a small, inspectable test</p>
            <h2>Start with 25. Scale what works.</h2>
            <p>We&apos;ll choose one eligible maintenance-due segment, shape the approved tune-up conversation, review the first calls, and measure what comes back.</p>
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

      <section className="page-shell hvac-faq">
        <div><p className="eyebrow">Shop-owner questions</p><h2>Know what happens before the first call.</h2></div>
        <div className="hvac-faq-list">{faqs.map((faq) => <details key={faq.question}><summary>{faq.question}<span>+</span></summary><p>{faq.answer}</p></details>)}</div>
      </section>

      <section className="page-shell hvac-founder">
        <Image src="/danny.jpeg" alt="Danny Sullivan, founder of Raleigh Lead Recovery" width={92} height={92} />
        <div><p className="eyebrow">Built and supported in Raleigh</p><h2>Automation handles the follow-up. A real person helps you get it right.</h2><p>I&apos;ll help scope the first segment, shape the call rules, and review the early conversations before the campaign expands.</p></div>
        <a className="hvac-text-link" href={`mailto:${contactEmail}`}>Talk to Danny <ArrowRight /></a>
      </section>

      <footer className="hvac-footer">
        <div className="page-shell"><BrandMark inverted /><p>Call coverage and lead recovery for HVAC companies.</p><nav><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/login">Sign in</Link><a href={`mailto:${contactEmail}`}>{contactEmail}</a></nav></div>
      </footer>
    </main>
  );
}
