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
  Phone,
  ShieldCheck,
  Sparkles,
  Wrench,
} from "lucide-react";
import { BrandMark } from "./components/brand-mark";
import { WebVoiceDemo } from "./components/web-voice-demo";
import { contactEmail } from "@/lib/contact";

const assistantName = process.env.NEXT_PUBLIC_ASSISTANT_NAME?.trim() || "Chloe";
const bookingHref =
  process.env.NEXT_PUBLIC_PILOT_BOOKING_URL?.trim() ||
  "https://calendly.com/hello-raleighaiguy/lead-recovery-fit-call";

export const metadata: Metadata = {
  title: "AI Receptionist That Answers Every Call",
  description:
    "Chloe answers the calls your crew cannot, captures the job, flags urgency, and sends your team a useful handoff—24/7.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "The Call You Miss Shouldn’t Become Someone Else’s Job",
    description:
      "A 24/7 AI receptionist that answers inbound calls, captures the job, and sends your team a useful handoff.",
    url: "/",
  },
};

const faqs = [
  {
    q: "Does the assistant replace our current phone number?",
    a: "No. You can keep the number your customers already know and forward missed, overflow, or after-hours calls to the assistant. A dedicated number is also available when that fits the workflow better.",
  },
  {
    q: "What can the assistant actually do today?",
    a: "It answers inbound calls, understands why the customer is calling, captures contact and job details, identifies urgency, and routes a concise summary to your team. It follows the business rules and callback expectations you approve.",
  },
  {
    q: "Will she make up prices or appointment times?",
    a: "No. The assistant is instructed not to invent pricing, availability, arrival times, or business policies. If something requires your team, it captures the request and sets the callback expectation you choose.",
  },
  {
    q: "Can it book appointments?",
    a: "Calendar booking can be added when an approved calendar and availability rules are connected. Until then, the assistant captures the caller’s preferred timing and hands it to your team without pretending an appointment is confirmed.",
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
          <BrandMark accent="#ff6547" />
          <div className="nav-links">
            <a href="#how-it-works">How it works</a>
            <Link href="/lead-recovery">Lead recovery</Link>
            <Link href="/login">Sign in</Link>
            <a className="button button-dark button-small" href="#talk-now">Talk now <Phone aria-hidden="true" /></a>
          </div>
        </nav>
      </header>

      <section className="receptionist-hero page-shell">
        <div className="receptionist-hero-copy">
          <p className="eyebrow"><span /> The phone keeps ringing while you work</p>
          <h1>The call you miss <em>shouldn&apos;t become their job.</em></h1>
          <p className="receptionist-hero-intro">
            When you&apos;re on a job, after hours, or already on the phone, Chloe answers before the caller tries the next company. She captures the job, flags urgency, and sends your team the details needed to take over.
          </p>
          <div className="receptionist-hero-actions" id="talk-now">
            <WebVoiceDemo assistantName={assistantName} />
          </div>
        </div>

        <div className="receptionist-call-visual" id="hear-assistant" aria-label="Illustration of an AI receptionist answering an after-hours HVAC call">
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
              <p>Your assistant is answering</p>
              <strong>Oak City Heating &amp; Air</strong>
            </div>
          </div>
          <div className="receptionist-transcript">
            <div className="caller-line"><span>Caller</span><p>Our AC just stopped and the house is getting hot.</p></div>
            <div className="mabel-line"><span>Assistant</span><p>I can help get this to the team. First, is anyone in immediate danger?</p></div>
          </div>
          <div className="receptionist-captured">
            <p>Captured automatically</p>
            <div><span>HVAC</span><span>Urgent</span><span>Callback requested</span></div>
          </div>
        </div>
      </section>

      <section className="receptionist-proof-strip" aria-label="AI receptionist capabilities">
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
          <p>A customer with a problem now rarely wants to leave a voicemail and hope for a callback. Your assistant gives them an immediate, useful response while your team keeps working.</p>
        </div>
        <div className="receptionist-scenarios">
          <article>
            <Wrench aria-hidden="true" />
            <span>01</span>
            <h3>You&apos;re with a customer.</h3>
            <p>Your assistant picks up the call you cannot interrupt the job to answer.</p>
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
          <p className="eyebrow">How it works</p>
          <h2>Keep working. Chloe catches the calls you can&apos;t.</h2>
          <p>Your number and day-to-day workflow stay familiar. Chloe follows the business information, urgency rules, and handoff you approve—not a generic script.</p>
        </div>
        <ol>
          <li>
            <span>01</span>
            <div><h3>Teach the assistant the essentials.</h3><p>Services, hours, service area, common questions, urgency rules, and what it should never promise.</p></div>
          </li>
          <li>
            <span>02</span>
            <div><h3>Forward the calls you choose.</h3><p>Use the assistant after hours, when a call is missed, for overflow, or as the first answer on a dedicated line.</p></div>
          </li>
          <li>
            <span>03</span>
            <div><h3>Receive a useful handoff.</h3><p>Your team gets the caller, the reason, the urgency, the requested timing, and the context needed to take over.</p></div>
          </li>
        </ol>
      </section>

      <section className="receptionist-two-jobs">
        <div className="page-shell receptionist-two-jobs-grid">
          <div className="receptionist-two-jobs-copy">
            <p className="eyebrow">One system. Two clear jobs.</p>
            <h2>Answer new demand. Recover the demand you already earned.</h2>
            <p>The receptionist and lead-recovery agents stay separate for each customer, with their own phone workflow, instructions, and controls.</p>
          </div>
          <div className="receptionist-job-cards">
            <article className="active">
              <div><Headphones aria-hidden="true" /><span>Inbound</span></div>
              <h3>24/7 Receptionist</h3>
              <p>Answers missed and after-hours calls, captures the need, and routes the next step.</p>
              <a href="#talk-now">Talk to the receptionist <ArrowRight aria-hidden="true" /></a>
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
          <p>Start with the calls that would have reached voicemail. Add lead recovery when you&apos;re ready to work the demand already sitting in your CRM.</p>
        </div>
        <div className="receptionist-pricing-grid">
          <article>
            <p className="eyebrow">Never miss a call</p>
            <h3>24/7 AI Receptionist</h3>
            <strong><span>$499</span> / month</strong>
            <ul>{["Answers every call", "Business-specific knowledge", "Lead qualification", "Appointment scheduling", "Call transfers", "Call summaries", "SMS follow-up", "Dashboard"].map((item) => <li key={item}><Check aria-hidden="true" /> {item}</li>)}</ul>
            <a className="button button-dark" href={bookingHref} target="_blank" rel="noreferrer">Set up your receptionist <ArrowRight aria-hidden="true" /></a>
          </article>
          <article className="featured">
            <p className="eyebrow">Answer + grow</p>
            <h3>Receptionist + Lead Recovery</h3>
            <strong><span>$999</span> / month</strong>
            <ul>{["Everything in AI Receptionist", "Calls missed leads", "Calls old estimates", "Re-engages dormant customers", "Books appointments", "Campaign reporting"].map((item) => <li key={item}><Check aria-hidden="true" /> {item}</li>)}</ul>
            <a className="button button-light" href={bookingHref} target="_blank" rel="noreferrer">Build your growth system <ArrowRight aria-hidden="true" /></a>
          </article>
          <article>
            <p className="eyebrow">Custom operations</p>
            <h3>Managed Automations</h3>
            <strong><span>Custom</span></strong>
            <ul>{["CRM integrations", "Custom campaigns", "Calendar workflows", "Reporting automations", "Ongoing optimization"].map((item) => <li key={item}><Check aria-hidden="true" /> {item}</li>)}</ul>
            <a className="button button-dark" href={bookingHref} target="_blank" rel="noreferrer">Talk through the workflow <ArrowRight aria-hidden="true" /></a>
          </article>
        </div>
      </section>

      <section className="receptionist-guardrails page-shell">
        <div>
          <p className="eyebrow">Natural, not reckless</p>
          <h2>Helpful enough to handle the call. Careful enough to know her limits.</h2>
        </div>
        <div className="receptionist-guardrail-list">
          <article><ShieldCheck aria-hidden="true" /><div><h3>Approved knowledge only</h3><p>The assistant uses the services, hours, service area, policies, and instructions you provide.</p></div></article>
          <article><Clock3 aria-hidden="true" /><div><h3>Clear callback expectations</h3><p>She says what happens next without inventing availability or arrival times.</p></div></article>
          <article><MessageSquareText aria-hidden="true" /><div><h3>Context your team can use</h3><p>Every handoff is structured around the caller, their need, urgency, and requested timing.</p></div></article>
        </div>
      </section>

      <section className="faq-section page-shell receptionist-faq">
        <div className="section-heading compact-heading">
          <p className="eyebrow">Good questions</p>
          <h2>What the assistant does—and doesn&apos;t do.</h2>
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
          <p>I&apos;ll learn how your business handles calls, tune Chloe to those rules, and test the experience with you before she answers a customer.</p>
        </div>
        <a className="text-link" href={bookingHref} target="_blank" rel="noreferrer">Talk through your call flow <ArrowRight aria-hidden="true" /></a>
      </section>

      <section className="receptionist-final page-shell">
        <p className="eyebrow">Skip the pitch</p>
        <h2>Talk to the receptionist right now.</h2>
        <p>Give Chloe a real service scenario. Ask a hard question. Decide from the conversation—not the sales pitch.</p>
        <WebVoiceDemo assistantName={assistantName} />
      </section>

      <footer className="site-footer">
        <div className="page-shell footer-row">
          <div><BrandMark inverted accent="#ff6547" /><p>© 2026 Raleigh Lead Recovery</p></div>
          <nav aria-label="Footer navigation"><Link href="/lead-recovery">Lead recovery</Link><Link href="/blog">Writing</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/login">Sign in</Link><a href={`mailto:${contactEmail}`}>{contactEmail}</a></nav>
        </div>
      </footer>
    </main>
  );
}
