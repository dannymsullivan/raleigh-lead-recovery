import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Headphones,
  MessageSquareText,
  PhoneCall,
  PhoneForwarded,
  ShieldCheck,
} from "lucide-react";
import { BrandMark } from "./components/brand-mark";
import { PublicSiteNav } from "./components/public-site-nav";
import { WebVoiceDemo } from "./components/web-voice-demo";
import { contactEmail } from "@/lib/contact";
import styles from "./home-pilot.module.css";

const bookingHref =
  process.env.NEXT_PUBLIC_PILOT_BOOKING_URL?.trim() ||
  "https://calendly.com/hello-raleighaiguy/raleigh-lead-recovery-pilot-setup";

export const metadata: Metadata = {
  title: "Free Missed-Call Pilot for Raleigh HVAC Companies",
  description:
    "Let Raleigh Lead Recovery answer only the HVAC calls your team misses. Test one controlled evening free, keep your current number, and see every call outcome.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Your Next Missed Call Does Not Have to Become Someone Else’s Job",
    description:
      "One Raleigh HVAC company can test missed-call coverage for a controlled evening at no cost.",
    url: "/",
    type: "website",
    images: ["/raleigh-lead-recovery-social.png"],
  },
};

const assurances = [
  {
    icon: Headphones,
    title: "Your team answers first",
    body: "Calls roll over only after nobody picks up.",
  },
  {
    icon: PhoneCall,
    title: "Keep your current number",
    body: "No phone-system replacement or number change.",
  },
  {
    icon: MessageSquareText,
    title: "See every handled call",
    body: "Get an immediate summary of what the caller needed.",
  },
  {
    icon: ShieldCheck,
    title: "Turn it off at any time",
    body: "The test ends when you say it ends.",
  },
];

const setupSteps = [
  {
    number: "01",
    title: "Choose one evening",
    body: "We pick a controlled two-hour window and approve the greeting, questions, and escalation rules before anything goes live.",
  },
  {
    number: "02",
    title: "Forward only unanswered calls",
    body: "On a short screen share, we set your existing phone system to forward after about four rings. Your regular number still works normally.",
  },
  {
    number: "03",
    title: "Work as usual",
    body: "Your employees keep answering calls. Raleigh Lead Recovery handles only the calls nobody reaches and sends the owner or dispatcher a summary.",
  },
  {
    number: "04",
    title: "Review every outcome",
    body: "At the end of the window, forwarding comes off unless you want to continue. We review the calls and decide whether the test earned another night.",
  },
];

const scorecard = [
  {
    number: "01",
    title: "Calls recovered",
    body: "Unanswered and after-hours calls that reached the assistant instead of voicemail.",
  },
  {
    number: "02",
    title: "Qualified opportunities",
    body: "Callers with a real service need, valid contact details, and a location in your service area.",
  },
  {
    number: "03",
    title: "Appointments requested",
    body: "Callers ready for a visit or callback, with their preferred timing captured for your team.",
  },
  {
    number: "04",
    title: "Estimated revenue recovered",
    body: "Job value based on outcomes your team confirms, not an invented software estimate.",
  },
];

const faqs = [
  {
    question: "Do I have to replace my phone system?",
    answer:
      "No. Your main number and normal call flow stay in place. We use conditional, no-answer, or overflow forwarding—the name varies by provider—so only calls your team misses reach Raleigh Lead Recovery.",
  },
  {
    question: "What will a caller hear?",
    answer:
      "We approve the greeting and call flow with you first. The assistant can collect the caller’s name, number, service need, location, urgency, and preferred timing without diagnosing equipment or promising work your team has not approved.",
  },
  {
    question: "What if a call needs a person right away?",
    answer:
      "We follow the escalation rules you approve. Any live transfer goes to a separate owner or dispatcher number—not back to the forwarded main line, which prevents a forwarding loop.",
  },
  {
    question: "What happens after the evening test?",
    answer:
      "We turn off forwarding and review the calls together. If the test was useful, you can extend it through a weekend and then into a measured 30-day pilot. If it was not, you stop there.",
  },
  {
    question: "Is the first test really free?",
    answer:
      "Yes. There is no setup fee and no charge for the first controlled two-hour test. If the system proves useful and you choose ongoing coverage later, the current plan is $497 per month.",
  },
];

export default function HomePage() {
  return (
    <main className={`landing-page receptionist-page ${styles.page}`}>
      <div className={styles.availabilityBanner}>
        <span aria-hidden="true" />
        One Raleigh HVAC pilot opening · First evening free
      </div>

      <PublicSiteNav
        items={[
          { href: "#live-demo", label: "Live demo" },
          { href: "#how-it-works", label: "How it works" },
          { href: "#scorecard", label: "What we measure" },
        ]}
        cta={{ href: bookingHref, label: "Book free test" }}
      />

      <section className={`page-shell ${styles.hero}`}>
        <div className={styles.heroCopy}>
          <p className={styles.kicker}>For Raleigh-area HVAC companies</p>
          <h1>
            Your next missed call does not have to become <em>someone else&apos;s job.</em>
          </h1>
          <p className={styles.heroIntro}>
            Let Raleigh Lead Recovery cover one controlled evening. Your team answers as usual. Only the calls nobody picks up roll over to your AI call assistant, and you see what happened right away.
          </p>
          <div className={styles.heroActions}>
            <a className={styles.primaryButton} href={bookingHref} target="_blank" rel="noreferrer">
              Test one evening free <ArrowRight aria-hidden="true" />
            </a>
            <a className={styles.textLink} href="#live-demo">
              Hear the assistant live <span aria-hidden="true">↓</span>
            </a>
          </div>
          <ul className={styles.heroNotes} aria-label="Pilot commitments">
            <li><Check aria-hidden="true" /> No new phone system</li>
            <li><Check aria-hidden="true" /> No setup fee</li>
            <li><Check aria-hidden="true" /> No contract</li>
          </ul>
        </div>

        <div className={styles.routeCard} aria-label="Example of an unanswered HVAC call routed to Raleigh Lead Recovery">
          <div className={styles.routeTopline}>
            <span><i aria-hidden="true" /> Controlled test window</span>
            <strong>6:00–8:00 PM</strong>
          </div>

          <div className={styles.incomingCall}>
            <span className={styles.phoneIcon}><PhoneCall aria-hidden="true" /></span>
            <div>
              <small>Incoming customer call</small>
              <strong>Your regular business number</strong>
            </div>
            <em>Ringing</em>
          </div>

          <ol className={styles.routeSteps}>
            <li><span>1</span><p>Your team gets the first four rings</p></li>
            <li className={styles.activeRoute}><span>2</span><p>No answer? The call rolls over</p></li>
          </ol>

          <div className={styles.assistantCall}>
            <div className={styles.assistantHeading}>
              <div><small>Raleigh Lead Recovery</small><strong>Call answered</strong></div>
              <span><i aria-hidden="true" /> Live</span>
            </div>
            <blockquote>
              “I can help get the right person back to you. What&apos;s going on with your system?”
            </blockquote>
          </div>

          <div className={styles.ownerSummary}>
            <small>Example owner notification · 7:14 PM</small>
            <strong>No cooling · North Raleigh · Callback requested</strong>
            <p>Name, number, service need, location, urgency, and preferred timing captured.</p>
          </div>

          <span className={styles.voicemailStamp}>Voicemail avoided</span>
        </div>
      </section>

      <section className={styles.assuranceStrip} aria-label="Pilot safeguards">
        <div className="page-shell">
          {assurances.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title}>
                <Icon aria-hidden="true" />
                <div><h2>{item.title}</h2><p>{item.body}</p></div>
              </article>
            );
          })}
        </div>
      </section>

      <section className={`page-shell ${styles.problemSection}`}>
        <div>
          <p className={styles.sectionLabel}>The invisible leak</p>
          <h2>A missed call looks harmless until the caller hires the company that answered.</h2>
        </div>
        <div className={styles.missedLog} aria-label="Example missed-call log">
          <div className={styles.logHeading}><span>After-hours call log</span><span>What your phone shows</span></div>
          <div className={styles.logRow}><time>6:42 PM</time><strong>Missed call</strong><span>Unknown caller</span><em>Value unknown</em></div>
          <div className={styles.logRow}><time>7:14 PM</time><strong>Missed call</strong><span>Unknown caller</span><em>Value unknown</em></div>
          <div className={styles.logRow}><time>7:51 PM</time><strong>Voicemail</strong><span>No message</span><em>Value unknown</em></div>
          <p>Your phone records the interruption. It does not tell you whether the caller needed a tune-up, a repair, or a full replacement.</p>
        </div>
      </section>

      <section className={styles.demoSection} id="live-demo">
        <div className={`page-shell ${styles.demoGrid}`}>
          <div className={styles.demoCopy}>
            <p className={styles.sectionLabel}>Hear it before a customer does</p>
            <h2>Put the assistant through a real HVAC call right now.</h2>
            <p>Play the customer. Describe a no-cooling call, ask a hard question, or interrupt it. The conversation happens live in your browser.</p>
            <ul>
              <li><Check aria-hidden="true" /> No phone number required</li>
              <li><Check aria-hidden="true" /> Uses your microphone</li>
              <li><Check aria-hidden="true" /> End the conversation any time</li>
            </ul>
          </div>
          <div className={styles.demoConsole}>
            <div className={styles.demoConsoleTop}><span>Live HVAC scenario</span><strong>Inbound call coverage</strong></div>
            <div className={styles.demoPrompt}>
              <Headphones aria-hidden="true" />
              <div><small>You play the caller</small><strong>Press the button, then start talking.</strong></div>
            </div>
            <WebVoiceDemo mode="receptionist" label="Start the live HVAC call" />
          </div>
        </div>
      </section>

      <section className={`page-shell ${styles.processSection}`} id="how-it-works">
        <div className={styles.processHeading}>
          <p className={styles.sectionLabel}>One evening. Fully controlled.</p>
          <h2>Do not hand over your phones. Let us earn the next two hours.</h2>
          <p>The first test is deliberately small. Nothing changes for your employees or customers unless a call would otherwise go unanswered.</p>
        </div>
        <ol className={styles.processList}>
          {setupSteps.map((step) => (
            <li key={step.number}>
              <span>{step.number}</span>
              <div><h3>{step.title}</h3><p>{step.body}</p></div>
            </li>
          ))}
        </ol>
        <div className={styles.providerNote}>
          <PhoneForwarded aria-hidden="true" />
          <div>
            <strong>You do not have to find the forwarding setting alone.</strong>
            <p>Tell me which phone provider you use. I&apos;ll guide you through its overflow, call handling, or forward-when-unanswered setting on a short screen share.</p>
          </div>
        </div>
      </section>

      <section className={styles.scorecardSection} id="scorecard">
        <div className={`page-shell ${styles.scorecardGrid}`}>
          <div className={styles.scorecardCopy}>
            <p className={styles.sectionLabel}>The proof we build together</p>
            <h2>A revenue scorecard, not a vague promise that the AI “worked.”</h2>
            <p>Every result stays tied to an actual call and an outcome your team can verify.</p>
          </div>
          <div className={styles.scorecardBoard}>
            <div className={styles.boardHeader}>
              <div><small>Raleigh Lead Recovery</small><strong>Pilot scorecard</strong></div>
              <span>Measured with your team</span>
            </div>
            {scorecard.map((item) => (
              <article key={item.number}>
                <span>{item.number}</span>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
                <strong>Tracked</strong>
              </article>
            ))}
            <div className={styles.boardFooter}>
              <span>No sample success numbers.</span>
              <strong>Your calls create the first real case study.</strong>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.progressionSection}>
        <div className={`page-shell ${styles.progressionGrid}`}>
          <div>
            <p className={styles.sectionLabel}>The pilot earns its way forward</p>
            <h2>Start small. Continue only when the calls justify it.</h2>
          </div>
          <ol>
            <li><span>Tonight · 01</span><strong>Two-hour test</strong><em>Free</em></li>
            <li><span>Next · 02</span><strong>Weekend coverage</strong><em>If useful</em></li>
            <li><span>Then · 03</span><strong>30-day scorecard</strong><em>If proven</em></li>
            <li><span>Optional · 04</span><strong>Ongoing coverage</strong><em>$497/mo</em></li>
          </ol>
        </div>
      </section>

      <section className={`page-shell ${styles.founderSection}`}>
        <div className={styles.founderPhoto}>
          <Image src="/danny.jpeg" alt="Danny Sullivan, founder of Raleigh Lead Recovery" width={288} height={360} priority />
          <span>Raleigh-based</span>
        </div>
        <div className={styles.founderCopy}>
          <p className={styles.sectionLabel}>The person behind the pilot</p>
          <h2>You work directly with me, not a distant support queue.</h2>
          <p>I&apos;m Danny Sullivan, a Raleigh-based AI product engineer, educator, and former service-business owner. I&apos;ll configure the test with you, review the calls, and stay reachable while it is live.</p>
          <div className={styles.credentials}>
            <span>AI product engineer</span>
            <span>Former service-business owner</span>
            <span>Raleigh, North Carolina</span>
          </div>
          <a href={`mailto:${contactEmail}`}>Email Danny <ArrowRight aria-hidden="true" /></a>
        </div>
      </section>

      <section className={styles.faqSection}>
        <div className={`page-shell ${styles.faqGrid}`}>
          <div>
            <p className={styles.sectionLabel}>Before you forward anything</p>
            <h2>Reasonable questions from someone protecting the phone line.</h2>
          </div>
          <div className={styles.faqList}>
            {faqs.map((faq, index) => (
              <details key={faq.question} open={index === 0}>
                <summary>{faq.question}<span aria-hidden="true">+</span></summary>
                <p>{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.finalSection} id="pilot">
        <div className={`page-shell ${styles.finalGrid}`}>
          <div className={styles.finalCopy}>
            <p className={styles.sectionLabel}>One pilot opening</p>
            <h2>Put one evening on the calendar.</h2>
            <p>I&apos;m looking for one Raleigh-area HVAC company with real inbound call volume and an owner or dispatcher willing to test a simple overflow setup.</p>
            <ul>
              <li><Check aria-hidden="true" /> Phone-provider setup help</li>
              <li><Check aria-hidden="true" /> Company-approved greeting and call flow</li>
              <li><Check aria-hidden="true" /> Immediate summary after every handled call</li>
              <li><Check aria-hidden="true" /> End-of-test review and scorecard</li>
            </ul>
          </div>
          <div className={styles.offerCard}>
            <div className={styles.offerTop}><span>Controlled two-hour test</span><strong>$0</strong></div>
            <p>No setup fee · No contract · No obligation to continue</p>
            <a href={bookingHref} target="_blank" rel="noreferrer">Book the free evening test <ArrowRight aria-hidden="true" /></a>
            <span>Choose a short setup time. Nothing gets forwarded until you approve the plan.</span>
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="page-shell footer-row">
          <div><BrandMark inverted accent="#d8ff57" /><p>© 2026 Raleigh Lead Recovery</p></div>
          <nav aria-label="Footer navigation">
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
