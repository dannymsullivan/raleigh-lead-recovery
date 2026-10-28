import Link from "next/link";
import { TrialRequestForm } from "./trial-request-form";
import { ArrowRight, BookOpen, Check, Clock3, MessageSquareText, PhoneForwarded } from "lucide-react";
import { demoKnowledge, demoKnowledgeCategories } from "@/lib/demo-knowledge";
import { DemoScenarioCards } from "./demo-knowledge-library";

export function TrialBanner() {
  return <div className="sales-trial-banner"><a href="#trial">Try website chat free for 14 days. <span>· No card required · Setup included</span> <ArrowRight size={14} aria-hidden="true" /></a></div>;
}

export function CustomerProblem() {
  const problems = [
    ["01", "The good questions come after hours.", "It’s 9 PM. A homeowner wants to know what a service visit costs, whether their membership helps, and what they can safely check tonight. They need useful answers now."],
    ["02", "Your best answers live in your head.", "The details that make you helpful—what’s included, what to expect, and which option fits—aren’t always easy to find on a website. We help put that knowledge to work."],
    ["03", "Your team repeats itself all day.", "Explaining service fees, coverage, preparation, and policies takes time. Give customers a place to get those answers so your team can focus on solving the actual problem."],
  ];
  return <section className="sales-problem"><div className="page-shell">
    <div className="sales-section-title"><p className="rlr-kicker">The opportunity</p><h2>Your expertise shouldn’t clock out at five.</h2><p>Your customers have more questions than “What are your hours?” Give them help that gets into the details.</p></div>
    <div className="sales-card-grid">{problems.map(([number, title, body]) => <article className="sales-problem-card" key={number}><span>{number}</span><h3>{title}</h3><p>{body}</p></article>)}</div>
    <div className="sales-solution-band"><p><strong>Put your business knowledge to work.</strong> Build helpful answers around your services, your rules, and the questions your customers actually ask.</p><div><span><strong>24/7</strong>Help beyond office hours</span><span><strong>Your knowledge</strong>Prepared and approved with you</span><span><strong>Your dashboard</strong>Chats, contacts &amp; sources</span></div></div>
  </div></section>;
}

export function KnowledgeInAction() {
  return <section className="knowledge-story page-shell" aria-labelledby="knowledge-story-title">
    <div className="knowledge-story-heading">
      <div><p className="rlr-kicker">Go ahead. Ask a follow-up.</p><h2 id="knowledge-story-title">The impressive part?<br /><em>It knows the details.</em></h2></div>
      <div><p>Meet the assistant for Oak City Heating &amp; Air, our fictional demo business. Ask about a problem, compare options, then change the details. See how a deep knowledge base makes the conversation useful.</p><Link className="rlr-inline-link" href="/knowledge-base">Explore all {demoKnowledge.length} knowledge articles <ArrowRight aria-hidden="true" /></Link></div>
    </div>
    <DemoScenarioCards limit={3} />
    <div className="knowledge-story-footnote"><BookOpen aria-hidden="true" /><p><strong>{demoKnowledge.length} articles across {demoKnowledgeCategories.length} topic areas.</strong> Sample prices, plans, troubleshooting, warranties, and service policies. Fictional business; no appointments or dispatches are made in the demo.</p></div>
  </section>;
}

export function ProductOverview() {
  return <section className="sales-section page-shell" id="products">
    <div className="sales-section-title"><p className="rlr-kicker">What you get</p><h2>Helpful on your website. Helpful on the phone.</h2><p>Start with an assistant built around your business knowledge. Add a voice agent for phone coverage. We shape the information, behavior, and next steps around how you work.</p></div>
    <div className="sales-product-grid">
      <article><MessageSquareText aria-hidden="true" /><p className="rlr-kicker">Website assistant</p><h3>Your business knowledge, ready when customers need it.</h3><ul>
        <li><Check /> A knowledge base prepared around your services, prices, plans, policies, and common questions</li>
        <li><Check /> Approved answers that help customers understand their options and prepare for service</li>
        <li><Check /> Captures contact details and requests, with the full conversation in your dashboard</li>
        <li><Check /> Alerts and lead routing configured around your team’s follow-up process</li>
        <li><Check /> Includes installation and testing on your website</li>
      </ul><a className="rlr-button rlr-button-primary" href="#try-chat">Try the chatbot <ArrowRight /></a></article>
      <article><PhoneForwarded aria-hidden="true" /><p className="rlr-kicker">Voice agent · Optional service</p><h3>Answer callers when your team can’t get to the phone.</h3><ul>
        <li><Check /> Greets callers in your business’s name and identifies itself as an AI assistant</li>
        <li><Check /> Asks about the service needed, location, urgency, and callback details</li>
        <li><Check /> Gives your team a call summary and transcript to review</li>
        <li><Check /> Tells callers when to expect a callback and transfers calls as you approve</li>
        <li><Check /> Works with call forwarding from your existing business number</li>
      </ul><Link className="rlr-button rlr-button-secondary" href="/voice">Try the voice demo <ArrowRight /></Link></article>
    </div>
  </section>;
}

export function IndustryExamples() {
  const industries = [
    ["HVAC", "“Would a maintenance plan help?”", "Explain visit fees, member benefits, safe checks, and what a warranty actually covers."],
    ["Plumbing", "“What happens during the visit?”", "Explain diagnostic pricing, access requirements, service options, and your after-hours process."],
    ["Dental", "“What should I know before I come in?”", "Share approved new-patient requirements, office policies, payment options, and appointment preparation."],
    ["Auto repair", "“Can I leave my car overnight?”", "Explain key-drop instructions, inspection fees, estimate approvals, and repair warranty policies."],
    ["Contractors", "“Is this the kind of project you take on?”", "Explain project fit, estimate preparation, service boundaries, and how your process works."],
    ["Other service businesses", "“How does your business handle this?”", "Turn the answers your team gives every day into a useful, accessible business playbook."],
  ];
  return <section className="sales-industries"><div className="page-shell"><div className="sales-section-title"><p className="rlr-kicker">Your expertise, in conversation</p><h2>Every business has a playbook.</h2><p>These are the kinds of questions we build your knowledge around. Your information, your policies, and your approved answers.</p></div><div className="sales-industry-grid">{industries.map(([industry, title, body]) => <article key={industry}><span>{industry}</span><h3>{title}</h3><p>{body}</p></article>)}</div><Link className="rlr-inline-link" href="/get-started">Tell us about your business <ArrowRight aria-hidden="true" /></Link></div></section>;
}

export function ChatPricing() {
  const plans = [
    { name: "Website Chat", service: "chat", price: "$399", description: "Help website visitors get answers and take the next step.", features: ["Answers from your approved business information", "Contact requests and full chat transcripts", "Alerts and routing configured during setup", "Lead sources, follow-up status, and booked job value"] },
    { name: "Voice AI", service: "voice", price: "$799", description: "Give callers a helpful answer when your team is busy.", features: ["A greeting tailored to your business", "Service needs, urgency, and callback details", "Call summaries and transcripts", "Call forwarding and rules you approve"] },
    { name: "Chat + Voice", service: "both", price: null, description: "Cover your website and phone with a setup built around your business.", features: ["Everything in Website Chat and Voice AI", "Your services, hours, and answers used in both", "Website inquiries and missed-call coverage", "Alerts, routing, and support configured for your team"] },
  ];
  return <section className="sales-pricing" id="pricing"><div className="page-shell">
    <div className="sales-section-title"><p className="rlr-kicker">Choose your coverage</p><h2>Choose chat, voice, or both.</h2><p>Start with the coverage you need. We’ll confirm your setup, included usage, and monthly price before you pay.</p></div>
    <div className="sales-card-grid">{plans.map((plan) => <article className={`sales-plan${plan.service === "both" ? " sales-plan-featured" : ""}`} key={plan.service}>
      <h3>{plan.name}</h3><p>{plan.description}</p>
      <div className="sales-plan-price">{plan.price ? <><span>From</span><strong>{plan.price}</strong><span>/month</span></> : <><strong>Custom</strong><span>pricing</span></>}</div>
      <ul>{plan.features.map((feature) => <li key={feature}><Check aria-hidden="true" />{feature}</li>)}</ul>
      <Link className="rlr-button rlr-button-primary" href={`/get-started?service=${plan.service}`} aria-label={`Let’s talk about ${plan.name}`}>Let’s talk <ArrowRight aria-hidden="true" /></Link>
    </article>)}</div>
    <p className="sales-pricing-note">Final pricing depends on your conversation volume, locations, and connections to other tools. We’ll include usage limits and any extra costs in your quote.</p>
    <p className="sales-pricing-trial"><strong>Want to try website chat first?</strong> Get 14 days free, with setup included and no card required. <a href="#trial">Request your chat trial <ArrowRight size={16} aria-hidden="true" /></a></p>
  </div></section>;
}

export function ChatTrial({ service }: { service?: string } = {}) {
  if (service) return <section className="sales-trial page-shell" id="trial"><div><p className="rlr-kicker">Let’s talk · {service}</p><h2>A setup that fits your business.</h2><p>Tell us what you need help with. Danny will email you to discuss your business, expected chat or call volume, and any tools you want to connect. You’ll receive a quote before setup begins.</p><p>Website chat starts at $399/month after a two-week free trial. Voice AI starts at $799/month. Need both? We’ll put together a combined quote.</p></div><TrialRequestForm key={service} service={service} /></section>;
  return <section className="sales-trial page-shell" id="trial"><div><p className="rlr-kicker">Get started</p><h2>Tell us about your business. We’ll handle the setup.</h2><p>Fill out the form and Danny will email you to arrange setup. We’ll prepare your business information, install the chatbot, and test it with you before your two-week trial begins.</p><div className="sales-trial-details"><span><BookOpen /> Your approved business information</span><span><Clock3 /> 14 days free after setup</span><span><MessageSquareText /> Your own chat dashboard</span></div></div><TrialRequestForm /></section>;
}
