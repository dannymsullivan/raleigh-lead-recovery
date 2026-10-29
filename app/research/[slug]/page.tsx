import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowDown, ArrowRight, BookOpen, Check, MessageSquareText } from "lucide-react";
import { BrandMark } from "@/app/components/brand-mark";
import { ResearchKnowledgeDemo } from "@/app/components/research-knowledge-demo";
import { getResearchNiche, researchNiches } from "@/lib/research-niches";
import { contactEmail } from "@/lib/contact";
import "../research.css";

type Props = { params: Promise<{ slug: string }> };
export const dynamicParams = false;
export function generateStaticParams() { return researchNiches.map(({ slug }) => ({ slug })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const niche = getResearchNiche((await params).slug);
  if (!niche) notFound();
  return {
    title: `${niche.name}: a knowledge assistant concept | Snappy Leads`,
    description: `${niche.description} Explore the concept and share your feedback.`,
    alternates: { canonical: `/research/${niche.slug}` },
    robots: { index: false, follow: true },
    openGraph: { title: niche.headline, description: "A research concept from Snappy Leads. Would this help your customers?", url: `/research/${niche.slug}` },
    twitter: { card: "summary_large_image", title: niche.headline, description: "Explore a knowledge assistant concept and tell us what is useful—or missing." },
  };
}

export default async function ResearchPage({ params }: Props) {
  const niche = getResearchNiche((await params).slug);
  if (!niche) notFound();
  const feedback = `mailto:${contactEmail}?subject=${encodeURIComponent(`Research feedback: ${niche.name}`)}&body=${encodeURIComponent(`Hi Danny,\n\nThe questions our buyers ask before a quote:\n\nHow we answer those today:\n\nWhat would make this useful (or why it would not help):\n\n`)}`;
  return <main className="research-page">
    <div className="research-banner">A concept for feedback · No signup or sales call required</div>
    <header className="research-shell research-nav"><BrandMark /><a href="#feedback">Share your perspective <ArrowRight size={16} aria-hidden="true" /></a></header>
    <section className="research-hero"><div className="research-shell research-hero-grid"><div><p className="research-eyebrow">For {niche.audience}</p><h1>{niche.headline}</h1><p className="research-lede">{niche.description}</p><p className="research-position">Turn cold traffic into warm leads—with the right answers, fast.</p><a className="research-button" href="#example">Try the live assistant <ArrowDown size={18} aria-hidden="true" /></a><p className="research-hero-note">Your team’s knowledge. A more informed buyer. A better first conversation.</p></div><aside className="research-blueprint" aria-label="Knowledge assistant concept"><span className="research-eyebrow">The idea in three steps</span><div><BookOpen /><h2>Your knowledge</h2><p>Services, project guides, FAQs, and the experience your team approves.</p></div><div><MessageSquareText /><h2>Useful answers</h2><p>Help buyers understand your approach before they request a quote.</p></div><div><ArrowRight /><h2>A warmer handoff</h2><p>Your team gets the buyer’s questions, project context, and request to follow up.</p></div></aside></div></section>
    <section className="research-shell research-section research-example-grid" id="example"><div><p className="research-eyebrow">Before “send me a quote”</p><h2>Big decisions come with detailed questions.</h2><p>The idea is to make your team’s approved expertise easier to access. A buyer can understand your process and explore their options before starting a conversation with sales.</p><p>Ask your own question, add project details, then ask a follow-up. This live assistant answers from a fictional company’s sample knowledge base—the same conversation experience we configure around your business.</p></div><ResearchKnowledgeDemo niche={niche} /></section>
    <section className="research-knowledge"><div className="research-shell research-section research-columns"><div><p className="research-eyebrow">What goes into the knowledge base</p><h2>Built around what your buyers actually ask.</h2><ul>{niche.knowledge.map((item) => <li key={item}><Check aria-hidden="true" />{item}</li>)}</ul></div><div><p className="research-eyebrow">When they are ready to talk</p><h2>Give your team a useful starting point.</h2><ul>{niche.handoff.map((item) => <li key={item}><Check aria-hidden="true" />{item}</li>)}</ul><p className="research-small">Proposed inquiry details, for discussion. Your team would confirm project fit, technical requirements, availability, and final pricing.</p></div></div></section>
    <section className="research-shell research-section research-feedback" id="feedback"><div className="research-founder"><Image src="/danny.jpeg" alt="Danny Sullivan, founder of Snappy Leads" width={88} height={88} /><div><p className="research-eyebrow">A question from Danny</p><h2>Would this help—or miss the point?</h2></div></div><p>I’m Danny, the founder of Snappy Leads. I’m researching whether better answers before the quote would help specialist businesses and their customers. This page is a concept to react to, not a claim that we know your business.</p><blockquote>{niche.researchQuestion}</blockquote><p>I’d value a short reply about how you handle those questions today. If most inquiries come through existing relationships, or your current process already works well, that’s useful to hear too.</p><a className="research-button" href={feedback}>Email Danny your thoughts <ArrowRight size={18} aria-hidden="true" /></a><p className="research-small">Opens your email app. A sentence or two is plenty. No signup, demo booking, or purchase required.</p><a className="research-email" href={`mailto:${contactEmail}`}>{contactEmail}</a></section>
    <footer className="research-shell research-footer"><BrandMark /><span>Knowledge that supports your people.</span><nav aria-label="Footer"><Link href="/privacy">Privacy</Link><Link href="/">About Snappy Leads</Link></nav></footer>
  </main>;
}
