import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, Clock3, MessageSquareText, Wrench } from "lucide-react";
import { BrandMark } from "@/app/components/brand-mark";
import { WebsiteChat } from "@/app/components/website-chat";
import { HvacPilotForm } from "@/app/components/hvac-pilot-form";
import { contactEmail } from "@/lib/contact";
import "./pilot.css";

export const metadata: Metadata = {
  title: "Raleigh HVAC Website Chat Pilot · 3 Months Free | Snappy Leads",
  description: "Apply for three months of website chat for your Raleigh-area HVAC business. Five pilot businesses, setup included, 1,000 AI replies per month. No card required.",
  alternates: { canonical: "/raleigh-pilot" },
  openGraph: { title: "More HVAC job requests. Three months on us.", description: "A website chat pilot for five qualifying Raleigh-area HVAC businesses. Setup included. Apply to take part.", url: "/raleigh-pilot" },
  twitter: { card: "summary_large_image", title: "Raleigh HVAC businesses: apply for 3 months of website chat", description: "Five pilot businesses. Setup included. No card required." },
};

const included = [
  [MessageSquareText, "Answers that sound like your business", "Help homeowners understand your services, service area, maintenance plans, and approved pricing—even when the office is closed."],
  [Clock3, "Job requests ready for follow-up", "Collect contact details and what the homeowner needs, with the conversation and source saved in your dashboard."],
  [Wrench, "Setup handled with you", "Danny prepares your business knowledge, installs the widget, configures lead alerts, and tests the answers with you before launch."],
] as const;
const faqs = [
  ["Who is this pilot for?", "HVAC businesses serving Raleigh and nearby Triangle communities, including Cary, Apex, Garner, Wake Forest, and Durham. We’re looking for active paid lead generation, website traffic, capacity for more jobs, and an owner or manager willing to test AI with us. We review fit on a short call; applying doesn’t guarantee selection."],
  ["What does three months free include?", "One business, one location, and one website. We include setup, your approved business knowledge, the chat widget, a lead dashboard, agreed email alerts, monthly results reviews, and up to 1,000 AI replies per month. Your three months start at launch. An AI reply is one answer from the assistant; a conversation can use several replies."],
  ["What happens if we reach the usage allowance?", "AI answers pause at the monthly allowance; the follow-up form remains available. We review usage with you before any paid increase. There are no automatic overage charges."],
  ["What happens after the pilot?", "$399/month at the same 1,000-reply allowance if you choose to continue. We confirm the ongoing scope with you before paid service starts. No card is required to apply and there is no automatic paid enrollment. Additional locations or custom integrations are quoted separately."],
  ["Does it answer phone calls or book appointments?", "This pilot covers website chat. It collects appointment requests for your team to confirm; it doesn’t book a calendar slot or dispatch a technician. Phone answering is a separate service."],
  ["What do you need from us?", "Help approving the business information, access to install the widget, a named person to follow up with leads, and a short monthly review of inquiries and booked work. Any public case study or testimonial requires your separate permission."],
];

export default function RaleighPilotPage() {
  return <main className="rlr-home rlr-retro hvac-pilot">
    <div className="pilot-announcement">Raleigh + the Triangle <span>·</span> Applications open for a five-business pilot</div>
    <header className="pilot-nav page-shell"><BrandMark /><a className="rlr-button rlr-button-primary" href="#apply" data-analytics-event="hvac_pilot_apply_clicked" data-analytics-location="pilot_nav">Apply for the pilot <ArrowRight aria-hidden="true" /></a></header>
    <section className="pilot-hero">
      <div className="page-shell pilot-hero-grid">
        <div>
          <p className="rlr-kicker">For Raleigh-area HVAC owners</p>
          <h1>You paid for the click.<br /><em>Make it a conversation.</em></h1>
          <p className="pilot-lede">Turn more website visitors into HVAC job requests. Give homeowners answers about repairs, tune-ups, and replacements—and a way to reach your team, day or night.</p>
          <a className="rlr-button rlr-button-primary" href="#apply" data-analytics-event="hvac_pilot_apply_clicked" data-analytics-location="pilot_hero">Apply for three months free <ArrowRight aria-hidden="true" /></a>
          <p className="pilot-hero-note">Website chat · Setup included · No card required</p>
          <a className="pilot-demo-link" href="#pilot-demo">Try the HVAC assistant first ↓</a>
        </div>
        <aside className="pilot-offer" aria-label="Pilot offer">
          <span className="pilot-stamp">THE RALEIGH HVAC PILOT</span>
          <p className="pilot-offer-number">3 <span>months<br />on us.</span></p>
          <p>Five businesses. A real-world test of what better website conversations can do.</p>
          <ul><li><Check /> Your business knowledge</li><li><Check /> 1,000 AI replies each month</li><li><Check /> Lead capture + email alerts</li><li><Check /> Setup + monthly results reviews</li></ul>
          <div className="pilot-offer-bottom">$399/month afterward, only if you choose to continue.<br />One business, location, and website. Selection required.</div>
        </aside>
      </div>
    </section>
    <section className="page-shell pilot-section" aria-labelledby="pilot-value">
      <p className="rlr-kicker">From an ad click to a useful conversation</p><h2 id="pilot-value">Be helpful while you’re out fixing things.</h2>
      <div className="pilot-benefits">{included.map(([Icon, title, body]) => <article key={title}><Icon aria-hidden="true" /><h3>{title}</h3><p>{body}</p></article>)}</div>
    </section>
    <section className="pilot-demo-section" id="pilot-demo">
      <div className="page-shell pilot-demo-grid">
        <div><p className="rlr-kicker">Try it before you apply</p><h2>Your next customer has questions.</h2><p>“Do you service my area?” “What does a diagnostic visit cost?” “Is a maintenance plan worth it?”</p><p>Ask the assistant, then ask a follow-up. This demo uses a fictional HVAC company. Your version uses the business information you approve.</p><p className="pilot-small">Sample prices and policies. No real appointments or dispatches. Please use sample details.</p></div>
        <div className="pilot-chat"><WebsiteChat /></div>
      </div>
    </section>
    <section className="page-shell pilot-section pilot-fit" aria-labelledby="pilot-fit-title">
      <div><p className="rlr-kicker">Built for a useful test</p><h2 id="pilot-fit-title">A good fit goes both ways.</h2><p>You don’t need to be an AI expert. You do need an active website, room for more work, and a team ready to follow up.</p><p>We’ll review your traffic and current process together. You can apply if you don’t know your exact visitor count.</p></div>
      <ul>{["You serve HVAC customers in Raleigh or the Triangle.", "You invest in Google Ads, Local Services Ads, or other paid lead generation.", "You have room for more jobs and someone who follows up with leads.", "You can approve setup, test the answers, and review results monthly.", "You would consider $399/month if the results justify it."].map(item => <li key={item}><Check aria-hidden="true" />{item}</li>)}</ul>
    </section>
    <section className="pilot-founder page-shell"><Image src="/danny.jpeg" alt="Danny Sullivan, founder of Snappy Leads" width={100} height={100} /><div><p className="rlr-kicker">You work directly with Danny</p><h2>A person behind the assistant.</h2><p>I’m Danny, an AI product engineer and former service-business owner. I’ll help prepare your answers, get the chatbot onto your website, and review what happens after launch.</p></div></section>
    <section className="pilot-application" id="apply"><div className="page-shell pilot-application-grid"><div><p className="rlr-kicker">Apply for the pilot</p><h2>Let’s put your website to work.</h2><p>We’re selecting five HVAC businesses for a hands-on, three-month pilot.</p><ol><li><strong>Apply.</strong> Tell us about your traffic and follow-up process.</li><li><strong>Check the fit.</strong> Danny emails you to arrange a short conversation.</li><li><strong>Launch together.</strong> Approve the answers and installation. Your three months start when the chatbot goes live.</li></ol><p className="pilot-small">Your application is a request to participate. We’ll agree on setup before starting. No card required and no automatic billing.</p></div><HvacPilotForm /></div></section>
    <section className="page-shell pilot-section pilot-faq" aria-labelledby="pilot-faq-title"><p className="rlr-kicker">The details</p><h2 id="pilot-faq-title">Before you apply.</h2>{faqs.map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</section>
    <footer className="pilot-footer"><div className="page-shell"><BrandMark /><p>Snappy Leads · Hands-on setup and support</p><nav aria-label="Footer"><a href={`mailto:${contactEmail}`}>Email Danny</a><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></nav></div></footer>
  </main>;
}
