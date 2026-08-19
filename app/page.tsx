import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck,
  Check,
  Database,
  MailCheck,
  MessageSquareText,
  PhoneCall,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TimerReset,
} from "lucide-react";
import { BrandMark } from "./components/brand-mark";
import { DemoCallForm } from "./components/demo-call-form";
import { contactEmail } from "@/lib/contact";

const pilotHref =
  process.env.NEXT_PUBLIC_PILOT_BOOKING_URL?.trim() ||
  "https://calendly.com/hello-raleighaiguy/lead-recovery-fit-call";

const integrationTools = [
  { name: "ServiceTitan", mark: "ST" },
  { name: "Housecall Pro", mark: "HCP" },
  { name: "Jobber", mark: "J" },
  { name: "HighLevel", mark: "HL" },
  { name: "HubSpot", mark: "HS" },
  { name: "Salesforce", mark: "SF" },
  { name: "QuickBooks", mark: "QB" },
  { name: "Google Sheets", mark: "GS" },
  { name: "Zapier", mark: "Z" },
  { name: "Make", mark: "M" },
];

const faqs = [
  {
    q: "What counts as an old lead?",
    a: "Web inquiries, estimate requests, canvassing leads, and past prospects your team could not reach or that never made a decision. We agree on the exact segment before anything begins.",
  },
  {
    q: "Does Mabel replace our CRM or sales team?",
    a: "No. Mabel works a controlled list and sends interested, qualified prospects and past customers back into the process your team already uses.",
  },
  {
    q: "Do we have to give you access to our whole CRM?",
    a: "No. The pilot can start with a CSV containing only 25 approved leads and the context Mabel needs. If the test works, an ongoing program can use a scoped CRM view or webhook instead of broad account access.",
  },
  {
    q: "What if our team contacted a lead yesterday?",
    a: "That lead should not be called. Before connected automation goes live, we define the recent-activity window and the events that pause outreach. The integration rechecks for calls, emails, appointments, status changes, manual holds, and opt-outs before each dial.",
  },
  {
    q: "Can Mabel remind past customers about recurring service?",
    a: "Yes. Once the recovery workflow is working, the same eligibility and no-double-call controls can support timely reminders such as annual HVAC tune-ups. We define the due date, exclusions, approved message, and handoff before it runs.",
  },
  {
    q: "Does Mabel know what each lead originally asked about?",
    a: "Yes. You choose the approved context Mabel receives, such as the service requested, when the inquiry came in, and useful prior notes. She uses it to pick up naturally, avoid repeating questions you already answered, and ask relevant follow-ups without exposing internal notes or sensitive information.",
  },
  {
    q: "What happens when someone is interested?",
    a: "When calendar booking is connected, Mabel can offer approved open times, book the selected appointment, and send the customer an email confirmation. She can also text the right person on your team with the call summary and appointment details.",
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
            <Link href="/login">Sign in</Link>
            <a className="button button-dark button-small" href="#try-mabel-form" data-analytics-event="demo_call_cta_clicked" data-analytics-location="header">
              Try Mabel <ArrowRight aria-hidden="true" />
            </a>
          </div>
        </nav>
      </header>

      <DemoCallForm bookingUrl={pilotHref} />

      <section className="recovery-proof-strip" aria-label="Pilot benefits">
        <div className="page-shell recovery-proof-grid">
          <div><strong>25</strong><span>eligible old leads in one controlled test</span></div>
          <div><strong>14 days</strong><span>to run and review the test</span></div>
          <div><strong>$0 setup</strong><span>with no CRM replacement required</span></div>
        </div>
      </section>

      <section className="recovery-problem page-shell">
        <div className="recovery-section-heading">
          <p className="eyebrow">The overlooked pipeline</p>
          <h2>Your next customer may already be sitting in your CRM.</h2>
          <p>
            Most growing businesses keep buying new leads while hundreds of earlier inquiries quietly age out. Some prospects reached out before they were ready. Some paused to compare options. Mabel gives them a helpful way to reconnect when the timing is better.
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
            <p>Mabel finds the live opportunities without asking reps to grind through the whole list.</p>
          </article>
        </div>
      </section>

      <section className="recovery-process page-shell" id="how-it-works">
        <div className="section-heading recovery-process-heading">
          <p className="eyebrow">How it works</p>
          <h2>Old leads in.<br />New business out.</h2>
        </div>
        <ol className="process-list recovery-process-list">
          <li>
            <span>01</span>
            <div><h3>Choose the right segment.</h3><p>We start with 25 eligible leads from an agreed source and time period—not your entire database.</p></div>
          </li>
          <li>
            <span>02</span>
            <div><h3>Mabel picks up where they left off.</h3><p>Give her the approved context from each lead—the service requested, when they reached out, and useful prior notes—and she can ask specific questions instead of starting from scratch.</p></div>
          </li>
          <li>
            <span>03</span>
            <div><h3>Your team gets the live ones.</h3><p>Interested prospects are booked, transferred, or routed to a rep with the context needed to take over.</p></div>
          </li>
          <li>
            <span>04</span>
            <div><h3>You see what was recovered.</h3><p>The report shows attempts, conversations, qualified opportunities, appointments, and customer-confirmed pipeline.</p></div>
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
              src="/mabel-dashboard-preview.png"
              alt="Mabel lead recovery dashboard showing leads loaded, call attempts, conversations, appointments booked, estimated pipeline, campaign funnel, and launch checks"
              width={1293}
              height={1028}
              sizes="(max-width: 1160px) calc(100vw - 40px), 1120px"
            />
          </div>
          <div className="recovery-dashboard-sync">
            <Database aria-hidden="true" />
            <div><strong>Your CRM can stay the system of record.</strong><span>Mabel&apos;s outcomes, notes, appointments, and opt-outs can flow back through an available API, webhook, Zapier or Make workflow, or an approved export.</span></div>
            <span className="recovery-dashboard-sync-badge">Two-way workflow</span>
          </div>
          <figcaption>Illustrative dashboard data. Actual campaign results vary by list quality, age, offer, and follow-up.</figcaption>
        </figure>
      </section>

      <section className="recovery-booking page-shell" aria-labelledby="booking-handoff">
        <div className="recovery-booking-heading">
          <p className="eyebrow">From conversation to calendar</p>
          <h2 id="booking-handoff">Mabel can finish the handoff while they&apos;re still on the phone.</h2>
          <p>
            When we connect the business&apos;s calendar and confirmation workflow, Mabel can check approved availability, book the selected time, email the customer a calendar invitation, and text your team with the details.
          </p>
        </div>
        <div className="recovery-booking-grid">
          <article>
            <CalendarCheck aria-hidden="true" />
            <h3>Offer real availability.</h3>
            <p>Mabel offers only approved open times based on the business&apos;s hours, appointment length, notice, and buffer rules.</p>
          </article>
          <article>
            <MailCheck aria-hidden="true" />
            <h3>Book and confirm.</h3>
            <p>Once the customer chooses, Mabel books the appointment and sends the calendar invitation. She confirms it only after the calendar accepts it.</p>
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
          <h2 id="autopilot-heading">Let the CRM decide when Mabel calls.</h2>
          <p>
            The pilot needs only one approved CSV—not access to your whole system. If it earns the right to continue, we connect a limited CRM view or webhook and agree on exactly when an inactive lead becomes eligible.
          </p>
        </div>
        <div className="recovery-autopilot-grid">
          <article>
            <TimerReset aria-hidden="true" />
            <span>01</span>
            <h3>A lead becomes eligible.</h3>
            <p>Your rules can require a specific stage, source, and period with no activity before a lead enters Mabel&apos;s queue.</p>
          </article>
          <article>
            <RefreshCw aria-hidden="true" />
            <span>02</span>
            <h3>Activity is checked again.</h3>
            <p>Before dialing, recent calls, emails, appointments, status changes, manual holds, and opt-outs cause the call to be skipped.</p>
          </article>
          <article>
            <ShieldCheck aria-hidden="true" />
            <span>03</span>
            <h3>Every outcome comes back.</h3>
            <p>Attempts, summaries, dispositions, appointments, and opt-outs appear in the dashboard and can sync back to the CRM.</p>
          </article>
        </div>
        <p className="recovery-autopilot-note"><strong>Pilot:</strong> 25 approved rows in a CSV. <strong>Ongoing:</strong> a scoped integration with your inactivity and no-double-call rules.</p>
        <div className="recovery-integrations" id="crm-connections" aria-labelledby="integration-heading">
          <div className="recovery-integrations-heading">
            <div>
              <p className="eyebrow">Your stack stays in place.</p>
              <h3 id="integration-heading">Built to work with the tools growing businesses already use.</h3>
            </div>
            <p>We connect through an available API, webhook, Zapier or Make workflow, or an approved export—depending on the platform and the customer&apos;s permissions.</p>
          </div>
          <ul className="integration-logo-grid" aria-label="Compatible CRM and automation platforms">
            {integrationTools.map((tool) => (
              <li key={tool.name}>
                <span aria-hidden="true">{tool.mark}</span>
                <strong>{tool.name}</strong>
              </li>
            ))}
          </ul>
          <div className="integration-connection" aria-label="Connection methods feeding Mabel">
            <span>Native API where available</span>
            <span>Webhooks</span>
            <span>Zapier / Make</span>
            <span>Scoped CSV</span>
            <strong>Mabel</strong>
          </div>
        </div>
      </section>

      <section className="recovery-use-cases page-shell" aria-labelledby="use-cases-heading">
        <div className="recovery-use-cases-heading">
          <p className="eyebrow">A good fit wherever follow-up creates revenue.</p>
          <h2 id="use-cases-heading">Different industries. The same expensive problem.</h2>
          <p>Mabel is most useful when inquiries arrive with intent, the decision takes time, and a helpful follow-up can restart the conversation.</p>
        </div>
        <div className="recovery-use-cases-grid">
          <article><span>01</span><h3>Home services</h3><p>Revisit estimates, unsold replacements, missed inquiries, and recurring maintenance such as annual HVAC tune-ups.</p></article>
          <article><span>02</span><h3>Limo &amp; transportation</h3><p>Follow up on wedding, airport, corporate, and event quotes after dates, passenger counts, or plans become clearer.</p></article>
          <article><span>03</span><h3>Real estate</h3><p>Reconnect with older buyer, seller, open-house, and valuation leads when their timing or motivation changes.</p></article>
          <article><span>04</span><h3>Real estate investing</h3><p>Re-engage property owners and seller leads, confirm current interest, and route motivated conversations to the acquisition team.</p></article>
        </div>
      </section>

      <section className="recovery-pilot" id="pilot">
        <div className="page-shell recovery-pilot-grid">
          <div className="recovery-pilot-copy">
            <p className="eyebrow eyebrow-light">The recovery pilot</p>
            <h2>Find fresh opportunity in leads you already paid for.</h2>
            <p>
              No platform migration. No long contract. We define a small eligible list, agree on what counts as qualified, and show you the complete outcome.
            </p>
            <a className="button button-accent" href="#try-mabel-form" data-analytics-event="demo_call_cta_clicked" data-analytics-location="pilot">
              Try Mabel on my phone <ArrowRight aria-hidden="true" />
            </a>
          </div>
          <div className="recovery-pilot-card">
            <div className="pilot-card-top">
              <span>Controlled campaign</span>
              <span className="pilot-status"><i /> Pilot ready</span>
            </div>
            <ul>
              <li><Check aria-hidden="true" /><span><strong>25 eligible old leads</strong> from one agreed segment</span></li>
              <li><Check aria-hidden="true" /><span><strong>14-day test</strong> with no setup fee</span></li>
              <li><Check aria-hidden="true" /><span><strong>Customer-approved conversation</strong> and handoff rules</span></li>
              <li><Check aria-hidden="true" /><span><strong>Calendar and notifications</strong> configured around your workflow</span></li>
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
        <a className="text-link" href="#try-mabel-form" data-analytics-event="demo_call_cta_clicked" data-analytics-location="founder">Try Mabel on your phone <ArrowRight aria-hidden="true" /></a>
      </section>

      <section className="final-cta recovery-final page-shell">
        <p className="eyebrow">Hear it for yourself</p>
        <h2>Try Mabel before you share a single lead.</h2>
        <p>Experience the call on your own phone, then decide whether it belongs in your follow-up process.</p>
        <div className="hero-actions centered-actions">
          <a className="button button-dark" href="#try-mabel-form" data-analytics-event="demo_call_cta_clicked" data-analytics-location="final_cta">Try Mabel on my phone <ArrowRight aria-hidden="true" /></a>
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
