import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck,
  ClipboardCheck,
  Database,
  MailCheck,
  MessageSquareText,
  PhoneIncoming,
  PhoneCall,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TimerReset,
} from "lucide-react";
import { BrandMark } from "../components/brand-mark";
import { WebVoiceDemo } from "../components/web-voice-demo";
import { contactEmail } from "@/lib/contact";

export const metadata: Metadata = {
  title: "Lead Recovery for Raleigh Businesses | Raleigh Lead Recovery",
  description: "Raleigh Lead Recovery follows up with old and unresponsive leads, identifies who is still interested, and routes qualified opportunities back to your team.",
  alternates: { canonical: "/lead-recovery" },
  openGraph: {
    title: "Turn Old Leads Into New Business | Raleigh Lead Recovery",
    description: "Put the leads you already paid for back to work with thoughtful, controlled follow-up.",
    url: "/lead-recovery",
    images: [
      {
        url: "/raleigh-lead-recovery-social.png",
        width: 1200,
        height: 630,
        alt: "Raleigh Lead Recovery turns old leads into new business",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Turn Old Leads Into New Business | Raleigh Lead Recovery",
    description: "Put the leads you already paid for back to work with thoughtful, controlled follow-up.",
    images: ["/raleigh-lead-recovery-social.png"],
  },
};

const faqs = [
  {
    q: "What counts as an old lead?",
    a: "Web inquiries, estimate requests, canvassing leads, and past prospects your team could not reach or that never made a decision. We agree on the exact segment before anything begins.",
  },
  {
    q: "Does Raleigh Lead Recovery replace our CRM or sales team?",
    a: "No. Raleigh Lead Recovery works a controlled list and sends interested, qualified prospects and past customers back into the process your team already uses.",
  },
  {
    q: "Do we have to give you access to our whole CRM?",
    a: "No. Connect only the leads you want Raleigh Lead Recovery to work through a CSV, CRM view, or webhook. Your CRM can remain the source of truth.",
  },
  {
    q: "What if our team contacted a lead yesterday?",
    a: "That lead should not be called. Before connected automation goes live, we define the recent-activity window and the events that pause outreach. The integration rechecks for calls, emails, appointments, status changes, manual holds, and opt-outs before each dial.",
  },
  {
    q: "What happens when someone is interested?",
    a: "When calendar booking is connected, Raleigh Lead Recovery can offer approved open times, book the selected appointment, and send the customer an email confirmation. It can also text the right person on your team with the call summary and appointment details.",
  },
  {
    q: "How do you protect our list and our reputation?",
    a: "Every campaign starts with eligibility, suppression, calling-window, disclosure, and brand-rule checks. Opt-outs are recorded immediately, and you approve the conversation before launch.",
  },
];

export default function LandingPage() {
  return (
    <main className="landing-page recovery-page">
      <header className="site-header recovery-header">
        <nav className="page-shell nav-row" aria-label="Primary navigation">
          <BrandMark accent="#d8ff57" />
          <div className="nav-links">
            <a href="#how-it-works">How it works</a>
            <Link href="/login">Sign in</Link>
            <a className="button button-dark button-small" href="#listen-now-form" data-analytics-event="demo_call_cta_clicked" data-analytics-location="header">
              Try it now <ArrowRight aria-hidden="true" />
            </a>
          </div>
        </nav>
      </header>

      <section className="recovery-single-demo page-shell" id="listen-now-form">
        <div className="recovery-demo-copy">
          <p className="eyebrow"><span /> Live HVAC call</p>
          <h1>Hear a customer call—live.</h1>
          <p>Put yourself in the customer&apos;s shoes and call with a real HVAC problem. Raleigh Lead Recovery answers, follows the safety rules, and leaves the human team with a clear next step.</p>
          <ul className="recovery-demo-points" aria-label="What the demo shows">
            <li><span>01</span> Natural conversation</li>
            <li><span>02</span> Clear safety limits</li>
            <li><span>03</span> A handoff humans can use</li>
          </ul>
        </div>
        <aside className="recovery-demo-stage" aria-label="Live browser call demo">
          <div className="recovery-demo-stage-top"><span>One live customer call</span><strong>YOU PLAY THE CUSTOMER</strong></div>
          <div className="recovery-demo-route" aria-hidden="true">
            <article className="recovery-route-caller"><PhoneIncoming /><span>You answer</span><strong>“Yes, I still need help with it.”</strong></article>
            <div className="recovery-route-line"><i /><i /><i /></div>
            <article className="recovery-route-agent"><span className="recovery-route-live">Live</span><strong>Raleigh Lead Recovery</strong><p>Calls, listens, asks one question at a time, and stays inside your rules.</p></article>
            <div className="recovery-route-line"><i /><i /><i /></div>
            <article className="recovery-route-handoff"><ClipboardCheck /><span>Human handoff</span><strong>Need · urgency · address · callback</strong></article>
          </div>
          <div className="recovery-demo-action"><WebVoiceDemo /></div>
        </aside>
      </section>

      <section className="recovery-problem page-shell">
        <div className="recovery-section-heading">
          <p className="eyebrow">Work the demand you already earned</p>
          <h2>The lead may not be lost. The follow-up may have stopped.</h2>
          <p>
            Some prospects were not ready. Some got busy. Others never heard back at the right time. Raleigh Lead Recovery gives those earlier inquiries a useful reason to talk again.
          </p>
        </div>
        <div className="recovery-problem-cards">
          <article>
            <Database aria-hidden="true" />
            <p className="card-number">01</p>
            <h3>Already acquired</h3>
            <p>The contact is already in your database. There is no new cost per lead.</p>
          </article>
          <article>
            <PhoneCall aria-hidden="true" />
            <p className="card-number">02</p>
            <h3>Timing may have changed</h3>
            <p>A prospect who wasn&apos;t ready then may be ready to move forward now.</p>
          </article>
          <article>
            <Sparkles aria-hidden="true" />
            <p className="card-number">03</p>
            <h3>Worth another look</h3>
            <p>Raleigh Lead Recovery finds the live opportunities without asking reps to grind through the whole list.</p>
          </article>
        </div>
      </section>

      <section className="recovery-process page-shell" id="how-it-works">
        <div className="section-heading recovery-process-heading">
          <p className="eyebrow">How it works</p>
          <h2>From old lead to clear next step.</h2>
        </div>
        <ol className="process-list recovery-process-list">
          <li>
            <span>01</span>
            <div><h3>Connect only eligible leads.</h3><p>Choose who Raleigh Lead Recovery should follow up with and provide the context needed for a useful conversation.</p></div>
          </li>
          <li>
            <span>02</span>
            <div><h3>Continue the conversation.</h3><p>Raleigh Lead Recovery uses the service requested and approved notes, so the call does not start from scratch.</p></div>
          </li>
          <li>
            <span>03</span>
            <div><h3>Hand the live ones back.</h3><p>Interested prospects are booked, transferred, or routed to your team with a useful summary and clear next step.</p></div>
          </li>
        </ol>
      </section>

      <section className="recovery-dashboard page-shell" aria-labelledby="dashboard-heading">
        <div className="recovery-dashboard-heading">
          <div>
            <p className="eyebrow">Calls are only half the product.</p>
            <h2 id="dashboard-heading">See every call. Track every recovered opportunity.</h2>
          </div>
          <div>
            <p>The dashboard turns conversations into something your team can manage: outcomes, summaries, recordings, appointments, opt-outs, and estimated pipeline in one view.</p>
          </div>
        </div>

        <figure className="recovery-dashboard-window">
          <div className="recovery-dashboard-preview">
            <Image
              src="/lead-recovery-dashboard-preview.png"
              alt="Lead recovery dashboard showing leads loaded, call attempts, conversations, appointments booked, estimated pipeline, campaign funnel, and launch checks"
              width={1293}
              height={1028}
              sizes="(max-width: 1160px) calc(100vw - 40px), 1120px"
            />
          </div>
          <div className="recovery-dashboard-sync">
            <Database aria-hidden="true" />
            <div><strong>Your CRM can stay the system of record.</strong><span>Outcomes, notes, appointments, and opt-outs can flow back through an available API, webhook, Zapier or Make workflow, or an approved export.</span></div>
            <span className="recovery-dashboard-sync-badge">Two-way workflow</span>
          </div>
          <figcaption>Illustrative dashboard data. Actual campaign results vary by list quality, age, offer, and follow-up.</figcaption>
        </figure>
      </section>

      <section className="recovery-booking page-shell" aria-labelledby="booking-handoff">
        <div className="recovery-booking-heading">
          <p className="eyebrow">From conversation to calendar</p>
          <h2 id="booking-handoff">Finish the handoff before the call ends.</h2>
          <p>
            Connect an approved calendar and Raleigh Lead Recovery can check availability, book the selected time, email the customer an invitation, and text your team with the details.
          </p>
        </div>
        <div className="recovery-booking-grid">
          <article>
            <CalendarCheck aria-hidden="true" />
            <h3>Offer real availability.</h3>
            <p>Raleigh Lead Recovery offers only approved open times based on your hours, appointment length, notice, and buffer rules.</p>
          </article>
          <article>
            <MailCheck aria-hidden="true" />
            <h3>Book and confirm.</h3>
            <p>Once the customer chooses, Raleigh Lead Recovery books the appointment and sends the calendar invitation. It confirms only after the calendar accepts it.</p>
          </article>
          <article>
            <MessageSquareText aria-hidden="true" />
            <h3>Alert the right person.</h3>
            <p>Your team receives the scheduled time, contact details, call summary, and a link to the complete conversation in the dashboard.</p>
          </article>
        </div>
      </section>

      <section className="recovery-autopilot page-shell" aria-labelledby="autopilot-heading">
        <div className="recovery-autopilot-heading">
          <p className="eyebrow">Start simple. Automate when ready.</p>
          <h2 id="autopilot-heading">Call only the leads you approve.</h2>
          <p>
            Start with an approved CSV. Connect your CRM later if you want eligibility and recent activity checked automatically.
          </p>
        </div>
        <div className="recovery-autopilot-grid">
          <article>
            <TimerReset aria-hidden="true" />
            <span>01 · Eligibility</span>
            <h3>Your rules choose the lead.</h3>
            <p>Your rules can require a specific stage, source, and period with no activity before a lead enters the recovery queue.</p>
          </article>
          <article>
            <RefreshCw aria-hidden="true" />
            <span>02 · Safety check</span>
            <h3>Every lead is checked before calling.</h3>
            <p>Recent calls, emails, appointments, status changes, holds, and opt-outs automatically stop the call.</p>
          </article>
          <article>
            <ShieldCheck aria-hidden="true" />
            <span>03 · Sync</span>
            <h3>The outcome comes back.</h3>
            <p>Attempts, summaries, appointments, and opt-outs appear in the dashboard and can sync back to your CRM.</p>
          </article>
        </div>
        <p className="recovery-connection-note"><strong>Keep your CRM.</strong> Raleigh Lead Recovery can start with a CSV, then connect through an available API, webhook, Zapier, or Make workflow when you&apos;re ready.</p>
      </section>

      <section className="faq-section page-shell recovery-faq">
        <div className="section-heading compact-heading">
          <p className="eyebrow">Good questions</p>
          <h2>What happens after the demo.</h2>
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

      <section className="maker-section page-shell recovery-maker">
        <Image src="/danny.jpeg" alt="Danny Sullivan, founder of Raleigh Lead Recovery" width={80} height={80} />
        <div>
          <p className="eyebrow">A real person is behind this</p>
          <h2>Built and supported in Raleigh.</h2>
          <p>Set it up yourself, or bring me in to scope the list, shape the call rules, and review the first conversations before a campaign scales.</p>
        </div>
        <a className="text-link" href="#listen-now-form" data-analytics-event="demo_call_cta_clicked" data-analytics-location="founder">Try it now <ArrowRight aria-hidden="true" /></a>
      </section>

      <section className="final-cta recovery-final page-shell">
        <p className="eyebrow">Hear it for yourself</p>
        <h2>Hear how a customer call gets handled.</h2>
        <p>Play the customer in one live browser conversation. No phone number, sales call, or setup required.</p>
        <div className="hero-actions centered-actions">
          <a className="button button-dark" href="#listen-now-form" data-analytics-event="demo_call_cta_clicked" data-analytics-location="final_cta">Try it now <ArrowRight aria-hidden="true" /></a>
        </div>
      </section>

      <footer className="site-footer">
        <div className="page-shell footer-row">
          <div><BrandMark inverted /><p>© 2026 Raleigh Lead Recovery</p></div>
          <nav aria-label="Footer navigation"><Link href="/blog">Writing</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/login">Sign in</Link><a href={`mailto:${contactEmail}`}>{contactEmail}</a></nav>
        </div>
      </footer>
    </main>
  );
}
