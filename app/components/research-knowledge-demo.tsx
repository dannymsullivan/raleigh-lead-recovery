"use client";

import { useState } from "react";
import { ArrowRight, BookOpen } from "lucide-react";
import { researchNiches, type ResearchNiche } from "@/lib/research-niches";

export function ResearchKnowledgeDemo({ niche }: { niche?: ResearchNiche }) {
  const [slug, setSlug] = useState(researchNiches[0].slug);
  const [questionIndex, setQuestionIndex] = useState(0);
  const selected = niche ?? researchNiches.find((item) => item.slug === slug)!;
  const example = selected.questions[questionIndex];

  return <div className="research-demo">
    <div className="research-demo-heading"><BookOpen aria-hidden="true" /><div><strong>Expertise, in conversation</strong><span>Illustrative preview · Sample company policies</span></div></div>
    {!niche && <label className="research-demo-select">Explore an industry<select value={slug} onChange={(event) => { setSlug(event.target.value); setQuestionIndex(0); }}>{researchNiches.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}</select></label>}
    <div className="research-question-list" aria-label="Choose an example buyer question">{selected.questions.map((item, index) => <button type="button" key={item.question} aria-pressed={questionIndex === index} onClick={() => setQuestionIndex(index)}>{item.question}<ArrowRight size={16} aria-hidden="true" /></button>)}</div>
    <div className="research-answer" aria-live="polite" aria-atomic="true"><p className="research-eyebrow">Example answer</p><p>{example.answer}</p><div className="research-source"><BookOpen size={15} aria-hidden="true" /><span>Sample knowledge: {example.source}</span></div></div>
    <p className="research-demo-note">Prewritten examples, not live AI or technical advice. Your assistant would use the information your team approves.</p>
  </div>;
}
