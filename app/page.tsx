import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Database,
  Headphones,
  PhoneCall,
  Play,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { BrandMark } from "./components/brand-mark";
import { LeadStory } from "./components/lead-story";
import { contactEmail } from "@/lib/contact";

const pilotHref = `mailto:${contactEmail}?subject=${encodeURIComponent("Lead recovery pilot")}&body=${encodeURIComponent(
  "Hi Danny,\n\nI'd like to talk about reactivating old leads for our service business.\n\nCompany:\nApproximate number of old leads:\nCRM (if known):\n\nThanks,"
)}`;

const demoCallUrl = process.env.NEXT_PUBLIC_REACTIVATION_DEMO_AUDIO_URL?.trim();

const faqs = [
  {
    q: "What counts as an old lead?",
    a: "Web inquiries, estimate requests, canvassing leads, and past prospects your team could not reach or that never made a decision. We agree on the exact segment before anything begins.",
  },
  {
    q: "Does Mabel replace our CRM or sales team?",
    a: "No. Mabel works a controlled list and sends interested, qualified homeowners back into the process your team already uses.",
  },
  {
    q: "What happens when someone is interested?",
    a: "Mabel can book an approved inspection time, make a live handoff, or send the opportunity to the right rep with the call summary and context.",
  },
  {
    q: "How do you protect our list and our reputation?",
    a: "Every campaign starts with eligibility, suppression, calling-window, disclosure, and brand-rule checks. Opt-outs are recorded immediately, and you approve the conversation before launch.",
  },
  {
    q: "What will we see at the end of a pilot?",
    a: "A clear funnel from eligible records and call attempts through conversations, qualified opportunities, appointments, opt-outs, and customer-confirmed pipeline.",
  },
];

export default function LandingPage() {
  return (
    <main className="landing-page recovery-page">
      <header className="site-header recovery-header">
        <nav className="page-shell nav-row" aria-label="Primary navigation">
          <BrandMark />
          <div className="nav-links">
            <a href="#how-it-works">How it works</a>
            <a href="#pilot">The pilot</a>
            <Link href="/demo">Live demo</Link>
            <Link href="/login">Sign in</Link>
            <a className="button button-dark button-small" href={pilotHref}>
              Discuss a pilot <ArrowRight aria-hidden="true" />
            </a>
          </div>
        </nav>
      </header>

      <section className="recovery-hero page-shell">
        <div className="recovery-hero-copy">
          <p className="eyebrow"><span /> Lead recovery for Raleigh service businesses</p>
          <h1>We turn dead leads into <em>new business.</em></h1>
          <p className="hero-intro">
            You already paid to generate the leads. Mabel follows up with old and unresponsive homeowners, finds the ones who are still interested, and sends qualified opportunities back to your team.
          </p>
          <div className="hero-actions">
            <a className="button button-dark" href={pilotHref}>
              Discuss a recovery pilot <ArrowRight aria-hidden="true" />
            </a>
            <Link className="text-link" href="/demo">Explore the dashboard</Link>
          </div>
          <p className="microcopy">Start with 250–500 eligible old leads · No new ad spend · No CRM replacement</p>
        </div>

        <LeadStory />
      </section>

      <section className="audio-section page-shell" aria-labelledby="hear-mabel">
        <div className="audio-copy">
          <p className="eyebrow">Meet Mabel</p>
          <h2 id="hear-mabel">Hear an old lead become a live opportunity.</h2>
          <p>
            This short roofing scenario shows how Mabel reopens the conversation, confirms current interest, and gives the team a useful next step.
          </p>
        </div>
        <div className="audio-player">
          <div className="audio-icon" aria-hidden="true"><Headphones /></div>
          <div className="audio-player-body">
            <div className="audio-meta">
              <div>
                <strong>{demoCallUrl ? "Mabel roofing reactivation demo" : "Demo recording coming next"}</strong>
                <span>{demoCallUrl ? "Recorded with permission" : "Mabel is configured and ready in Vapi"}</span>
              </div>
              {demoCallUrl ? <span className="audio-length">Recorded demo</span> : null}
            </div>
            {demoCallUrl ? (
              <audio controls preload="metadata" src={demoCallUrl}>
                <a href={demoCallUrl}>Open the Mabel demo recording</a>
              </audio>
            ) : (
              <Link className="audio-call-link" href="/demo">
                <span className="play-dot"><Play aria-hidden="true" /></span>
                Preview what the customer receives
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="recovery-proof-strip" aria-label="Pilot benefits">
        <div className="page-shell recovery-proof-grid">
          <div><strong>250–500</strong><span>old leads in a controlled pilot</span></div>
          <div><strong>$0</strong><span>in additional lead-generation spend</span></div>
          <div><strong>One view</strong><span>from call attempt to qualified opportunity</span></div>
        </div>
      </section>

      <section className="recovery-problem page-shell">
        <div className="recovery-section-heading">
          <p className="eyebrow">The overlooked pipeline</p>
          <h2>Your next customer may already be sitting in your CRM.</h2>
          <p>
            Most roofing companies keep buying new leads while hundreds of old inquiries quietly age out. Some inquired at a bad time. Some never answered. Some were never followed up with enough. Mabel gives those leads another useful conversation.
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
            <h3>Never fully worked</h3>
            <p>Your team moved on, but the homeowner&apos;s project may not have.</p>
          </article>
          <article>
            <Sparkles aria-hidden="true" />
            <p className="card-number">03</p>
            <h3>Worth another look</h3>
            <p>Mabel finds the live opportunities without asking reps to grind through the whole list.</p>
          </article>
        </div>
      </section>

      <section className="recovery-process page-shell" id="how-it-works">
        <div className="section-heading recovery-process-heading">
          <p className="eyebrow">How it works</p>
          <h2>Old list in.<br />Real opportunities out.</h2>
        </div>
        <ol className="process-list recovery-process-list">
          <li>
            <span>01</span>
            <div><h3>Choose the right segment.</h3><p>We start with 250–500 eligible leads from an agreed source and time period—not your entire database.</p></div>
          </li>
          <li>
            <span>02</span>
            <div><h3>Mabel has the conversations.</h3><p>The AI calling agent follows your approved script, qualifies current interest, handles opt-outs, and records every outcome.</p></div>
          </li>
          <li>
            <span>03</span>
            <div><h3>Your team gets the live ones.</h3><p>Interested homeowners are booked, transferred, or routed to a rep with the context needed to take over.</p></div>
          </li>
          <li>
            <span>04</span>
            <div><h3>You see what was recovered.</h3><p>The report shows attempts, conversations, qualified opportunities, appointments, and customer-confirmed pipeline.</p></div>
          </li>
        </ol>
      </section>

      <section className="recovery-pilot" id="pilot">
        <div className="page-shell recovery-pilot-grid">
          <div className="recovery-pilot-copy">
            <p className="eyebrow eyebrow-light">The recovery pilot</p>
            <h2>Find fresh opportunity in leads you already paid for.</h2>
            <p>
              No platform migration. No long contract. We define a small eligible list, agree on what counts as qualified, and show you the complete outcome.
            </p>
            <a className="button button-accent" href={pilotHref}>
              Map out my pilot <ArrowRight aria-hidden="true" />
            </a>
          </div>
          <div className="recovery-pilot-card">
            <div className="pilot-card-top">
              <span>Controlled campaign</span>
              <span className="pilot-status"><i /> Pilot ready</span>
            </div>
            <ul>
              <li><Check aria-hidden="true" /><span><strong>250–500 eligible leads</strong> from one agreed segment</span></li>
              <li><Check aria-hidden="true" /><span><strong>Customer-approved conversation</strong> and handoff rules</span></li>
              <li><Check aria-hidden="true" /><span><strong>Recorded dispositions</strong> for every attempted lead</span></li>
              <li><Check aria-hidden="true" /><span><strong>Results report</strong> tied to actual outcomes</span></li>
            </ul>
            <div className="pilot-card-bottom"><ShieldCheck aria-hidden="true" /> Eligibility and suppression review before launch</div>
          </div>
        </div>
      </section>

      <section className="faq-section page-shell recovery-faq">
        <div className="section-heading compact-heading">
          <p className="eyebrow">Good questions</p>
          <h2>Before you hand over a list.</h2>
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
          <p>I&apos;ll scope the list with you, tune Mabel to your sales process, and review the calls before a campaign scales.</p>
        </div>
        <a className="text-link" href={pilotHref}>Talk with Danny <ArrowRight aria-hidden="true" /></a>
      </section>

      <section className="final-cta recovery-final page-shell">
        <p className="eyebrow">The leads are already there</p>
        <h2>Let&apos;s find out who&apos;s still interested.</h2>
        <p>Start with a controlled sample of leads already sitting in your CRM.</p>
        <div className="hero-actions centered-actions">
          <a className="button button-dark" href={pilotHref}>Discuss a recovery pilot <ArrowRight aria-hidden="true" /></a>
        </div>
      </section>

      <footer className="site-footer">
        <div className="page-shell footer-row">
          <div><BrandMark inverted /><p>© 2026 Raleigh Lead Recovery</p></div>
          <nav aria-label="Footer navigation"><Link href="/blog">Writing</Link><Link href="/login">Sign in</Link><a href={`mailto:${contactEmail}`}>{contactEmail}</a></nav>
        </div>
      </footer>
    </main>
  );
}
