import Link from "next/link";
import { TrialRequestForm } from "./trial-request-form";
import { ArrowRight, BookOpen, Check, Clock3, MessageSquareText, PhoneForwarded } from "lucide-react";

export function TrialBanner() {
  return <div className="sales-trial-banner"><a href="#trial">Try website chat free for 14 days. <span>· No card required · Setup included</span> <ArrowRight size={14} aria-hidden="true" /></a></div>;
}

export function CustomerProblem() {
  const problems = [
    ["01", "Visitors leave without an answer.", "They want to know whether you offer a service, cover their area, or are open today. If they can’t find the answer, they may try another business."],
    ["02", "Calls and messages wait.", "You’re on a job or helping another customer. A voicemail or contact form can sit unanswered until you have time to check it."],
    ["03", "Your team has to ask again.", "A message that says “call me” leaves out the job, the urgency, and the best way to reach the customer. The follow-up starts with more questions."],
  ];
  return <section className="sales-problem"><div className="page-shell">
    <div className="sales-section-title"><p className="rlr-kicker">The problem</p><h2>Customers need answers while you’re busy working.</h2><p>Give them a way to ask questions and leave the details your team needs to follow up.</p></div>
    <div className="sales-card-grid">{problems.map(([number, title, body]) => <article className="sales-problem-card" key={number}><span>{number}</span><h3>{title}</h3><p>{body}</p></article>)}</div>
    <div className="sales-solution-band"><p><strong>Your website can answer the first questions for you.</strong> The chatbot uses your business information, collects the request, and saves the conversation for your team.</p><div><span><strong>24/7</strong>Website chat</span><span><strong>Setup included</strong>We install and test it</span><span><strong>Your dashboard</strong>Chats, contacts &amp; sources</span></div></div>
  </div></section>;
}

export function ProductOverview() {
  return <section className="sales-section page-shell" id="products">
    <div className="sales-section-title"><p className="rlr-kicker">What you get</p><h2>Answer website visitors. Handle missed calls.</h2><p>Start with a website chatbot. Add a voice agent if you also need phone coverage. We set up each service with your business information and the questions you want it to ask.</p></div>
    <div className="sales-product-grid">
      <article><MessageSquareText aria-hidden="true" /><p className="rlr-kicker">Website chatbot</p><h3>Turn website questions into leads you can follow up with.</h3><ul>
        <li><Check /> Answers questions about your services, pricing, hours, and service area using information you approve</li>
        <li><Check /> Collects the customer’s name, contact details, and what they need help with</li>
        <li><Check /> Saves the full conversation and shows which page or campaign brought them to you</li>
        <li><Check /> Gives your team a request to confirm, without promising an unavailable appointment</li>
        <li><Check /> Includes installation and testing on your website</li>
      </ul><a className="rlr-button rlr-button-primary" href="#try-chat">Try the chatbot <ArrowRight /></a></article>
      <article><PhoneForwarded aria-hidden="true" /><p className="rlr-kicker">Voice agent · Optional service</p><h3>Answer callers when your team can’t get to the phone.</h3><ul>
        <li><Check /> Greets callers in your business’s name and identifies itself as an AI assistant</li>
        <li><Check /> Asks about the service needed, location, urgency, and callback details</li>
        <li><Check /> Gives your team a call summary and transcript to review</li>
        <li><Check /> Follows the callback and transfer rules you approve</li>
        <li><Check /> Works with call forwarding from your existing business number</li>
      </ul><Link className="rlr-button rlr-button-secondary" href="/voice">Try the voice demo <ArrowRight /></Link></article>
    </div>
  </section>;
}

export function IndustryExamples() {
  const industries = [
    ["HVAC", "Repairs and maintenance", "Answer service-area questions and collect repair or tune-up requests."],
    ["Plumbing", "Service calls and estimates", "Collect the issue, location, and details for your team to review."],
    ["Dental", "New-patient inquiries", "Answer office questions and collect appointment requests for staff to confirm."],
    ["Auto repair", "Shop hours and service requests", "Explain your services and drop-off process, then collect vehicle and contact details."],
    ["Contractors", "Projects and quotes", "Collect project scope, timing, and contact details before an estimate call."],
    ["Other service businesses", "Your customers’ everyday questions", "We’ll help you decide what to answer and when to pass a request to your team."],
  ];
  return <section className="sales-industries"><div className="page-shell"><div className="sales-section-title"><p className="rlr-kicker">Industries we help</p><h2>Built for businesses that turn inquiries into appointments.</h2><p>Your services, your customers, and your way of working. We set up the answers around your business.</p></div><div className="sales-industry-grid">{industries.map(([industry, title, body]) => <article key={industry}><span>{industry}</span><h3>{title}</h3><p>{body}</p></article>)}</div><Link className="rlr-inline-link" href="/get-started">Tell us about your business <ArrowRight /></Link></div></section>;
}

export function ChatPricing() {
  const plans = [
    { name: "Website Chat", service: "chat", description: "Help website visitors get answers and take the next step.", features: ["Answers from your approved business information", "Contact details and service requests", "Full chat transcripts in your dashboard", "Lead sources, follow-up status, and booking value"] },
    { name: "Voice AI", service: "voice", description: "Give callers a helpful answer when your team is busy.", features: ["A greeting tailored to your business", "Service needs, urgency, and callback details", "Call summaries and transcripts", "Call forwarding and rules you approve"] },
    { name: "Chat + Voice", service: "both", description: "Cover your website and phone with a setup built around your business.", features: ["Everything in Website Chat and Voice AI", "Business information prepared for both channels", "Website inquiries and missed-call coverage", "Setup and support for both services"] },
  ];
  return <section className="sales-pricing" id="pricing"><div className="page-shell">
    <div className="sales-section-title"><p className="rlr-kicker">Choose your coverage</p><h2>The right setup. A price built around your business.</h2><p>Start with chat, voice, or both. We’ll discuss your goals, expected volume, and integrations, then agree on a price before paid service starts.</p></div>
    <div className="sales-card-grid">{plans.map((plan) => <article className={`sales-plan${plan.service === "both" ? " sales-plan-featured" : ""}`} key={plan.service}>
      <h3>{plan.name}</h3><p>{plan.description}</p>
      <div className="sales-plan-price"><strong>Custom</strong><span>pricing</span></div>
      <ul>{plan.features.map((feature) => <li key={feature}><Check aria-hidden="true" />{feature}</li>)}</ul>
      <Link className="rlr-button rlr-button-primary" href={`/get-started?service=${plan.service}`} aria-label={`Let’s talk about ${plan.name}`}>Let’s talk <ArrowRight aria-hidden="true" /></Link>
    </article>)}</div>
    <p className="sales-pricing-trial"><strong>Want to try website chat first?</strong> Get 14 days free, with setup included and no card required. <a href="#trial">Request your chat trial <ArrowRight size={16} aria-hidden="true" /></a></p>
  </div></section>;
}

export function ChatTrial({ service }: { service?: string } = {}) {
  if (service) return <section className="sales-trial page-shell" id="trial"><div><p className="rlr-kicker">Let’s talk · {service}</p><h2>A setup that fits your business.</h2><p>Tell us what you need. Danny will email you to discuss your goals, expected usage, and any integrations. We’ll agree on the scope and price before getting started.</p><p>Website chat includes a two-week free trial after setup. Voice coverage and usage are quoted separately or as part of your combined plan.</p></div><TrialRequestForm key={service} service={service} /></section>;
  return <section className="sales-trial page-shell" id="trial"><div><p className="rlr-kicker">Get started</p><h2>Tell us about your business. We’ll handle the setup.</h2><p>Fill out the form and Danny will email you to arrange setup. We’ll prepare your business information, install the chatbot, and test it with you before your two-week trial begins.</p><div className="sales-trial-details"><span><BookOpen /> Your approved business information</span><span><Clock3 /> 14 days free after setup</span><span><MessageSquareText /> Your own chat dashboard</span></div></div><TrialRequestForm /></section>;
}
