"use client";

import { useState } from "react";
import { BookOpen } from "lucide-react";
import { WebsiteChat } from "./website-chat";
import { researchNiches, type ResearchNiche } from "@/lib/research-niches";
import { getResearchDemo } from "@/lib/research-demo-knowledge";

export function ResearchKnowledgeDemo({ niche }: { niche?: ResearchNiche }) {
  const [slug, setSlug] = useState(researchNiches[0].slug);
  const selected = niche ?? researchNiches.find((item) => item.slug === slug)!;
  const demo = getResearchDemo(selected.slug)!;
  return <div className="research-demo research-demo-live">
    {!niche && <label className="research-demo-select">Try an industry’s live assistant<select value={slug} onChange={(event) => setSlug(event.target.value)}>{researchNiches.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}</select></label>}
    <WebsiteChat key={selected.slug} businessName={demo.name} researchSlug={selected.slug} />
    <details className="research-live-library" id={`research-knowledge-${selected.slug}`}><summary><BookOpen size={16} aria-hidden="true" /> Read the sample knowledge base · {demo.knowledge.length} topics</summary><p>These fictional company policies power the live conversation. Your assistant would use your own approved information.</p>{demo.knowledge.map((entry) => <details id={`knowledge-${entry.id}`} key={entry.id}><summary>{entry.title}</summary><p>{entry.content}</p></details>)}</details>
  </div>;
}
