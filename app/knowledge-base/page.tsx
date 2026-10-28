import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, Check, Clock3, ShieldCheck } from "lucide-react";
import { PublicSiteNav } from "@/app/components/public-site-nav";
import { PublicSiteFooter } from "@/app/components/public-site-footer";
import { WebsiteChat } from "@/app/components/website-chat";
import { DemoKnowledgeLibrary, DemoScenarioCards } from "@/app/components/demo-knowledge-library";
import { demoBusinessName, demoKnowledge, demoKnowledgeCategories } from "@/lib/demo-knowledge";
import "../knowledge-demo.css";

export const metadata: Metadata = {
  title: "Explore the AI Knowledge Base Demo | Snappy Leads",
  description: "Explore a detailed sample business knowledge base, then test the AI service advisor on prices, maintenance plans, troubleshooting, warranties, and policies.",
  alternates: { canonical: "/knowledge-base" },
};

export default function KnowledgeBasePage() {
  return <main className="landing-page rlr-home rlr-retro knowledge-page">
    <PublicSiteNav cta={{ href: "/#trial", label: "Try two weeks free" }} />

    <section className="knowledge-hero page-shell">
      <div>
        <Link className="knowledge-back-link" href="/">Snappy Leads <span aria-hidden="true">/</span> The knowledge demo</Link>
        <p className="rlr-kicker">A business playbook you can talk to</p>
        <h1>The answers are<br />in the <em>details.</em></h1>
        <p className="knowledge-hero-intro">Meet a service advisor that can explain the membership, walk through the pricing, and help a customer prepare for a visit. Then ask it a follow-up.</p>
        <div className="knowledge-hero-actions"><a className="rlr-button rlr-button-primary" href="#try-chat">Test the assistant <ArrowRight aria-hidden="true" /></a><a className="rlr-inline-link" href="#knowledge-library">Browse the knowledge <BookOpen aria-hidden="true" size={18} /></a></div>
        <p className="knowledge-sample-note">Fictional HVAC business. Sample prices and policies for demonstration. No real service, bookings, or dispatches.</p>
      </div>
      <div className="knowledge-playbook">
        <div className="knowledge-playbook-top"><BookOpen aria-hidden="true" size={17} /><span>The business playbook</span><span>DEMO</span></div>
        <div className="knowledge-playbook-body"><p>{demoBusinessName}</p><h2>Built to be<br />helpful.</h2><Image src="/illustrations/front-desk-mascot.png" alt="Snappy’s cheerful computer service advisor" width={300} height={300} sizes="(max-width: 760px) 200px, 250px" /><div className="knowledge-playbook-stamp"><strong>{demoKnowledge.length}</strong><span>knowledge<br />articles</span></div></div>
        <div className="knowledge-playbook-bottom"><span><Check aria-hidden="true" size={15} /> {demoKnowledgeCategories.length} topic areas</span><span><Clock3 aria-hidden="true" size={15} /> Ask anytime</span></div>
      </div>
    </section>

    <section className="knowledge-value-band" aria-label="What to explore"><div className="page-shell"><span>Pricing &amp; exclusions</span><span>Maintenance plans</span><span>Safe troubleshooting</span><span>Warranties &amp; policies</span></div></section>

    <section className="knowledge-live-section page-shell" aria-labelledby="knowledge-live-title">
      <div className="knowledge-live-copy"><p className="rlr-kicker">Try a real conversation</p><h2 id="knowledge-live-title">It’s 9 PM.<br />The office is closed.<br /><em>You still get answers.</em></h2><p>Play the homeowner. Ask what a repair visit costs, whether joining the maintenance plan makes sense, or what you can check before calling. Keep going—the demo uses your earlier messages to answer follow-ups.</p><div className="knowledge-demo-boundaries"><ShieldCheck aria-hidden="true" size={22} /><p><strong>A knowledgeable advisor knows its limits.</strong> It can explain these sample policies. It can’t inspect equipment, promise an exact repair price, check live availability, or send a technician.</p></div><a className="rlr-inline-link" href="#knowledge-library">Read the source articles <ArrowRight aria-hidden="true" /></a></div>
      <div className="knowledge-live-chat" id="try-chat"><div className="knowledge-chat-label"><span><i aria-hidden="true" /> Live AI conversation</span><span>Fictional business</span></div><WebsiteChat /><div className="knowledge-chat-footer"><BookOpen aria-hidden="true" size={16} /> Built around {demoKnowledge.length} detailed source articles</div></div>
    </section>

    <section className="knowledge-prompts page-shell" aria-labelledby="knowledge-prompts-title"><div className="knowledge-prompts-heading"><p className="rlr-kicker">Don’t stop at “What are your hours?”</p><h2 id="knowledge-prompts-title">Give it a situation to work with.</h2></div><DemoScenarioCards limit={3} /></section>

    <DemoKnowledgeLibrary />

    <section className="knowledge-own-playbook"><div className="page-shell"><div><p className="rlr-kicker">Now imagine it knows your business</p><h2>Your prices.<br />Your policies.<br /><em>Your way of helping.</em></h2></div><div><p>We build the knowledge base with you: the services you offer, the details customers ask about, and the boundaries you want it to follow. You review the answers and test the setup before launch.</p><ul><li><Check aria-hidden="true" /> Your approved business information</li><li><Check aria-hidden="true" /> Realistic questions tested with you</li><li><Check aria-hidden="true" /> Setup and a two-week website chat trial</li></ul><Link className="rlr-button rlr-button-primary" href="/#trial">Build my business playbook <ArrowRight aria-hidden="true" /></Link></div></div></section>
    <PublicSiteFooter />
  </main>;
}
