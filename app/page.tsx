import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Clock3,
  Headphones,
  MessageSquareText,
  PhoneForwarded,
  ShieldCheck,
} from "lucide-react";
import { BrandMark } from "./components/brand-mark";
import { PublicSiteNav } from "./components/public-site-nav";
import { AutoTextBackDemo } from "./components/auto-text-back-demo";
import { WebVoiceDemo } from "./components/web-voice-demo";
import { contactEmail } from "@/lib/contact";

const bookingHref =
  process.env.NEXT_PUBLIC_PILOT_BOOKING_URL?.trim() ||
  "https://calendly.com/hello-raleighaiguy/raleigh-lead-recovery-pilot-setup";

export const metadata: Metadata = {
  title: "AI Missed-Call Coverage for Raleigh Service Businesses",
  description:
    "Raleigh Lead Recovery answers missed and after-hours calls, captures what each customer needs, and gives your team a clear next step. Try a results-focused pilot free.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Every Missed Call Gets a Real Next Step",
    description:
      "Natural AI call coverage for Raleigh service businesses, with a free results-focused pilot.",
    url: "/",
    type: "website",
    images: [{
        url: "/opengraph-image",
      width: 1200,
      height: 630,
      alt: "Raleigh Lead Recovery missed-call coverage",
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Every Missed Call Gets a Real Next Step",
    description: "Natural AI call coverage for Raleigh service businesses.",
    images: ["/opengraph-image"],
  },
};

const faqs = [
  {
    q: "Do we have to replace our phone system?",
    a: "No. Your number, provider, and phones stay in place. We use your provider’s no-answer or conditional-forwarding setting, so your team always gets the first chance to answer.",
  },
  {
    q: "What does Chloe say to callers?",
    a: "Only what you approve. We build the greeting, questions, service area, urgency rules, and callback expectations with you. Chloe identifies herself as an AI assistant and never invents pricing, availability, or arrival times.",
  },
  {
    q: "What happens if someone hangs up?",
    a: "They can receive an immediate, business-approved text from the coverage number. Their reply and the missed-call context are sent to your team so the lead still has a way in.",
  },
  {
    q: "Can it transfer an urgent call?",
    a: "Yes, if you approve a transfer path. We send transfers to a separate owner or dispatcher number so the call cannot loop back into the forwarded main line.",
  },
  {
    q: "What happens after the free pilot?",
    a: "We review every outcome together. If the coverage was useful, the founding plan starts at $297 per month. If it was not, you turn forwarding off and owe nothing for the test.",
  },
];

export default function HomePage() {
  return (
    <main className="landing-page rlr-home">
      <PublicSiteNav
        cta={{ href: bookingHref, label: "Book free pilot" }}
      />

      <section className="rlr-hero">
        <div className="page-shell rlr-hero-grid">
          <div className="rlr-hero-copy">
            <p className="rlr-kicker"><span /> Missed-call coverage for Raleigh service businesses</p>
            <h1>A missed call should still feel answered.</h1>
            <p className="rlr-hero-intro">
              When your team can&apos;t pick up, Chloe answers naturally, asks one
              useful question at a time, and sends the opportunity back with a
              clear next step.
            </p>
            <div className="rlr-hero-actions">
              <a className="rlr-button rlr-button-primary" href={bookingHref} target="_blank" rel="noreferrer">
                Book a free pilot <ArrowRight aria-hidden="true" />
              </a>
              <a className="rlr-button rlr-button-secondary" href="#how-it-works">See how it works</a>
            </div>
            <div className="rlr-hero-assurances" aria-label="Pilot assurances">
              <span><Check aria-hidden="true" /> Keep your number</span>
              <span><Check aria-hidden="true" /> You approve every rule</span>
              <span><Check aria-hidden="true" /> Turn it off anytime</span>
            </div>
          </div>

          <div className="rlr-demo-card" id="talk-now">
            <div className="rlr-demo-topline">
              <div><span className="rlr-live-dot" /><span>Meet Chloe</span></div>
              <span>Live voice demo</span>
            </div>
            <div className="rlr-demo-stage">
              <p className="rlr-demo-business"><span>Fictional demo company</span> Oak City Heating &amp; Air</p>
              <p className="rlr-demo-prompt">Try saying: <strong>“Our AC stopped cooling.”</strong></p>
              <WebVoiceDemo mode="receptionist" label="Talk to Chloe now" visual="orb" />
            </div>
            <div className="rlr-demo-outcome" aria-label="Example call outcome">
              <div><span>Need</span><strong>No cooling</strong></div>
              <div><span>Priority</span><strong>Today</strong></div>
              <div><span>Next step</span><strong>Call back</strong></div>
            </div>
          </div>
        </div>
      </section>

      <section className="rlr-trust-band" aria-label="How the service fits your business">
        <div className="page-shell">
          <span><Headphones aria-hidden="true" /> Your team answers first</span>
          <span><PhoneForwarded aria-hidden="true" /> No new phone system</span>
          <span><MessageSquareText aria-hidden="true" /> Text-back included</span>
          <span><ShieldCheck aria-hidden="true" /> Every outcome is visible</span>
        </div>
      </section>

      <section className="rlr-flow page-shell" id="how-it-works">
        <div className="rlr-section-heading">
          <p className="rlr-kicker">A better missed-call experience</p>
          <h2>Short conversation. Clear handoff.</h2>
          <p>
            The goal is not to keep a caller talking. It is to understand the
            need, protect the customer experience, and give your team something
            useful to act on.
          </p>
        </div>
        <ol className="rlr-flow-steps">
          <li><span>01</span><div><h3>Answer naturally</h3><p>Chloe introduces herself, acknowledges why they called, and gives them room to respond.</p></div></li>
          <li><span>02</span><div><h3>Ask one thing at a time</h3><p>Short, relevant questions capture the service need, urgency, location, and preferred next step.</p></div></li>
          <li><span>03</span><div><h3>Hand back the opportunity</h3><p>Your team gets a concise summary, contact details, and the action the caller expects next.</p></div></li>
        </ol>
      </section>

      <section className="rlr-outcomes" id="outcomes">
        <div className="page-shell rlr-outcomes-grid">
          <div className="rlr-outcomes-copy">
            <p className="rlr-kicker">What your team receives</p>
            <h2>Not a transcript dump. A next step.</h2>
            <p>
              Every handled call becomes a clean, reviewable outcome. Your team
              can see what the customer needs, how urgent it is, and whether a
              callback or transfer was requested.
            </p>
            <div className="rlr-summary-card">
              <div className="rlr-summary-header"><span>New opportunity</span><strong>6:43 PM</strong></div>
              <div className="rlr-summary-person">
                <span>JM</span>
                <div><strong>Jordan M.</strong><p>North Raleigh · Returning customer</p></div>
                <i>Needs callback</i>
              </div>
              <dl>
                <div><dt>Reason</dt><dd>Upstairs AC stopped cooling</dd></div>
                <div><dt>Urgency</dt><dd>Home getting warm · No safety risk</dd></div>
                <div><dt>Requested</dt><dd>Tomorrow morning appointment</dd></div>
              </dl>
              <div className="rlr-summary-footer"><Check aria-hidden="true" /> Summary sent to owner</div>
            </div>
          </div>

          <div className="rlr-text-back-wrap">
            <div>
              <p className="rlr-kicker">If they hang up</p>
              <h3>Keep the door open with an immediate text.</h3>
              <p>A missed caller who does not want to talk to an assistant can still reply on their own time. The wording and routing are approved by you.</p>
            </div>
            <AutoTextBackDemo />
          </div>
        </div>
      </section>

      <section className="rlr-pilot page-shell" id="pilot">
        <div className="rlr-pilot-copy">
          <p className="rlr-kicker">Evidence before a subscription</p>
          <h2>Give it enough time to produce real evidence.</h2>
          <p>
            The free pilot runs for up to seven days or five handled missed
            calls, whichever comes first. Your team works as usual. Only
            unanswered calls roll over.
          </p>
          <ul>
            <li><Check aria-hidden="true" /> Greeting and questions approved before launch</li>
            <li><Check aria-hidden="true" /> Immediate summaries after handled calls</li>
            <li><Check aria-hidden="true" /> Founder-led setup and outcome review</li>
          </ul>
        </div>
        <div className="rlr-price-card">
          <p>Results-focused pilot</p>
          <div><strong>$0</strong><span>No setup fee</span></div>
          <ul>
            <li><Clock3 aria-hidden="true" /> Up to seven calendar days</li>
            <li><PhoneForwarded aria-hidden="true" /> Missed calls only</li>
            <li><MessageSquareText aria-hidden="true" /> Up to five handled calls</li>
          </ul>
          <a className="rlr-button rlr-button-light" href={bookingHref} target="_blank" rel="noreferrer">
            Book the free pilot <ArrowRight aria-hidden="true" />
          </a>
          <p className="rlr-price-note">If it proves useful, the founding plan starts at $297/month for up to 150 minutes. Cancel anytime.</p>
        </div>
      </section>

      <section className="rlr-safety">
        <div className="page-shell rlr-safety-grid">
          <div className="rlr-safety-heading">
            <p className="rlr-kicker">Designed to earn trust</p>
            <h2>Your phones stay yours. Your rules stay in control.</h2>
          </div>
          <div className="rlr-safety-list">
            <article><ShieldCheck aria-hidden="true" /><div><h3>No invented promises</h3><p>Chloe follows your approved services, hours, service area, escalation rules, and callback expectations.</p></div></article>
            <article><PhoneForwarded aria-hidden="true" /><div><h3>No forwarding loops</h3><p>Urgent transfers go to a separate approved number, never back to the forwarded main line.</p></div></article>
            <article><Headphones aria-hidden="true" /><div><h3>No black box</h3><p>You can review every call outcome, adjust the flow, pause coverage, or turn forwarding off.</p></div></article>
          </div>
        </div>
      </section>

      <section className="rlr-founder page-shell">
        <Image src="/danny.jpeg" alt="Danny Sullivan, founder of Raleigh Lead Recovery" width={112} height={112} />
        <div>
          <p className="rlr-kicker">Local, founder-led setup</p>
          <h2>You work directly with me.</h2>
          <p>
            I&apos;m Danny Sullivan, a Raleigh-based AI product engineer and former
            service-business owner. I set up the call flow with you and review
            the real outcomes—not just a dashboard metric.
          </p>
        </div>
        <a className="rlr-inline-link" href={`mailto:${contactEmail}`}>Email Danny <ArrowRight aria-hidden="true" /></a>
      </section>

      <section className="rlr-faq page-shell" id="questions">
        <div className="rlr-faq-heading">
          <p className="rlr-kicker">Before you try it</p>
          <h2>Good questions.</h2>
        </div>
        <div className="rlr-faq-list">
          {faqs.map((faq) => (
            <details key={faq.q}>
              <summary>{faq.q}<span>+</span></summary>
              <p>{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="rlr-final">
        <div className="page-shell">
          <p className="rlr-kicker">One Raleigh pilot opening</p>
          <h2>Let one missed call become a real conversation.</h2>
          <p>No new phone system. No setup fee. Just enough time to see real outcomes.</p>
          <div>
            <a className="rlr-button rlr-button-light" href={bookingHref} target="_blank" rel="noreferrer">
              Book the free pilot <ArrowRight aria-hidden="true" />
            </a>
            <a className="rlr-final-demo-link" href="#talk-now">Talk to Chloe first</a>
          </div>
        </div>
      </section>

      <footer className="rlr-footer">
        <div className="page-shell">
          <div><BrandMark inverted accent="#63e6d1" /><p>© 2026 Raleigh Lead Recovery</p></div>
          <nav aria-label="Footer navigation">
            <Link href="/lead-recovery">Lead recovery</Link>
            <Link href="/blog">Writing</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/login">Sign in</Link>
            <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
          </nav>
        </div>
      </footer>
    </main>
  );
}
