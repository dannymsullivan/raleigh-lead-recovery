import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, Headphones, Phone, Play } from "lucide-react";
import { BrandMark } from "./components/brand-mark";
import { LeadStory } from "./components/lead-story";
import { contactEmail, contactHref } from "@/lib/contact";

const demoNumber = "+19842992155";
const demoNumberDisplay = "(984) 299-2155";
const demoCallUrl = process.env.NEXT_PUBLIC_DEMO_CALL_URL?.trim();

const faqs = [
  {
    q: "How fast does Mabel respond?",
    a: "Immediately. New leads get a useful first response at night, on weekends, and while your team is busy elsewhere.",
  },
  {
    q: "Can Mabel follow our rules?",
    a: "Yes. You set the service area, hours, emergencies, questions, and what she can promise a caller.",
  },
  {
    q: "What does my team receive?",
    a: "Your team gets the customer, job details, urgency, next step, summary, transcript, and recording in one place.",
  },
];

export default function LandingPage() {
  return (
    <main className="landing-page">
      <header className="site-header">
        <nav className="page-shell nav-row" aria-label="Primary navigation">
          <BrandMark />
          <div className="nav-links">
            <a href="#how-it-works">How it works</a>
            <Link href="/login">Sign in</Link>
            <Link className="button button-dark button-small" href="/signup">
              Start free <ArrowRight aria-hidden="true" />
            </Link>
          </div>
        </nav>
      </header>

      <section className="hero page-shell">
        <div className="hero-copy">
          <p className="eyebrow"><span /> Instant speed to lead, around the clock</p>
          <h1>Be first to every new lead.</h1>
          <p className="hero-intro">
            Mabel responds in seconds, qualifies the job, and moves the customer toward a booking—while competitors are still getting ready to follow up.
          </p>
          <div className="hero-actions">
            <Link className="button button-dark" href="/signup">
              Start 14 days free <ArrowRight aria-hidden="true" />
            </Link>
            <a className="text-link" href={`tel:${demoNumber}`}>
              <Phone aria-hidden="true" /> Call the live demo
            </a>
          </div>
          <p className="microcopy">Respond 24/7 · No card · Set up in one call</p>
        </div>

        <LeadStory />
      </section>

      <section className="audio-section page-shell" aria-labelledby="hear-mabel">
        <div className="audio-copy">
          <p className="eyebrow">The proof</p>
          <h2 id="hear-mabel">Hear how Mabel handles a real lead.</h2>
          <p>No polished voiceover. Listen to the pace, the follow-up questions, and the handoff your team receives.</p>
        </div>
        <div className="audio-player">
          <div className="audio-icon" aria-hidden="true"><Headphones /></div>
          <div className="audio-player-body">
            <div className="audio-meta">
              <div>
                <strong>{demoCallUrl ? "Real customer call" : "Live call demo"}</strong>
                <span>{demoCallUrl ? "Shared with permission" : demoNumberDisplay}</span>
              </div>
              {demoCallUrl ? <span className="audio-length">Actual recording</span> : null}
            </div>
            {demoCallUrl ? (
              <audio controls preload="metadata" src={demoCallUrl}>
                <a href={demoCallUrl}>Open the call recording</a>
              </audio>
            ) : (
              <a className="audio-call-link" href={`tel:${demoNumber}`}>
                <span className="play-dot"><Play aria-hidden="true" /></span>
                Call Mabel and try your own scenario
              </a>
            )}
          </div>
        </div>
      </section>

      <section className="quiet-strip" aria-label="Product benefits">
        <div className="page-shell benefits-row">
          {["Every lead gets an immediate response", "The right questions happen automatically", "Every opportunity lands in one clean view"].map((item) => (
            <p key={item}><Check aria-hidden="true" /> {item}</p>
          ))}
        </div>
      </section>

      <section className="process page-shell" id="how-it-works">
        <div className="section-heading">
          <p className="eyebrow">How it works</p>
          <h2>From new inquiry to clear next step.</h2>
        </div>
        <ol className="process-list">
          <li><span>01</span><div><h3>A new lead reaches out.</h3><p>Day, night, weekday, or weekend, Mabel responds while their intent is still high.</p></div></li>
          <li><span>02</span><div><h3>Mabel works the lead.</h3><p>She asks what they need, where the job is, how urgent it is, and what should happen next.</p></div></li>
          <li><span>03</span><div><h3>The lead moves forward.</h3><p>They get an estimate, next step, or appointment. Your team gets the complete context.</p></div></li>
        </ol>
      </section>

      <section className="outcome-section">
        <div className="page-shell outcome-grid">
          <div>
            <p className="eyebrow eyebrow-light">The difference</p>
            <h2>You already have the customer.<br />They still have a lead to call.</h2>
          </div>
          <p>
            The first useful response wins. Mabel answers when intent is highest, keeps the conversation moving, and gives competitors less time to enter it.
          </p>
        </div>
      </section>

      <section className="faq-section page-shell">
        <div className="section-heading compact-heading">
          <p className="eyebrow">Good questions</p>
          <h2>The short version.</h2>
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

      <section className="maker-section page-shell">
        <Image src="/danny.jpeg" alt="Danny Sullivan, Raleigh AI Guy" width={80} height={80} />
        <div>
          <p className="eyebrow">A real person is behind this</p>
          <h2>Built and supported in Raleigh.</h2>
          <p>I’ll connect your number, tune Mabel to your business, and make sure the first calls land correctly.</p>
        </div>
        <a className="text-link" href="https://raleighaiguy.com/" target="_blank" rel="noreferrer">Meet Raleigh AI Guy <ArrowRight aria-hidden="true" /></a>
      </section>

      <section className="final-cta page-shell">
        <p className="eyebrow">Fourteen days free · no card</p>
        <h2>Be first to the next lead.</h2>
        <p>Give every new opportunity an immediate, useful response.</p>
        <div className="hero-actions centered-actions">
          <Link className="button button-dark" href="/signup">Start free <ArrowRight aria-hidden="true" /></Link>
          <a className="text-link" href={`tel:${demoNumber}`}><Phone aria-hidden="true" /> {demoNumberDisplay}</a>
        </div>
      </section>

      <footer className="site-footer">
        <div className="page-shell footer-row">
          <div><BrandMark inverted /><p>© 2026 Raleigh Lead Recovery</p></div>
          <nav aria-label="Footer navigation"><Link href="/blog">Writing</Link><Link href="/login">Sign in</Link><a href={contactHref}>{contactEmail}</a></nav>
        </div>
      </footer>
    </main>
  );
}
