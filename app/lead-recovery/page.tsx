import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Database,
  PhoneCall,
  Sparkles,
} from "lucide-react";
import { BrandMark } from "../components/brand-mark";
import { PublicSiteNav } from "../components/public-site-nav";
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
      <PublicSiteNav
        items={[
          { href: "/", label: "24/7 call coverage" },
          { href: "#how-it-works", label: "Lead recovery" },
          { href: "/login", label: "Sign in" },
        ]}
        cta={{ href: "#listen-now-form", label: "Try it now" }}
      />

      <section className="recovery-single-demo page-shell" id="listen-now-form">
        <div className="recovery-demo-copy">
          <p className="eyebrow"><span /> Live HVAC follow-up</p>
          <h1>Hear a real HVAC follow-up.</h1>
          <p>Play the customer. Raleigh Lead Recovery calls about a tune-up, handles the conversation, and gives the human team a clear next step.</p>
          <div className="recovery-hero-demo"><WebVoiceDemo mode="reactivation" /></div>
        </div>
        <div className="receptionist-call-visual recovery-call-visual" aria-label="Illustration of an HVAC tune-up follow-up call">
          <div className="receptionist-call-visual-top">
            <span><i /> Live follow-up</span>
            <span>2:14 PM</span>
          </div>
          <div className="receptionist-signal-stage">
            <div className="receptionist-signal" aria-hidden="true">
              <span className="receptionist-signal-ring ring-one" />
              <span className="receptionist-signal-ring ring-two" />
              <span className="receptionist-signal-core"><PhoneCall /></span>
            </div>
            <div>
              <p>Raleigh Lead Recovery is calling</p>
              <strong>Seasonal HVAC tune-up</strong>
            </div>
          </div>
          <div className="receptionist-transcript">
            <div className="agent-line"><span>Raleigh Lead Recovery</span><p>Would you like the team to follow up about seasonal maintenance?</p></div>
            <div className="caller-line"><span>Customer</span><p>Yes, Tuesday morning would be best.</p></div>
          </div>
          <div className="receptionist-captured">
            <p>Sent back to the human team</p>
            <div><span>Interested</span><span>Tuesday morning</span><span>Callback requested</span></div>
          </div>
        </div>
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
