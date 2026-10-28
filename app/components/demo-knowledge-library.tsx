"use client";

import { useEffect, useId, useState, useSyncExternalStore } from "react";
import { ArrowRight, BookOpen, ChevronDown, MessageSquareText, Search, X } from "lucide-react";
import { demoKnowledge, demoKnowledgeCategories, demoScenarios } from "@/lib/demo-knowledge";

function askDemo(question: string) {
  window.dispatchEvent(new CustomEvent("snappy-demo-question", { detail: { question } }));
  document.getElementById("try-chat")?.scrollIntoView({
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    block: "start",
  });
}

function KnowledgeArticleText({ content }: { content: string }) {
  return <div className="knowledge-article-text">{content.split(/\n\n+/).map((paragraph, paragraphIndex) => <p key={paragraphIndex}>{paragraph.split(/(\[[^\]]+\]\(https?:\/\/[^)]+\))/g).map((part, partIndex) => {
    const link = part.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/);
    return link ? <a key={partIndex} href={link[2]} target="_blank" rel="noreferrer">{link[1]}</a> : part;
  })}</p>)}</div>;
}

function subscribeToHash(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}

function currentHash() {
  return window.location.hash;
}

export function DemoScenarioCards({ limit, compact = false }: { limit?: number; compact?: boolean }) {
  const scenarios = limit ? demoScenarios.slice(0, limit) : demoScenarios;

  return <div className={`knowledge-scenarios${compact ? " is-compact" : ""}`}>
    {scenarios.map((scenario, index) => <article className="knowledge-scenario" key={scenario.id}>
      <div className="knowledge-scenario-heading"><span>0{index + 1}</span><h3>{scenario.label}</h3></div>
      <p className="knowledge-scenario-description">{scenario.description}</p>
      <blockquote>{scenario.prompt}</blockquote>
      <p className="knowledge-scenario-followup"><span>Then try a follow-up</span>“{scenario.followUp}”</p>
      <button type="button" onClick={() => askDemo(scenario.prompt)} aria-label={`Try the ${scenario.label} conversation`}>Try this conversation <ArrowRight aria-hidden="true" size={17} /></button>
    </article>)}
  </div>;
}

export function DemoKnowledgeLibrary() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All topics");
  const searchId = useId();
  const hash = useSyncExternalStore(subscribeToHash, currentHash, () => "");
  const linkedArticleId = hash.startsWith("#knowledge-") ? hash.slice("#knowledge-".length) : "";
  const linkedArticle = demoKnowledge.find((entry) => entry.id === linkedArticleId);
  const selectedCategory = demoKnowledgeCategories.find((item) => item.name === category);
  const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const entries = demoKnowledge.filter((entry) => {
    const categoryMatches = !selectedCategory || selectedCategory.ids.includes(entry.id);
    const text = `${entry.title} ${entry.content} ${entry.keywords}`.toLowerCase();
    return categoryMatches && terms.every((term) => text.includes(term));
  });

  useEffect(() => {
    if (!linkedArticle) return;
    document.getElementById(`knowledge-${linkedArticle.id}`)?.scrollIntoView({ block: "start" });
  }, [linkedArticle]);

  return <section className="knowledge-library page-shell" id="knowledge-library" aria-labelledby="knowledge-library-title">
    <div className="knowledge-library-heading">
      <div><p className="rlr-kicker">Open the playbook</p><h2 id="knowledge-library-title">See what it knows.</h2><p>These are the source articles behind this demo. Open one, read the specifics, and ask the assistant to explain how they apply.</p></div>
      <div className="knowledge-library-count"><strong>{demoKnowledge.length}</strong><span>source articles<br />ready to explore</span></div>
    </div>

    <div className="knowledge-search">
      <label htmlFor={searchId}>Search the demo knowledge base</label>
      <div><Search aria-hidden="true" size={21} /><input id={searchId} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try “membership”, “warranty”, or “diagnostic”" autoComplete="off" />{query ? <button type="button" aria-label="Clear search" onClick={() => setQuery("")}><X aria-hidden="true" size={18} /></button> : null}</div>
    </div>

    <div className="knowledge-library-grid">
      <div className="knowledge-category-list" role="group" aria-label="Filter knowledge by topic">
        <span className="knowledge-category-label">Browse by topic</span>
        <button type="button" aria-pressed={category === "All topics"} onClick={() => setCategory("All topics")}>All topics <span>{demoKnowledge.length}</span></button>
        {demoKnowledgeCategories.map((item) => <button type="button" key={item.name} aria-pressed={category === item.name} onClick={() => setCategory(item.name)}>{item.name}<span>{item.ids.length}</span></button>)}
      </div>

      <div className="knowledge-articles">
        <p className="knowledge-results" role="status">{entries.length} {entries.length === 1 ? "article" : "articles"}{category !== "All topics" ? ` in ${category}` : " across all topics"}{query ? ` matching “${query}”` : ""}</p>
        {entries.length ? entries.map((entry, index) => {
          const entryCategory = demoKnowledgeCategories.find((item) => item.ids.includes(entry.id));
          return <details className="knowledge-article" key={`${category}:${query}:${entry.id}`} id={`knowledge-${entry.id}`} open={linkedArticle ? entry.id === linkedArticle.id : index === 0}>
            <summary><span><small>{entryCategory?.name ?? "Business knowledge"}</small><strong>{entry.title}</strong></span><ChevronDown aria-hidden="true" size={21} /></summary>
            <div className="knowledge-article-body"><div className="knowledge-source"><BookOpen aria-hidden="true" size={14} /><span>Demo source · {entry.id}</span></div><KnowledgeArticleText content={entry.content} /><button type="button" onClick={() => askDemo(`Can you explain your ${entry.title.toLowerCase()}?`)}><MessageSquareText aria-hidden="true" size={16} />Ask the assistant about this <ArrowRight aria-hidden="true" size={16} /></button></div>
          </details>;
        }) : <div className="knowledge-empty"><BookOpen aria-hidden="true" size={28} /><h3>No articles match those filters.</h3><p>Try a shorter search or explore all topics.</p><button type="button" onClick={() => { setQuery(""); setCategory("All topics"); }}>Show all {demoKnowledge.length} articles <ArrowRight aria-hidden="true" size={17} /></button></div>}
      </div>
    </div>
  </section>;
}
