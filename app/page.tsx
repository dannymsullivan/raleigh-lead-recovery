import { PublicSiteFooter } from "@/app/components/public-site-footer";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Headphones,
  MessageSquareText,
  PhoneForwarded,
  ShieldCheck,
} from "lucide-react";
import { PublicSiteNav } from "./components/public-site-nav";
import { WebsiteChat } from "./components/website-chat";
import { SalesMotion } from "./components/sales-motion";
import { ChatPricing, ChatTrial, CustomerProblem, IndustryExamples, ProductOverview, TrialBanner } from "./components/chatbot-sales-sections";
import { contactEmail } from "@/lib/contact";

export const metadata: Metadata = {
  title: "Website Chatbots for Service Businesses | Snappy Leads",
  description:
    "Answer customer questions, collect contact details, and see which chats become booked jobs in your dashboard.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Old-school service. New-school tech.",
    description:
      "Website chat that answers customer questions and saves leads for your team to follow up.",
    url: "/",
    type: "website",
    images: [{
        url: "/opengraph-image",
      width: 1200,
      height: 630,
      alt: "Snappy Leads website chat",
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Old-school service. New-school tech.",
    description: "Website chat that answers questions and collects leads for service businesses.",
    images: ["/opengraph-image"],
  },
};

const faqs = [
  { q: "How does the two-week free trial work?", a: "We add your business information and install the chatbot on your website. Your 14 days start when it goes live. No card is required. Website chat starts at $399/month after the trial; we confirm your price with you before paid service starts." },
  { q: "Who handles the setup?", a: "You work directly with Danny. Share your services, service area, hours, and common questions; he prepares the answers, installs the chatbot, and checks that customer requests reach your dashboard." },
  { q: "What does the chatbot know?", a: "It uses the services, hours, and service area already saved in your business profile, plus the custom answers you publish. If it doesn’t have an answer, it tells the visitor to check with your business. Visitors can also leave their details for your team." },
  { q: "Can I see where a lead came from?", a: "Yes. You can see the page where a chat started and, when available, the website or campaign that brought the visitor there. Mark the leads you book and add the job value to compare results." },
  { q: "Does each customer have their own dashboard?", a: "Yes. Each business signs in to its own workspace to read conversations, update chatbot answers, and track leads." },
  { q: "Does it book appointments?", a: "The chatbot collects appointment requests. Your team confirms the time with the customer, then marks the lead as booked in the dashboard." },
  { q: "Do you also offer voice agents?", a: "Yes. Voice is a separate service for missed-call and after-hours coverage. Visit the Voice agents page to try the browser demo and learn how setup works." },
];

export default function HomePage() {
  return (
    <main className="landing-page rlr-home rlr-retro" id="sales-page">
      <SalesMotion />
      <TrialBanner />
      <PublicSiteNav
        cta={{ href: "#trial", label: "Try two weeks free" }}
      />

      <section className="rlr-hero">
        <div className="page-shell rlr-hero-grid">
          <div className="rlr-hero-copy">
            <p className="rlr-kicker"><span /> Website chat for service businesses</p>
            <h1><span>Old-school service.</span><em>New-school tech.</em></h1>
            <p className="rlr-hero-intro">
              Keep the personal touch your customers count on. We set up website chat
              that answers questions, collects contact details, and gives your team
              what they need to follow up while you’re busy serving customers.
            </p>
            <div className="rlr-hero-actions">
              <a className="rlr-button rlr-button-primary" href="#trial">
                Try two weeks free <ArrowRight aria-hidden="true" />
              </a>
              <a className="rlr-button rlr-button-secondary" href="#try-chat">Try the chatbot</a>
            </div>
            <div className="rlr-hero-assurances" aria-label="Chatbot features">
              <span><Check aria-hidden="true" /> Two-week free trial</span>
              <span><Check aria-hidden="true" /> Your own dashboard</span>
              <span><Check aria-hidden="true" /> See where leads come from</span>
            </div>
          </div>

          <div className="rlr-demo-card" id="try-chat">
            <div className="rlr-demo-topline">
              <div><span className="rlr-live-dot" /><span>Your website assistant</span></div>
              <span>Try it live ↙</span>
            </div>
            <WebsiteChat />
            <div className="rlr-demo-outcome" aria-label="Illustrative handoff example">
              <div><span>Example need</span><strong>AC not cooling</strong></div>
              <div><span>Service needed</span><strong>AC repair</strong></div>
              <div><span>Next step</span><strong>Team to follow up</strong></div>
            </div>
          </div>
        </div>
      </section>

      <section className="rlr-founder page-shell">
        <Image src="/danny.jpeg" alt="Danny Sullivan, founder of Snappy Leads" width={112} height={112} />
        <div>
          <p className="rlr-kicker">Founder-led setup</p>
          <h2>You work directly with me.</h2>
          <p>
            I&apos;m Danny Sullivan, an AI product engineer and former
            service-business owner. I set up chatbots and voice agents that answer customer questions, collect job details, and help your team follow up.
          </p>
        </div>
        <a className="rlr-inline-link" href={`mailto:${contactEmail}`}>Email Danny <ArrowRight aria-hidden="true" /></a>
      </section>

      <section className="rlr-trust-band" aria-label="How the service fits your business">
        <div className="page-shell">
          <span><Headphones aria-hidden="true" /> Questions answered anytime</span>
          <span><PhoneForwarded aria-hidden="true" /> Your services and answers</span>
          <span><MessageSquareText aria-hidden="true" /> See where leads come from</span>
          <span><ShieldCheck aria-hidden="true" /> Your own private dashboard</span>
        </div>
      </section>

      <CustomerProblem />
      <ProductOverview />

      <section className="rlr-flow page-shell" id="how-it-works">
        <div className="rlr-section-heading">
          <p className="rlr-kicker">How it works</p>
          <h2>We set it up. You review it. Then it goes live.</h2>
          <p>
            You don’t need to build a chatbot or learn a new tool to get started.
            We help you prepare the answers, add it to your site, and check that it works.
          </p>
        </div>
        <ol className="rlr-flow-steps">
          <li><span>01</span><div><h3>Tell us how your business works</h3><p>Share your services, prices, hours, and service area. We use that information to prepare your chatbot’s answers.</p></div></li>
          <li><span>02</span><div><h3>We build and test your chatbot</h3><p>We add your answers and install the chat widget. You try it, review the responses, and tell us what to change before launch.</p></div></li>
          <li><span>03</span><div><h3>Go live and review your leads</h3><p>Your trial starts when the chatbot is ready. See each conversation, contact request, and lead source in your dashboard, then record what happens next.</p></div></li>
        </ol>
      </section>

      <section className="rlr-outcomes" id="outcomes">
        <div className="page-shell rlr-outcomes-grid">
          <div className="rlr-outcomes-copy">
            <p className="rlr-kicker">Your customer dashboard</p>
            <h2>See every chat. Track every lead.</h2>
            <p>
              Read conversations, find customer contact details, and see where leads came from. Mark each lead as new, contacted, booked, or lost, and add the value of jobs you book.
            </p>
            <div className="rlr-summary-card">
              <div className="rlr-summary-header"><span>Example lead · Sample data</span><strong>Website chat</strong></div>
              <div className="rlr-summary-person">
                <span>JM</span>
                <div><strong>Jordan M.</strong><p>Returning customer · AC repair</p></div>
                <i>Needs callback</i>
              </div>
              <dl>
                <div><dt>Landing page</dt><dd>/ac-repair</dd></div>
                <div><dt>Where they came from</dt><dd>Google paid ad</dd></div>
                <div><dt>Campaign</dt><dd>Summer AC repair</dd></div>
              </dl>
              <div className="rlr-summary-footer"><Check aria-hidden="true" /> Conversation and contact details in one place</div>
            </div>
          </div>

          <div className="rlr-text-back-wrap" id="business-knowledge">
            <div>
              <p className="rlr-kicker">Your knowledge base</p>
              <h3>Update your answers in one place.</h3>
              <p>Add your services, hours, prices, and common questions. Save drafts for review, then publish the answers you want your chatbot to use.</p>
            </div>
            <Link className="rlr-button rlr-button-primary" href="/dashboard-demo">Preview the customer dashboard <ArrowRight /></Link><a className="rlr-inline-link" href="#try-chat">Try the answers in a chat <ArrowRight /></a>
          </div>
        </div>
      </section>

      <section className="sales-owner-work page-shell">
        <Image className="retro-scene" src="/illustrations/front-desk-scene.png" alt="A cheerful retro computer assistant organizing customer messages into useful job requests" width={1536} height={1024} sizes="(max-width: 760px) 100vw, 50vw" />
        <div><p className="rlr-kicker">Built for owners with their hands full</p><h2>Keep doing the work you’re known for.</h2><p>You shouldn’t have to stop a job to answer the same service-area question again. Give customers a helpful first response while you take care of the person in front of you.</p><p>Your chatbot gathers the details. Your team decides the next step. Danny checks the answers and makes sure requests reach your dashboard before launch.</p><a className="rlr-inline-link" href="#trial">Try two weeks free <ArrowRight /></a></div>
      </section>

      <IndustryExamples />
      <ChatPricing />

      <section className="rlr-safety">
        <div className="page-shell rlr-safety-grid">
          <div className="rlr-safety-heading">
            <p className="rlr-kicker">You stay in control</p>
            <h2>You approve the answers. Your team handles the customer.</h2>
          </div>
          <div className="rlr-safety-list">
            <article><ShieldCheck aria-hidden="true" /><div><h3>Uses your approved information</h3><p>The chatbot uses the answers you approve. Visitors can leave their details when they need help from your team.</p></div></article>
            <article><PhoneForwarded aria-hidden="true" /><div><h3>Sends requests to your team</h3><p>A contact request is a lead, not a confirmed appointment. Your team confirms the appointment and marks it as booked.</p></div></article>
            <article><Headphones aria-hidden="true" /><div><h3>Lets you review every conversation</h3><p>Read conversations, change chatbot answers, or pause chat from your dashboard.</p></div></article>
          </div>
        </div>
      </section>



      <ChatTrial />

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
          <p className="rlr-kicker">Start your free trial</p>
          <h2>Help your next website visitor become a customer.</h2>
          <p>Get website chat, setup, and your own dashboard free for two weeks.</p>
          <div>
            <a className="rlr-button rlr-button-light" href="#trial">
              Try two weeks free <ArrowRight aria-hidden="true" />
            </a>
            <a className="rlr-final-demo-link" href="#try-chat">Try the chatbot first</a>
          </div>
        </div>
      </section>

      <PublicSiteFooter />
    </main>
  );
}
