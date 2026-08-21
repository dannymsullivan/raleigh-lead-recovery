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
  Gauge,
  PhoneCall,
  ShieldCheck,
  Snowflake,
  Sun,
  Wrench,
} from "lucide-react";
import { BrandMark } from "../components/brand-mark";
import { WebVoiceDemo } from "../components/web-voice-demo";
import { contactEmail } from "@/lib/contact";

const pilotHref =
  process.env.NEXT_PUBLIC_PILOT_BOOKING_URL?.trim() ||
  "https://calendly.com/hello-raleighaiguy/lead-recovery-fit-call";

export const metadata: Metadata = {
  title: "HVAC Tune-Up Reactivation | Raleigh Lead Recovery",
  description: "Raleigh Lead Recovery helps HVAC companies reconnect with eligible past customers and old leads, offer seasonal tune-ups, and route interested homeowners back to the team.",
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
      <header className="hvac-header">
        <nav className="page-shell hvac-nav" aria-label="HVAC page navigation">
          <BrandMark />
          <div className="hvac-nav-links">
            <a href="#workflow">How it works</a>
            <a href="#live-demo">Try it now</a>
            <Link href="/login">Sign in</Link>
            <a className="hvac-button hvac-button-dark" href={pilotHref} target="_blank" rel="noreferrer">Start a pilot <ArrowRight aria-hidden="true" /></a>
          </div>
        </nav>
      </header>

      <section className="page-shell hvac-hero">
        <div className="hvac-hero-copy">
          <p className="hvac-kicker"><span>HVAC REACTIVATION SYSTEM</span><span>RALEIGH, NC</span></p>
          <h1>Your customer list is full of <em>tune-ups</em> waiting to happen.</h1>
          <p className="hvac-hero-lede">Raleigh Lead Recovery calls eligible past customers and old HVAC leads with an approved seasonal tune-up offer, then hands interested homeowners back to your team.</p>
          <div className="hvac-hero-actions">
            <a className="hvac-button hvac-button-accent" href="#live-demo">Hear the HVAC call <PhoneCall aria-hidden="true" /></a>
            <a className="hvac-text-link" href={pilotHref} target="_blank" rel="noreferrer">Run a 25-contact pilot <ArrowRight aria-hidden="true" /></a>
          </div>
          <p className="hvac-fine-print"><ShieldCheck aria-hidden="true" /> Approved lists, calling windows, disclosures, and opt-out controls come first.</p>
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
        <a className="hvac-scroll-cue" href="#problem" aria-label="Continue to learn more"><ArrowDown aria-hidden="true" /></a>
      </section>

      <section className="hvac-marquee" aria-label="Common HVAC reactivation segments">
        <div><span>PAST CUSTOMERS</span><Wrench aria-hidden="true" /><span>UNSOLD ESTIMATES</span><Wrench aria-hidden="true" /><span>MAINTENANCE DUE</span><Wrench aria-hidden="true" /><span>OLDER INQUIRIES</span><Wrench aria-hidden="true" /></div>
      </section>

      <section className="page-shell hvac-problem" id="problem">
        <div className="hvac-section-number">01</div>
        <div className="hvac-problem-copy">
          <p className="eyebrow">The list you already paid for</p>
          <h2>Don&apos;t wait for the weather to create your next call.</h2>
          <p>Busy-season demand hides a quieter problem: past customers drift out of the maintenance rhythm, unsold estimates age, and good records sit untouched because the team has more urgent work.</p>
        </div>
        <div className="hvac-gauge-card">
          <Gauge aria-hidden="true" />
          <span>PIPELINE PRESSURE</span>
          <strong>LOW?</strong>
          <p>Give the eligible list a useful reason to talk now: a timely tune-up conversation.</p>
        </div>
      </section>

      <section className="hvac-workflow" id="workflow">
        <div className="page-shell">
          <div className="hvac-section-heading">
            <div className="hvac-section-number">02</div>
            <div><p className="eyebrow">The recovery workflow</p><h2>From dormant record to scheduled conversation.</h2></div>
          </div>
          <ol className="hvac-workflow-grid">
            <li><span>01</span><Database aria-hidden="true" /><h3>Choose the right segment.</h3><p>Export a clean list of eligible past customers or prior inquiries. We remove recent activity, opt-outs, and suppressed records.</p></li>
            <li><span>02</span><ClipboardCheck aria-hidden="true" /><h3>Approve the call plan.</h3><p>Set the tune-up offer, customer context, calling hours, disclosures, qualification questions, and handoff rules.</p></li>
            <li><span>03</span><PhoneCall aria-hidden="true" /><h3>Raleigh Lead Recovery works the list.</h3><p>Calls run in controlled batches with an HVAC-specific conversation and a recorded outcome.</p></li>
            <li><span>04</span><CalendarCheck aria-hidden="true" /><h3>Your team gets the live ones.</h3><p>Interested homeowners are routed with their summary and preferred timing—or booked when calendar access is connected.</p></li>
          </ol>
        </div>
      </section>

      <section className="page-shell hvac-outcome">
        <div className="hvac-outcome-copy">
          <div className="hvac-section-number">03</div>
          <p className="eyebrow">Not a robocall blast</p>
          <h2>A controlled campaign your team can actually see.</h2>
          <p>Every record has a status. Every call has an outcome. Interested homeowners rise to the top, while opt-outs and closed records stay suppressed.</p>
          <ul>
            <li><Check aria-hidden="true" /> Attempts, answers, and dispositions</li>
            <li><Check aria-hidden="true" /> Call summaries, recordings, and transcripts</li>
            <li><Check aria-hidden="true" /> Interested contacts and requested timing</li>
            <li><Check aria-hidden="true" /> Booked work and estimated pipeline</li>
          </ul>
        </div>
        <figure className="hvac-dashboard-frame">
          <div><span>RALEIGH LEAD RECOVERY / HVAC CAMPAIGN</span><span>LIVE VIEW</span></div>
          <Image src="/lead-recovery-dashboard-preview.png" alt="Lead recovery dashboard showing campaign attempts, interested contacts, booked appointments, and recovered pipeline" width={1293} height={1028} sizes="(max-width: 900px) calc(100vw - 40px), 620px" />
          <figcaption>Illustrative dashboard data. Results depend on list quality, eligibility, timing, and offer.</figcaption>
        </figure>
      </section>

      <div className="hvac-demo-wrap" id="live-demo">
        <div className="page-shell hvac-single-demo">
          <p className="eyebrow"><span /> Live HVAC browser demo</p>
          <h2>Play the homeowner. Hear the call live.</h2>
          <p>Ask a real HVAC question and hear how Raleigh Lead Recovery gathers the details, checks urgency, and prepares the handoff.</p>
          <WebVoiceDemo />
        </div>
      </div>

      <section className="hvac-pilot">
        <div className="page-shell hvac-pilot-grid">
          <div>
            <div className="hvac-section-number">04</div>
            <p className="eyebrow">Start with a small, inspectable test</p>
            <h2>Prove the conversation before you scale it.</h2>
            <p>We&apos;ll choose one eligible HVAC segment, write the approved tune-up conversation, review the first calls, and measure what comes back.</p>
          </div>
          <div className="hvac-pilot-card">
            <div className="hvac-pilot-stamp">PILOT</div>
            <p>INITIAL RUN</p>
            <strong>25</strong><span>eligible contacts</span>
            <ul><li><Check /> 14 days to test</li><li><Check /> $0 setup fee</li><li><Check /> Call review before scaling</li></ul>
            <a className="hvac-button hvac-button-dark" href={pilotHref} target="_blank" rel="noreferrer">Book the fit call <ArrowRight /></a>
          </div>
        </div>
      </section>

      <section className="page-shell hvac-faq">
        <div><p className="eyebrow">Shop-owner questions</p><h2>Before the first call goes out.</h2></div>
        <div className="hvac-faq-list">{faqs.map((faq) => <details key={faq.question}><summary>{faq.question}<span>+</span></summary><p>{faq.answer}</p></details>)}</div>
      </section>

      <section className="page-shell hvac-founder">
        <Image src="/danny.jpeg" alt="Danny Sullivan, founder of Raleigh Lead Recovery" width={92} height={92} />
        <div><p className="eyebrow">Built and supported in Raleigh</p><h2>You won&apos;t be handed to a generic onboarding queue.</h2><p>I&apos;ll scope the segment with you, configure Raleigh Lead Recovery around your shop, and review the calls before the campaign expands.</p></div>
        <a className="hvac-text-link" href={`mailto:${contactEmail}`}>Talk to Danny <ArrowRight /></a>
      </section>

      <footer className="hvac-footer">
        <div className="page-shell"><BrandMark inverted /><p>AI-powered lead recovery for HVAC companies.</p><nav><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/login">Sign in</Link><a href={`mailto:${contactEmail}`}>{contactEmail}</a></nav></div>
      </footer>
    </main>
  );
}
