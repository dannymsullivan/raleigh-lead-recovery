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
  PhoneForwarded,
  ShieldCheck,
  Wrench,
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
  title: "Free Missed-Call Pilot for Raleigh HVAC Companies",
  description:
    "Let Raleigh Lead Recovery answer only the HVAC calls your team misses. Test one controlled evening free, keep your current number, and see every call outcome.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "The Call You Miss Shouldn’t Become Someone Else’s Job",
    description:
      "A Raleigh HVAC company can test missed-call coverage for one controlled evening at no cost.",
    url: "/",
    type: "website",
    images: [
      {
        url: "/raleigh-lead-recovery-social.png",
        width: 1200,
        height: 630,
        alt: "Raleigh Lead Recovery missed-call coverage for HVAC companies",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Call You Miss Shouldn’t Become Someone Else’s Job",
    description:
      "Test missed-call coverage for one controlled evening at no cost.",
    images: ["/raleigh-lead-recovery-social.png"],
  },
};

const faqs = [
  {
    q: "Do we have to replace our phone system?",
    a: "No. Your regular number and phone system stay in place. We use the provider’s no-answer, overflow, or conditional-forwarding setting so your team still gets the first chance to answer.",
  },
  {
    q: "What happens during the free test?",
    a: "We choose one controlled two-hour window, approve the greeting and call rules, and forward only calls nobody answers. You receive a summary after every handled call and can turn forwarding off immediately.",
  },
  {
    q: "What will the assistant say to callers?",
    a: "It uses the services, hours, service area, escalation rules, and callback expectations you approve. It will not invent pricing, arrival times, availability, or business policies.",
  },
  {
    q: "What if the caller hangs up instead of talking?",
    a: "They get an immediate text back — a short message from the coverage number letting them know you saw the call and giving them a way to reply. Replies are passed to your team alongside the call summaries, so a hang-up still becomes a reachable lead.",
  },
  {
    q: "Can it transfer an urgent call?",
    a: "Yes, when you approve a transfer path. Transfers go to a separate owner or dispatcher number, not back to the forwarded main line, so the call cannot get stuck in a forwarding loop.",
  },
  {
    q: "What happens after the first evening?",
    a: "If the test is useful, you can lock the $297/month founding rate for your first year, including 150 minutes of coverage, automatic text-back, and a monthly recovered-lead scorecard. As the service expands, pricing will increase for new partners—not for founding partners during their locked first year. If the test is not useful, you turn forwarding off and owe nothing for the evening test.",
  },
];

export default function HomePage() {
  return (
    <main className="landing-page receptionist-page">
      <PublicSiteNav
        items={[
          { href: "#how-it-works", label: "How it works" },
          { href: "#text-back-demo", label: "Text-back demo" },
          { href: "#what-we-measure", label: "What we measure" },
          { href: "#questions", label: "Questions" },
        ]}
        cta={{ href: bookingHref, label: "Book free test" }}
      />

      <section className="receptionist-hero page-shell">
        <div className="receptionist-hero-copy">
          <p className="eyebrow">
            <span /> Missed-call coverage for Raleigh HVAC companies
          </p>
          <h1>
            <span>Keep missed calls</span>
            <span>from becoming</span>
            <em>someone else&apos;s job.</em>
          </h1>
          <p className="receptionist-hero-intro">
            Test Raleigh Lead Recovery for one controlled evening. Your team
            answers as usual. Only calls nobody picks up roll over, and you see
            what happened right away. If the caller hangs up, an automatic text
            keeps the conversation alive.
          </p>
          <div className="receptionist-hero-actions" id="talk-now">
            <a
              className="button button-dark"
              href={bookingHref}
              target="_blank"
              rel="noreferrer"
            >
              Book the free evening <ArrowRight aria-hidden="true" />
            </a>
            <WebVoiceDemo
              mode="receptionist"
              label="Hear the assistant live"
            />
          </div>
          <p className="receptionist-microcopy">
            No setup fee · No new phone system · Turn it off anytime
          </p>
        </div>

        <div
          className="receptionist-call-visual"
          aria-label="Illustration of Raleigh Lead Recovery answering an unanswered HVAC call"
        >
          <div className="receptionist-call-visual-top">
            <span>
              <i /> Controlled evening test
            </span>
            <span>6:42 PM</span>
          </div>
          <div className="receptionist-signal-stage">
            <div className="receptionist-signal" aria-hidden="true">
              <span className="receptionist-signal-ring ring-one" />
              <span className="receptionist-signal-ring ring-two" />
              <span className="receptionist-signal-core">
                <Headphones />
              </span>
            </div>
            <div>
              <p>Your team gets the first four rings</p>
              <strong>Then the unanswered call rolls over</strong>
            </div>
          </div>
          <div className="receptionist-transcript">
            <div className="caller-line">
              <span>Caller</span>
              <p>Our AC stopped cooling and the house is getting hot.</p>
            </div>
            <div className="agent-line">
              <span>Raleigh Lead Recovery</span>
              <p>
                I can get the right details to the team. First, is anyone in
                immediate danger?
              </p>
            </div>
          </div>
          <div className="receptionist-captured">
            <p>Summary sent immediately</p>
            <div>
              <span>No cooling</span>
              <span>Urgent</span>
              <span>Callback requested</span>
            </div>
          </div>
        </div>
      </section>

      <section
        className="receptionist-proof-strip"
        aria-label="Pilot safeguards"
      >
        <div className="page-shell">
          <span>
            <Headphones aria-hidden="true" /> Your team answers first
          </span>
          <span>
            <PhoneForwarded aria-hidden="true" /> Keep your current number
          </span>
          <span>
            <MessageSquareText aria-hidden="true" /> Auto text-back included
          </span>
          <span>
            <ShieldCheck aria-hidden="true" /> Turn it off anytime
          </span>
        </div>
      </section>

      <section className="receptionist-text-back" id="text-back-demo">
        <div className="page-shell receptionist-text-back-grid">
          <div className="receptionist-text-back-copy">
            <p className="eyebrow">Included in every plan</p>
            <h2>The call can end. The lead doesn&apos;t have to.</h2>
            <p>
              Some homeowners will hang up before they leave a voicemail or
              talk to an assistant. Automatic text-back reaches them while the
              need is still fresh, collects the reply, and sends the
              conversation to your team.
            </p>
            <ul>
              <li><Check aria-hidden="true" /> Sends within moments of a missed call</li>
              <li><Check aria-hidden="true" /> Uses wording approved by your business</li>
              <li><Check aria-hidden="true" /> Routes replies and call context to your team</li>
            </ul>
            <p className="receptionist-text-back-included">
              <MessageSquareText aria-hidden="true" /> Automatic text-back is included in the $297/month plan.
            </p>
          </div>
          <AutoTextBackDemo />
        </div>
      </section>

      <section className="receptionist-problem page-shell">
        <div className="receptionist-section-heading">
          <p className="eyebrow">The call does not wait</p>
          <h2>A missed call looks harmless until the customer hires the company that answered.</h2>
          <p>
            You do not need another phone system or a long contract to find out
            whether better coverage matters. Start with the calls your team
            cannot reach during one ordinary evening.
          </p>
        </div>
        <div className="receptionist-scenarios">
          <article>
            <Wrench aria-hidden="true" />
            <span>01</span>
            <h3>You&apos;re finishing a job.</h3>
            <p>
              Your crew keeps working while the unanswered caller still gets a
              useful response.
            </p>
          </article>
          <article>
            <Moon aria-hidden="true" />
            <span>02</span>
            <h3>The office is closed.</h3>
            <p>
              The caller explains the problem, and urgent requests are flagged
              for the right person.
            </p>
          </article>
          <article>
            <BellRing aria-hidden="true" />
            <span>03</span>
            <h3>Everyone is already on the phone.</h3>
            <p>
              Overflow gets answered instead of becoming another voicemail to
              chase later.
            </p>
          </article>
        </div>
      </section>

      <section
        className="receptionist-process page-shell"
        id="how-it-works"
      >
        <div className="receptionist-process-heading">
          <p className="eyebrow">A controlled test</p>
          <h2>
            <span>Pick a night.</span>
            <span>Forward missed calls.</span>
            <span>See what happens.</span>
          </h2>
          <p>
            Nothing changes for the people who already answer your phones. The
            assistant handles only the calls they miss.
          </p>
        </div>
        <ol>
          <li>
            <span>01</span>
            <div>
              <h3>Choose one two-hour evening.</h3>
              <p>
                We approve the greeting, services, questions, urgency rules,
                and callback expectations before anything goes live.
              </p>
            </div>
          </li>
          <li>
            <span>02</span>
            <div>
              <h3>Forward only unanswered calls.</h3>
              <p>
                On a short screen share, we set your existing provider to
                forward after about four rings. Your regular number still works
                normally.
              </p>
            </div>
          </li>
          <li>
            <span>03</span>
            <div>
              <h3>Work as usual.</h3>
              <p>
                Your team keeps answering. Raleigh Lead Recovery covers only
                the calls nobody reaches and sends the owner or dispatcher a
                summary. Callers who hang up instead of talking get an instant
                text back, so the lead still has a way in.
              </p>
            </div>
          </li>
          <li>
            <span>04</span>
            <div>
              <h3>Review every outcome.</h3>
              <p>
                At the end of the test, you decide whether the calls justify a
                weekend or a measured 30-day pilot.
              </p>
            </div>
          </li>
        </ol>
      </section>

      <section className="receptionist-human page-shell">
        <div className="receptionist-section-heading">
          <p className="eyebrow">Evidence before a subscription</p>
          <h2>Judge it by recovered calls, not a promise that the AI “worked.”</h2>
          <p>
            Every handled call should produce something your team can verify:
            who called, what they needed, whether the opportunity was
            qualified, and what should happen next.
          </p>
        </div>
      </section>

      <section className="receptionist-two-jobs" id="what-we-measure">
        <div className="page-shell receptionist-two-jobs-grid">
          <div className="receptionist-two-jobs-copy">
            <p className="eyebrow">The 30-day scorecard</p>
            <h2>One system. Four numbers that matter.</h2>
            <p>
              If the first evening earns a longer pilot, we track the outcomes
              that can become a real case study—not vanity metrics.
            </p>
          </div>
          <div className="receptionist-job-cards">
            <article className="active">
              <div>
                <Headphones aria-hidden="true" />
                <span>Calls</span>
              </div>
              <h3>Demand recovered</h3>
              <p>
                Missed calls answered and qualified service opportunities
                captured while your team was unavailable.
              </p>
              <a href="#pilot-plan">
                See the pilot plan <ArrowRight aria-hidden="true" />
              </a>
            </article>
            <article>
              <div>
                <MessageSquareText aria-hidden="true" />
                <span>Outcomes</span>
              </div>
              <h3>Revenue evidence</h3>
              <p>
                Appointment requests and estimated recovered revenue based on
                outcomes your team confirms.
              </p>
              <a href={bookingHref} target="_blank" rel="noreferrer">
                Book the free test <ArrowRight aria-hidden="true" />
              </a>
            </article>
          </div>
        </div>
      </section>

      <section
        className="receptionist-pricing page-shell"
        id="pilot-plan"
      >
        <div className="receptionist-section-heading">
          <p className="eyebrow">Founding partner pricing</p>
          <h2>Prove it free. Start at $297 a month.</h2>
          <p>
            Start with the free two-hour evening test. Continue only if the
            coverage proves useful. Founding partners lock the starting rate
            for 12 months as pricing increases for new partners.
          </p>
        </div>
        <div className="receptionist-pricing-grid two-up">
          <article>
            <p className="eyebrow">Step one</p>
            <h3>Two-hour evening test</h3>
            <strong>
              <span>$0</span>
            </strong>
            <ul>
              {[
                "No setup fee",
                "Your team answers first",
                "Only missed calls roll over",
                "Hang-ups get an instant text back",
                "Immediate summary after each call",
              ].map((item) => (
                <li key={item}>
                  <Check aria-hidden="true" /> {item}
                </li>
              ))}
            </ul>
            <a
              className="button button-dark"
              href={bookingHref}
              target="_blank"
              rel="noreferrer"
            >
              Book the free test <ArrowRight aria-hidden="true" />
            </a>
          </article>
          <article className="featured">
            <p className="eyebrow">Founding Raleigh HVAC Partner</p>
            <h3>Missed-call recovery plan</h3>
            <strong>
              <span>$297</span>/month · starting rate
            </strong>
            <ul>
              {[
                "Up to 150 minutes of missed-call and after-hours coverage",
                "Automatic text-back after every missed call",
                "Immediate call summaries and urgency alerts",
                "Approved call transfers",
                "One HVAC call flow customized to your business",
                "Monthly recovered-lead scorecard",
                "Your $297 founding rate locked for 12 months",
              ].map((item) => (
                <li key={item}>
                  <Check aria-hidden="true" /> {item}
                </li>
              ))}
            </ul>
            <a
              className="button button-light"
              href={bookingHref}
              target="_blank"
              rel="noreferrer"
            >
              Start with the free evening <ArrowRight aria-hidden="true" />
            </a>
            <p className="receptionist-pricing-note">
              Additional voice usage is $0.30 per minute. No setup fee. Cancel
              anytime. Pricing will increase for future new partners.
            </p>
          </article>
        </div>
      </section>

      <section className="receptionist-guardrails page-shell">
        <div>
          <p className="eyebrow">Simple to start. Simple to stop.</p>
          <h2>Your phones stay yours.</h2>
        </div>
        <div className="receptionist-guardrail-list">
          <article>
            <PhoneForwarded aria-hidden="true" />
            <div>
              <h3>No phone-system replacement</h3>
              <p>
                Keep your number, provider, phones, and normal call flow. We
                change only what happens after nobody answers.
              </p>
            </div>
          </article>
          <article>
            <ShieldCheck aria-hidden="true" />
            <div>
              <h3>No forwarding loops</h3>
              <p>
                Approved transfers go to a separate owner or dispatcher number,
                never back to the forwarded main line.
              </p>
            </div>
          </article>
          <article>
            <Clock3 aria-hidden="true" />
            <div>
              <h3>No invented promises</h3>
              <p>
                The assistant follows your rules and captures requests without
                making up pricing, availability, or arrival times.
              </p>
            </div>
          </article>
        </div>
      </section>

      <section
        className="faq-section page-shell receptionist-faq"
        id="questions"
      >
        <div className="section-heading compact-heading">
          <p className="eyebrow">Good questions</p>
          <h2>What to expect.</h2>
        </div>
        <div className="faq-list">
          {faqs.map((faq) => (
            <details key={faq.q}>
              <summary>
                {faq.q}
                <span>+</span>
              </summary>
              <p>{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="maker-section page-shell receptionist-maker">
        <Image
          src="/danny.jpeg"
          alt="Danny Sullivan, founder of Raleigh Lead Recovery"
          width={80}
          height={80}
        />
        <div>
          <p className="eyebrow">Founder-led setup and support</p>
          <h2>You work directly with me.</h2>
          <p>
            I&apos;m Danny Sullivan, a Raleigh-based AI product engineer and
            former service-business owner. I&apos;ll help set up the forwarding,
            approve the call flow, and review the results with you.
          </p>
        </div>
        <a className="text-link" href={`mailto:${contactEmail}`}>
          Email Danny <ArrowRight aria-hidden="true" />
        </a>
      </section>

      <section className="receptionist-final page-shell">
        <p className="eyebrow">One Raleigh HVAC pilot opening</p>
        <h2>Put one evening on the calendar.</h2>
        <p>
          Your normal number keeps working. Your team keeps answering. We cover
          only the calls nobody reaches and show you every result.
        </p>
        <a
          className="button button-dark"
          href={bookingHref}
          target="_blank"
          rel="noreferrer"
        >
          Book the free evening test <ArrowRight aria-hidden="true" />
        </a>
      </section>

      <footer className="site-footer">
        <div className="page-shell footer-row">
          <div>
            <BrandMark inverted accent="#d8ff57" />
            <p>© 2026 Raleigh Lead Recovery</p>
          </div>
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
