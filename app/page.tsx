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
import { ChatPricing, ChatTrial, CustomerProblem, IndustryExamples, KnowledgeInAction, ProductOverview } from "./components/chatbot-sales-sections";
import { contactEmail } from "@/lib/contact";
import { demoKnowledge, demoKnowledgeCategories } from "@/lib/demo-knowledge";
import "./knowledge-demo.css";

export const metadata: Metadata = {
  title: "Website Chat & AI Call Answering for Service Businesses | Snappy Leads",
  description:
    "Answer calls and website questions, capture job requests, and give your team the details to follow up—even after hours. We handle the setup.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Answer calls. Capture leads. Even at 2 AM.",
    description:
      "Website chat and AI voice agents answer customer questions and capture job requests while you’re busy or off the clock. We handle the setup.",
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
    title: "Answer calls. Capture leads. Even at 2 AM.",
    description: "Website chat and AI voice agents answer customer questions and capture job requests while you’re busy or off the clock. We handle the setup.",
    images: ["/opengraph-image"],
  },
};

const faqs = [
  { q: "How does the two-week free trial work?", a: "We agree on your business knowledge, website, and follow-up setup before we begin. Setup is included, and your 14 days start when the chatbot goes live. No card is required. Website chat starts at $399/month after the trial. You approve the monthly price, usage allowance, and support scope before paid service starts." },
  { q: "Who handles the setup?", a: "You work directly with Danny. Together, we map your services, pricing rules, memberships, service area, policies, and the questions customers actually ask. You review the knowledge and test realistic conversations before launch." },
  { q: "How much can it know about my business?", a: "We build your knowledge base around the information you approve: service details, pricing and exclusions, maintenance plans, warranties, safe troubleshooting, policies, and more. The live demo uses a detailed fictional HVAC business so you can explore what that depth looks like. Your own setup is scoped and tested with you." },
  { q: "Does every question have to go to a person?", a: "No. Published answers can resolve routine questions about your services and policies right in the chat. Your team is needed for work that requires a person, such as inspecting equipment, confirming an appointment, or answering a question outside the approved knowledge. The demo shows how an AI advisor can connect information across a conversation." },
  { q: "What happens when it doesn’t know?", a: "It should say so, explain what it can answer, and offer the appropriate next step. We define those boundaries with you. It shouldn’t make up a price, promise availability, or claim a technician is on the way." },
  { q: "How does a chat turn into a lead?", a: "Visitors can get answers first. When they want help from your team, they choose ‘Ask the team to follow up’ and share their name, email, optional phone number, and request. With their permission, those details are saved with the full conversation in your dashboard. The public demo uses a fictional business and doesn’t collect customer requests." },
  { q: "How does my team take over?", a: "During setup, we configure where requests go and who gets notified. Alerts and routing are part of your setup, with the recipients and follow-up process agreed before launch. Your team can review the conversation, contact the customer, and track the result in the dashboard." },
  { q: "Can I see where a lead came from?", a: "Yes. You can see the page where a chat started and, when available, the website or campaign that brought the visitor there. Mark the leads you book and add the job value to compare results." },
  { q: "Does each customer have their own dashboard?", a: "Yes. Each business signs in to its own workspace to read conversations, update chatbot answers, and track leads." },
  { q: "Does it book appointments?", a: "It captures appointment requests so your team can follow up with the details already in hand. Your team confirms availability and the appointment time with the customer, then marks the lead as booked and records the job value in the dashboard." },
  { q: "Do you also offer voice agents?", a: "Yes. Voice is a separate service for missed-call and after-hours coverage. Visit the Voice agents page to try the browser demo and learn how setup works." },
];

export default function HomePage() {
  return (
    <main className="landing-page rlr-home rlr-retro" id="sales-page">
      <SalesMotion />
      <div className="sales-trial-banner"><Link href="/raleigh-pilot" data-analytics-event="hvac_pilot_promo_clicked" data-analytics-location="homepage_banner">Raleigh-area HVAC business? <span>Apply for three months of website chat, on us.</span> <ArrowRight size={14} aria-hidden="true" /></Link></div>
      <PublicSiteNav
        cta={{ href: "#trial", label: "Try two weeks free" }}
      />

      <section className="rlr-hero knowledge-home-hero">
        <div className="page-shell rlr-hero-grid">
          <div className="rlr-hero-copy">
            <p className="rlr-kicker"><span /> Website chat + AI voice for service businesses</p>
            <h1><span>Answer calls.</span>{" "}<span>Capture leads.</span>{" "}<em>Even at 2 AM.</em></h1>
            <p className="rlr-hero-intro">
              Turn customer questions into your next job. Our website chat answers
              questions and collects contact details and service requests, day or night.
              Add an AI voice agent to cover missed calls. We handle the setup;
              your team follows up and confirms the booking.
            </p>
            <div className="rlr-hero-actions">
              <a className="rlr-button rlr-button-primary" href="#trial">
                Try two weeks free <ArrowRight aria-hidden="true" />
              </a>
              <a className="rlr-button rlr-button-secondary" href="#try-chat">Put it to the test</a>
            </div>
            <div className="rlr-hero-assurances" aria-label="Chatbot features">
              <span><Check aria-hidden="true" /> Two-week free trial</span>
              <span><Check aria-hidden="true" /> Knowledge you approve</span>
              <span><Check aria-hidden="true" /> Helpful around the clock</span>
            </div>
          </div>

          <div className="rlr-demo-card" id="try-chat">
            <div className="rlr-demo-topline">
              <div><span className="rlr-live-dot" /><span>Meet your AI service advisor</span></div>
              <span>Ask the hard questions ↙</span>
            </div>
            <WebsiteChat />
            <div className="rlr-demo-outcome" aria-label="Knowledge demo features">
              <div><span>Demo knowledge</span><strong>{demoKnowledge.length} detailed articles</strong></div>
              <div><span>Business depth</span><strong>{demoKnowledgeCategories.length} topic areas</strong></div>
              <div><span>Keep asking</span><strong>It follows the conversation</strong></div>
            </div>
            <Link className="knowledge-demo-source-link" href="/knowledge-base">Open the knowledge behind the answers <ArrowRight size={15} aria-hidden="true" /></Link>
          </div>
        </div>
      </section>

      <section className="rlr-founder page-shell">
        <Image src="/danny.jpeg" alt="Danny Sullivan, founder of Snappy Leads" width={112} height={112} />
        <div>
          <p className="rlr-kicker">Founder-led setup</p>
          <h2>Your whole business. At their fingertips.</h2>
          <p>
            I&apos;m Danny Sullivan, an AI product engineer and former
            service-business owner. I help put your company’s collective knowledge to work.
            We bring together the information across your website, documents, and experienced
            team, then organize and test it with you. Your services, prices, policies, and
            processes become one knowledgeable AI assistant. It connects those details to answer
            complicated questions and help customers understand their options through chat
            or voice—24 hours a day, even at 2 AM.
          </p>
        </div>
        <a className="rlr-inline-link" href={`mailto:${contactEmail}`}>Email Danny <ArrowRight aria-hidden="true" /></a>
      </section>

      <section className="rlr-trust-band" aria-label="How the service fits your business">
        <div className="page-shell">
          <span><Headphones aria-hidden="true" /> Questions answered anytime</span>
          <span><PhoneForwarded aria-hidden="true" /> Your prices. Your policies.</span>
          <span><MessageSquareText aria-hidden="true" /> Answers with useful detail</span>
          <span><ShieldCheck aria-hidden="true" /> Your own private dashboard</span>
        </div>
      </section>

      <KnowledgeInAction />
      <CustomerProblem />
      <ProductOverview />

      <section className="rlr-flow page-shell" id="how-it-works">
        <div className="rlr-section-heading">
          <p className="rlr-kicker">How it works</p>
          <h2>We set it up. You review it. Then it goes live.</h2>
          <p>
            You don’t need to build a chatbot or learn a new tool to get started.
            We help turn your business information into useful knowledge, add the assistant to your site, and put it through its paces.
          </p>
        </div>
        <ol className="rlr-flow-steps">
          <li id="business-knowledge"><span>01</span><div><h3>Build your business playbook</h3><p>Services, pricing rules, memberships, warranties, and the details that make your business yours. We help organize it into clear, approved knowledge.</p></div></li>
          <li><span>02</span><div><h3>Test the real questions</h3><p>Try the everyday questions and the tricky ones. Review the answers, clarify the boundaries, and approve the setup before it reaches customers.</p></div></li>
          <li><span>03</span><div><h3>Go live and review your leads</h3><p>Your trial starts when the chatbot is ready. See each conversation, contact request, and lead source in your dashboard, then record what happens next.</p></div></li>
        </ol>
      </section>

      <section className="rlr-outcomes" id="outcomes">
        <div className="page-shell rlr-outcomes-grid">
          <div className="rlr-outcomes-copy">
            <p className="rlr-kicker">From answers to action</p>
            <h2>From a question to a real inquiry.</h2>
            <p>
              Useful answers build confidence. When a visitor wants your help, give your team the request, the context, and a clear next step.
            </p>
            <ol className="lead-flow">
              <li><strong>Answer the question</strong><p>Help visitors understand your services, prices, and policies using information you approve.</p></li>
              <li><strong>Capture the request</strong><p>Visitors leave their name, contact details, and what they need, with permission to follow up.</p></li>
              <li><strong>Notify the right person</strong><p>We configure alerts and routing during setup, so requests reach the people who handle your follow-up.</p></li>
              <li><strong>Follow up and track the job</strong><p>Your team confirms appointments, tracks each lead, and records the value of booked work.</p></li>
            </ol>
          </div>

          <div className="lead-preview">
            <div className="rlr-summary-card">
              <div className="rlr-summary-header"><span>Example lead · Sample data</span><strong>Website chat</strong></div>
              <div className="rlr-summary-person">
                <span>JM</span>
                <div><strong>Jordan M.</strong><p>AC repair request</p></div>
                <i>New inquiry</i>
              </div>
              <dl>
                <div><dt>Contact</dt><dd>jordan@example.com</dd></div>
                <div><dt>Request</dt><dd>“My upstairs AC isn’t cooling. Can we arrange a visit?”</dd></div>
                <div><dt>Source</dt><dd>Google paid ad → /ac-repair</dd></div>
              </dl>
              <div className="rlr-summary-footer"><Check aria-hidden="true" /> Contact details and the full conversation, together</div>
            </div>
            <p className="lead-preview-note">See the conversation and source, then move leads from new to contacted, booked, or lost.</p>
            <Link className="rlr-button rlr-button-primary" href="/dashboard-demo">Preview the lead dashboard <ArrowRight aria-hidden="true" /></Link>
          </div>
        </div>
      </section>

      <section className="sales-owner-work page-shell">
        <Image className="retro-scene" src="/illustrations/front-desk-scene.png" alt="A cheerful retro computer assistant organizing customer messages into useful job requests" width={1536} height={1024} sizes="(max-width: 760px) 100vw, 50vw" />
        <div><p className="rlr-kicker">Built for owners with their hands full</p><h2>Keep doing the work you’re known for.</h2><p>You shouldn’t have to stop a job to explain the maintenance plan again. Let customers explore their options, understand your pricing, and get ready for a service visit while you take care of the person in front of you.</p><p>When a question does need your team, the conversation provides context. Routine information can be answered right away, and your people can focus on the work that needs them.</p><a className="rlr-inline-link" href="#trial">Try two weeks free <ArrowRight aria-hidden="true" /></a></div>
      </section>

      <IndustryExamples />
      <ChatPricing />

      <section className="rlr-safety">
        <div className="page-shell rlr-safety-grid">
          <div className="rlr-safety-heading">
            <p className="rlr-kicker">You stay in control</p>
            <h2>Useful answers. Clear boundaries. Your standards.</h2>
          </div>
          <div className="rlr-safety-list">
            <article><ShieldCheck aria-hidden="true" /><div><h3>Knowledge with your stamp of approval</h3><p>You decide what it can explain, from prices and exclusions to service policies. We review the details with you before launch.</p></div></article>
            <article><PhoneForwarded aria-hidden="true" /><div><h3>A person when a person is needed</h3><p>Routine questions deserve answers. Inspections, exact repair quotes, and appointment confirmations need your team. The assistant makes that distinction clear.</p></div></article>
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
