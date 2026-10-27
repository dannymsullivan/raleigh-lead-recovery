import { PublicSiteFooter } from "@/app/components/public-site-footer";
import type { Metadata } from "next";
import Image from "next/image";
import {
  ArrowRight,
  Check,
  Clock3,
  Headphones,
  MessageSquareText,
  PhoneForwarded,
  ShieldCheck,
} from "lucide-react";
import { PublicSiteNav } from "../components/public-site-nav";
import { AutoTextBackDemo } from "../components/auto-text-back-demo";
import { WebVoiceDemo } from "../components/web-voice-demo";
import { contactEmail } from "@/lib/contact";

export const metadata: Metadata = {
  title: "AI Missed-Call Coverage for Service Businesses",
  description:
    "Raleigh Lead Recovery answers missed and after-hours calls, captures what each customer needs, and gives your team a clear next step. Try the browser demo and ask about setup.",
  alternates: { canonical: "/voice" },
  openGraph: {
    title: "Every Missed Call Gets a Real Next Step",
    description:
      "Natural AI call coverage for service businesses, with hands-on setup.",
    url: "/voice",
    type: "website",
    images: [{
        url: "/voice/opengraph-image",
      width: 1200,
      height: 630,
      alt: "Raleigh Lead Recovery missed-call coverage",
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Every Missed Call Gets a Real Next Step",
    description: "Natural AI call coverage for service businesses.",
    images: ["/voice/opengraph-image"],
  },
};

const faqs = [
  {
    q: "Do we have to replace our phone system?",
    a: "You can usually keep your current number and phones. We check your provider’s call-forwarding options and set up the agent to answer when your team can’t.",
  },
  {
    q: "What does Chloe say to callers?",
    a: "You approve the greeting, business information, and questions before launch. Chloe introduces herself as an AI assistant and asks for the details your team needs to follow up. We set rules for prices, appointment requests, and urgent calls.",
  },
  {
    q: "What happens if someone hangs up?",
    a: "Optional text messages let eligible missed callers reply with what they need. We confirm messaging requirements, costs, and where replies go before turning this on.",
  },
  {
    q: "Can it transfer an urgent call?",
    a: "Yes, if you approve a transfer path. We send transfers to a separate owner or dispatcher number so the call cannot loop back into the forwarded main line.",
  },
  {
    q: "How much does voice coverage cost?",
    a: "Voice AI starts at $799/month. Your quote confirms included minutes, call forwarding, and any extra costs. Website chat starts at $399/month after a two-week free trial. We can quote both services together.",
  },
];

export default function VoicePage() {
  return (
    <main className="landing-page rlr-home rlr-retro">
      <PublicSiteNav
        cta={{ href: "/get-started?service=voice", label: "Request voice setup" }}
      />

      <section className="rlr-hero">
        <div className="page-shell rlr-hero-grid">
          <div className="rlr-hero-copy">
            <p className="rlr-kicker"><span /> Missed-call coverage for service businesses</p>
            <h1>Answer business calls when your team is busy.</h1>
            <p className="rlr-hero-intro">
              Your AI voice agent greets callers, asks what they need, and collects
              their contact details. Your team gets a summary and transcript
              so they can follow up without starting over.
            </p>
            <div className="rlr-hero-actions">
              <a className="rlr-button rlr-button-primary" href="/get-started?service=voice">
                Request voice setup <ArrowRight aria-hidden="true" />
              </a>
              <a className="rlr-button rlr-button-secondary" href="#talk-now">Try the voice demo</a>
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
          <span><MessageSquareText aria-hidden="true" /> Optional text-back</span>
          <span><ShieldCheck aria-hidden="true" /> Read call summaries</span>
        </div>
      </section>

      <section className="rlr-flow page-shell" id="how-it-works">
        <div className="rlr-section-heading">
          <p className="rlr-kicker">A better missed-call experience</p>
          <h2>Your caller gets an answer. Your team gets the details.</h2>
          <p>
            The agent asks what the caller needs and how to reach them. Your team gets the details in one place, ready for a callback.
          </p>
        </div>
        <ol className="rlr-flow-steps">
          <li><span>01</span><div><h3>Answer naturally</h3><p>Chloe introduces herself, acknowledges why they called, and gives them room to respond.</p></div></li>
          <li><span>02</span><div><h3>Ask one thing at a time</h3><p>Short, relevant questions capture the service need, urgency, location, and preferred next step.</p></div></li>
          <li><span>03</span><div><h3>Get the details for a callback</h3><p>Your team gets a concise summary, contact details, and the action the caller expects next.</p></div></li>
        </ol>
      </section>

      <section className="rlr-outcomes" id="outcomes">
        <div className="page-shell rlr-outcomes-grid">
          <div className="rlr-outcomes-copy">
            <p className="rlr-kicker">What your team receives</p>
            <h2>See who called, what they need, and how to follow up.</h2>
            <p>
              Read the call summary to see what the customer needs, how urgent it is, and whether they asked for a callback or a transfer.
            </p>
            <div className="rlr-summary-card">
              <div className="rlr-summary-header"><span>Example call summary</span><strong>6:43 PM</strong></div>
              <div className="rlr-summary-person">
                <span>JM</span>
                <div><strong>Jordan M.</strong><p>Returning customer · AC repair</p></div>
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
              <h3>Add a text-back option for missed callers.</h3>
              <p>When messaging is enabled for your business, missed callers can reply on their own time. You approve the text, and we confirm where replies go and what messaging costs.</p>
            </div>
            <AutoTextBackDemo />
          </div>
        </div>
      </section>

      <section className="rlr-flow page-shell" id="setup">
        <div className="rlr-section-heading"><p className="rlr-kicker">Setup included</p><h2>We configure the agent with you before calls are forwarded.</h2><p>Keep your business number. We check your provider’s forwarding options and agree on when the agent should answer.</p></div>
        <ol className="rlr-flow-steps">
          <li><span>01</span><div><h3>Share your business information</h3><p>Tell us your services, hours, coverage area, and how your team handles urgent calls.</p></div></li>
          <li><span>02</span><div><h3>Review and test the call flow</h3><p>Approve the greeting, questions, callback expectations, and any transfer destination. Try it before customers do.</p></div></li>
          <li><span>03</span><div><h3>Turn on coverage and review calls</h3><p>We help configure forwarding. Review summaries and transcripts, then adjust the call flow as needed.</p></div></li>
        </ol>
        <p className="voice-setup-note"><Clock3 size={18} aria-hidden="true" /> Setup timing, included minutes, and pricing are agreed before service starts.</p>
        <a className="rlr-button rlr-button-primary" href="/get-started?service=voice">Request voice setup <ArrowRight aria-hidden="true" /></a>
      </section>

      <section className="rlr-safety">
        <div className="page-shell rlr-safety-grid">
          <div className="rlr-safety-heading">
            <p className="rlr-kicker">Designed to earn trust</p>
            <h2>Your phones stay yours. Your rules stay in control.</h2>
          </div>
          <div className="rlr-safety-list">
            <article><ShieldCheck aria-hidden="true" /><div><h3>You approve what it says</h3><p>Chloe follows your approved services, hours, service area, escalation rules, and callback expectations.</p></div></article>
            <article><PhoneForwarded aria-hidden="true" /><div><h3>Urgent calls go to the right person</h3><p>Urgent transfers go to a separate approved number, never back to the forwarded main line.</p></div></article>
            <article><Headphones aria-hidden="true" /><div><h3>You can review the calls</h3><p>You can review every call outcome, adjust the flow, pause coverage, or turn forwarding off.</p></div></article>
          </div>
        </div>
      </section>

      <section className="rlr-founder page-shell">
        <Image src="/danny.jpeg" alt="Danny Sullivan, founder of Raleigh Lead Recovery" width={112} height={112} />
        <div>
          <p className="rlr-kicker">Founder-led setup</p>
          <h2>You work directly with me.</h2>
          <p>
            I&apos;m Danny Sullivan, an AI product engineer and former
            service-business owner. I set up the call flow with you and help you review calls and improve the answers over time.
          </p>
        </div>
        <a className="rlr-inline-link" href={`mailto:${contactEmail}`}>Email Danny <ArrowRight aria-hidden="true" /></a>
      </section>

      <section className="rlr-faq page-shell" id="questions">
        <div className="rlr-faq-heading">
          <p className="rlr-kicker">Before you try it</p>
          <h2>Frequently asked questions.</h2>
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
          <p className="rlr-kicker">Try it with your business</p>
          <h2>Give callers help when you can’t pick up.</h2>
          <p>Tell us how your business handles calls. We’ll help you set up the right coverage.</p>
          <div>
            <a className="rlr-button rlr-button-light" href="/get-started?service=voice">
              Request voice setup <ArrowRight aria-hidden="true" />
            </a>
            <a className="rlr-final-demo-link" href="#talk-now">Talk to Chloe first</a>
          </div>
        </div>
      </section>

      <PublicSiteFooter />
    </main>
  );
}
