import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  Check,
  Clock3,
  Headphones,
  MessageSquareText,
  Moon,
  ShieldCheck,
  Sparkles,
  Wrench,
} from "lucide-react";
import { BrandMark } from "./components/brand-mark";
import { WebVoiceDemo } from "./components/web-voice-demo";
import { contactEmail } from "@/lib/contact";

const bookingHref =
  process.env.NEXT_PUBLIC_PILOT_BOOKING_URL?.trim() ||
  "https://calendly.com/hello-raleighaiguy/lead-recovery-fit-call";

export const metadata: Metadata = {
  title: "Raleigh Lead Recovery Answers Every Call",
  description:
    "Raleigh Lead Recovery answers the calls your crew cannot, captures the job, flags urgency, and sends your team a useful handoff—24/7.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "The Call You Miss Shouldn’t Become Someone Else’s Job",
    description:
      "Raleigh Lead Recovery answers inbound calls, captures the job, and sends your team a useful handoff.",
    url: "/",
  },
};

const faqs = [
  {
    q: "Does Raleigh Lead Recovery replace our current phone number?",
    a: "No. Keep the number your customers already know and forward missed, overflow, or after-hours calls to Raleigh Lead Recovery. A dedicated number is also available when that fits the workflow better.",
  },
  {
    q: "What can Raleigh Lead Recovery do today?",
    a: "It answers inbound calls, understands why the customer is calling, captures contact and job details, identifies urgency, and routes a concise summary to your team. It follows the business rules and callback expectations you approve.",
  },
  {
    q: "Will it make up prices or appointment times?",
    a: "No. Raleigh Lead Recovery does not invent pricing, availability, arrival times, or business policies. If something requires your team, it captures the request and sets the callback expectation you choose.",
  },
  {
    q: "Can it book appointments?",
    a: "Calendar booking can be added when an approved calendar and availability rules are connected. Until then, Raleigh Lead Recovery captures the caller’s preferred timing and hands it to your team without pretending an appointment is confirmed.",
  },
  {
    q: "Does it also follow up with old leads?",
    a: "Yes. Lead Recovery is a separate workflow with its own audience, rules, and outbound agent. That keeps inbound reception and proactive follow-up easy to understand and control.",
  },
];

export default function HomePage() {
  return (
    <main className="landing-page receptionist-page">
      <header className="site-header receptionist-header">
        <nav className="page-shell nav-row" aria-label="Primary navigation">
          <BrandMark accent="#d8ff57" />
          <div className="nav-links">
            <a href="#how-it-works">How it works</a>
            <Link href="/lead-recovery">Lead recovery</Link>
            <Link href="/login">Sign in</Link>
            <a className="button button-dark button-small" href="#talk-now">Try it now <ArrowRight aria-hidden="true" /></a>
          </div>
        </nav>
      </header>

      <section className="receptionist-hero page-shell">
        <div className="receptionist-hero-copy">
          <p className="eyebrow"><span /> Local call coverage for Raleigh service businesses</p>
          <h1>Never miss a <em>call again.</em></h1>
          <p className="receptionist-hero-intro">
            Raleigh Lead Recovery answers when you can&apos;t, captures what the customer needs, and sends your team a useful handoff.
          </p>
          <div className="receptionist-hero-actions" id="talk-now">
            <WebVoiceDemo />
          </div>
        </div>

        <div className="receptionist-call-visual" id="hear-assistant" aria-label="Illustration of Raleigh Lead Recovery answering an after-hours HVAC call">
          <div className="receptionist-call-visual-top">
            <span><i /> Live call</span>
            <span>11:47 PM</span>
          </div>
          <div className="receptionist-signal-stage">
            <div className="receptionist-signal" aria-hidden="true">
              <span className="receptionist-signal-ring ring-one" />
              <span className="receptionist-signal-ring ring-two" />
              <span className="receptionist-signal-core"><Headphones /></span>
            </div>
            <div>
              <p>Raleigh Lead Recovery is answering</p>
              <strong>Oak City Heating &amp; Air</strong>
            </div>
          </div>
          <div className="receptionist-transcript">
            <div className="caller-line"><span>Caller</span><p>Our AC just stopped and the house is getting hot.</p></div>
            <div className="agent-line"><span>Raleigh Lead Recovery</span><p>I can help get this to the team. First, is anyone in immediate danger?</p></div>
          </div>
          <div className="receptionist-captured">
            <p>Captured automatically</p>
            <div><span>HVAC</span><span>Urgent</span><span>Callback requested</span></div>
          </div>
        </div>
      </section>

      <section className="receptionist-proof-strip" aria-label="Raleigh Lead Recovery capabilities">
        <div className="page-shell">
          <span><Moon aria-hidden="true" /> After hours</span>
          <span><BellRing aria-hidden="true" /> Missed-call overflow</span>
          <span><MessageSquareText aria-hidden="true" /> Useful summaries</span>
          <span><ShieldCheck aria-hidden="true" /> Your approved rules</span>
        </div>
      </section>

      <section className="receptionist-problem page-shell">
        <div className="receptionist-section-heading">
          <p className="eyebrow">The call does not wait</p>
          <h2>Your phone rings when your hands are already full.</h2>
          <p>A customer with a problem now rarely wants to leave a voicemail and hope for a callback. Raleigh Lead Recovery gives them an immediate, useful response while your team keeps working.</p>
        </div>
        <div className="receptionist-scenarios">
          <article>
            <Wrench aria-hidden="true" />
            <span>01</span>
            <h3>You&apos;re with a customer.</h3>
            <p>The job stays on track, and the caller still gets an answer.</p>
          </article>
          <article>
            <Moon aria-hidden="true" />
            <span>02</span>
            <h3>The office is closed.</h3>
            <p>The caller is heard, the need is captured, and urgent requests are flagged.</p>
          </article>
          <article>
            <BellRing aria-hidden="true" />
            <span>03</span>
            <h3>Three calls arrive at once.</h3>
            <p>Overflow gets a consistent response instead of another trip to voicemail.</p>
          </article>
        </div>
      </section>

      <section className="receptionist-process page-shell" id="how-it-works">
        <div className="receptionist-process-heading">
          <p className="eyebrow">Self-serve setup</p>
          <h2><span>Set it up.</span><span>Try it live.</span><span>Turn it on.</span></h2>
          <p>Add the essentials, test a real call, then forward only the calls you want covered. Set it up yourself or ask for help.</p>
        </div>
        <ol>
          <li>
            <span>01</span>
            <div><h3>Add the business essentials.</h3><p>Services, hours, service area, common questions, urgency rules, and what Raleigh Lead Recovery should never promise.</p></div>
          </li>
          <li>
            <span>02</span>
            <div><h3>Try the call flow live.</h3><p>Talk through a real customer scenario and adjust the answers, urgency rules, and handoff before going live.</p></div>
          </li>
          <li>
            <span>03</span>
            <div><h3>Forward the calls you choose.</h3><p>Keep your existing number. Cover missed calls, after-hours calls, overflow, or every inbound call.</p></div>
          </li>
        </ol>
      </section>

      <section className="receptionist-human page-shell">
        <div className="receptionist-section-heading">
          <p className="eyebrow">Built for the people doing the work</p>
          <h2>Handle the interruption. Keep the human touch.</h2>
          <p>Nothing replaces your team&apos;s judgment, empathy, or customer relationships. Raleigh Lead Recovery handles routine intake and captures the context, so your people can respond prepared and spend more time doing the work only people can do.</p>
        </div>
      </section>

      <section className="receptionist-two-jobs">
        <div className="page-shell receptionist-two-jobs-grid">
          <div className="receptionist-two-jobs-copy">
            <p className="eyebrow">One system. Two clear jobs.</p>
            <h2>Answer new demand. Recover the demand you already earned.</h2>
            <p>Use call coverage, lead recovery, or both. Each follows its own rules, so one workflow never gets in the other&apos;s way.</p>
          </div>
          <div className="receptionist-job-cards">
            <article className="active">
              <div><Headphones aria-hidden="true" /><span>Inbound</span></div>
              <h3>24/7 Call Coverage</h3>
              <p>Answers missed and after-hours calls, captures the need, and routes the next step.</p>
              <a href="#talk-now">Try it now <ArrowRight aria-hidden="true" /></a>
            </article>
            <article>
              <div><Sparkles aria-hidden="true" /><span>Outbound</span></div>
              <h3>Lead Recovery</h3>
              <p>Re-engages qualified past inquiries and identifies who is ready to talk again.</p>
              <Link href="/lead-recovery">Explore lead recovery <ArrowRight aria-hidden="true" /></Link>
            </article>
          </div>
        </div>
      </section>

      <section className="receptionist-pricing page-shell" id="pricing">
        <div className="receptionist-section-heading">
          <p className="eyebrow">Simple monthly plans</p>
          <h2>One caught job can cover the month.</h2>
          <p>Start with missed calls. Add lead recovery when you&apos;re ready to work the demand already sitting in your CRM.</p>
        </div>
        <div className="receptionist-pricing-grid">
          <article>
            <p className="eyebrow">Never miss a call</p>
            <h3>24/7 Call Coverage</h3>
            <strong><span>$499</span> / month</strong>
            <ul>{["Answers every call", "Business-specific knowledge", "Lead qualification", "Appointment scheduling", "Call transfers", "Call summaries", "SMS follow-up", "Dashboard"].map((item) => <li key={item}><Check aria-hidden="true" /> {item}</li>)}</ul>
            <Link className="button button-dark" href="/signup">Start free <ArrowRight aria-hidden="true" /></Link>
          </article>
          <article className="featured">
            <p className="eyebrow">Answer + grow</p>
            <h3>Call Coverage + Lead Recovery</h3>
            <strong><span>$999</span> / month</strong>
            <ul>{["Everything in Call Coverage", "Calls missed leads", "Calls old estimates", "Re-engages dormant customers", "Books appointments", "Campaign reporting"].map((item) => <li key={item}><Check aria-hidden="true" /> {item}</li>)}</ul>
            <Link className="button button-light" href="/signup">Start free <ArrowRight aria-hidden="true" /></Link>
          </article>
          <article>
            <p className="eyebrow">Custom operations</p>
            <h3>Managed Automations</h3>
            <strong><span>Custom</span></strong>
            <ul>{["CRM integrations", "Custom campaigns", "Calendar workflows", "Reporting automations", "Ongoing optimization"].map((item) => <li key={item}><Check aria-hidden="true" /> {item}</li>)}</ul>
            <a className="button button-dark" href={bookingHref} target="_blank" rel="noreferrer">Talk to us <ArrowRight aria-hidden="true" /></a>
          </article>
        </div>
      </section>

      <section className="receptionist-guardrails page-shell">
        <div>
          <p className="eyebrow">Natural, not reckless</p>
          <h2>Knows your business. Knows its limits.</h2>
        </div>
        <div className="receptionist-guardrail-list">
          <article><ShieldCheck aria-hidden="true" /><div><h3>Approved knowledge only</h3><p>Raleigh Lead Recovery uses the services, hours, service area, policies, and instructions you provide.</p></div></article>
          <article><Clock3 aria-hidden="true" /><div><h3>Clear callback expectations</h3><p>It explains what happens next without inventing availability or arrival times.</p></div></article>
          <article><MessageSquareText aria-hidden="true" /><div><h3>Context your team can use</h3><p>Every handoff is structured around the caller, their need, urgency, and requested timing.</p></div></article>
        </div>
      </section>

      <section className="faq-section page-shell receptionist-faq">
        <div className="section-heading compact-heading">
          <p className="eyebrow">Good questions</p>
          <h2>What to expect.</h2>
        </div>
        <div className="faq-list">
          {faqs.map((faq) => (
            <details key={faq.q}>
              <summary>{faq.q}<span>+</span></summary>
              <p>{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="maker-section page-shell receptionist-maker">
        <Image src="/danny.jpeg" alt="Danny Sullivan, founder of Raleigh Lead Recovery" width={80} height={80} />
        <div>
          <p className="eyebrow">Set up with a real person</p>
          <h2>Built and supported in Raleigh.</h2>
          <p>Set it up yourself, or bring me in to shape the call rules and test the experience before it answers a customer.</p>
        </div>
        <a className="text-link" href={bookingHref} target="_blank" rel="noreferrer">Talk through your call flow <ArrowRight aria-hidden="true" /></a>
      </section>

      <section className="receptionist-final page-shell">
        <p className="eyebrow">Skip the pitch</p>
        <h2>Try it now.</h2>
        <p>Give Raleigh Lead Recovery a real service scenario. Ask a hard question. Decide from the conversation, not the sales pitch.</p>
        <WebVoiceDemo />
      </section>

      <footer className="site-footer">
        <div className="page-shell footer-row">
          <div><BrandMark inverted accent="#d8ff57" /><p>© 2026 Raleigh Lead Recovery</p></div>
          <nav aria-label="Footer navigation"><Link href="/lead-recovery">Lead recovery</Link><Link href="/blog">Writing</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/login">Sign in</Link><a href={`mailto:${contactEmail}`}>{contactEmail}</a></nav>
        </div>
      </footer>
    </main>
  );
}
