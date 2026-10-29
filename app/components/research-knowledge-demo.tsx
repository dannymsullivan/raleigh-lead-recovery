"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { ArrowUpDown, BookOpen, Check, ChevronDown, Layers, Paintbrush, Snowflake, Warehouse, Wind } from "lucide-react";
import { WebsiteChat } from "./website-chat";
import { researchNiches, type ResearchNiche } from "@/lib/research-niches";
import { getResearchDemo } from "@/lib/research-demo-knowledge";

const industryDetails = [
  { icon: Warehouse, detail: "Layouts, relocations & installation" },
  { icon: Layers, detail: "Project scope, testing & expansion" },
  { icon: Paintbrush, detail: "Equipment, site work & coordination" },
  { icon: Snowflake, detail: "Coolers, freezers & replacement projects" },
  { icon: Wind, detail: "System planning & application review" },
  { icon: ArrowUpDown, detail: "Home retrofits & builder coordination" },
];

function IndustryPicker({ value, onChange }: { value: string; onChange: (slug: string) => void }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const options = useRef<(HTMLButtonElement | null)[]>([]);
  const id = useId();
  const selectedIndex = researchNiches.findIndex((item) => item.slug === value);
  const selected = researchNiches[selectedIndex];
  const { icon: Icon, detail } = industryDetails[selectedIndex];

  useEffect(() => {
    if (!open) return;
    options.current[selectedIndex]?.focus();
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open, selectedIndex]);

  function choose(index: number) {
    onChange(researchNiches[index].slug);
    setOpen(false);
    trigger.current?.focus();
  }

  function navigate(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next: number | undefined;
    if (event.key === "ArrowDown") next = (index + 1) % researchNiches.length;
    if (event.key === "ArrowUp") next = (index + researchNiches.length - 1) % researchNiches.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = researchNiches.length - 1;
    if (next !== undefined) { event.preventDefault(); options.current[next]?.focus(); }
    if (event.key === "Escape") { event.preventDefault(); setOpen(false); trigger.current?.focus(); }
    if (event.key.length === 1 && /[a-z]/i.test(event.key)) {
      const match = researchNiches.findIndex((item) => item.name.toLowerCase().startsWith(event.key.toLowerCase()));
      if (match >= 0) { event.preventDefault(); options.current[match]?.focus(); }
    }
  }

  return <div className="industry-picker" ref={root} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
    <span className="industry-picker-label" id={`${id}-label`}>Try an industry’s live assistant</span>
    <button className="industry-picker-trigger" ref={trigger} type="button" aria-haspopup="listbox" aria-expanded={open} aria-controls={open ? `${id}-options` : undefined} aria-labelledby={`${id}-label ${id}-value`} onClick={() => setOpen(!open)} onKeyDown={(event) => { if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); setOpen(true); } }}>
      <span className="industry-picker-icon"><Icon size={21} aria-hidden="true" /></span>
      <span className="industry-picker-copy"><strong id={`${id}-value`}>{selected.name}</strong><small>{detail}</small></span>
      <span className="industry-picker-chevron"><ChevronDown size={18} aria-hidden="true" /></span>
    </button>
    {open && <div className="industry-picker-panel"><div className="industry-picker-panel-heading"><span>Choose your demo</span><span>06 industries</span></div><div role="listbox" id={`${id}-options`} aria-labelledby={`${id}-label`} className="industry-picker-options">{researchNiches.map((item, index) => {
      const { icon: OptionIcon, detail: optionDetail } = industryDetails[index];
      return <button key={item.slug} ref={(element) => { options.current[index] = element; }} className="industry-picker-option" role="option" aria-selected={value === item.slug} type="button" tabIndex={-1} onClick={() => choose(index)} onKeyDown={(event) => navigate(event, index)}>
        <span className="industry-picker-icon"><OptionIcon size={19} aria-hidden="true" /></span><span className="industry-picker-copy"><strong>{item.name}</strong><small>{optionDetail}</small></span><span className="industry-picker-check">{value === item.slug && <Check size={17} aria-hidden="true" />}</span>
      </button>;
    })}</div></div>}
  </div>;
}

export function ResearchKnowledgeDemo({ niche }: { niche?: ResearchNiche }) {
  const [slug, setSlug] = useState(researchNiches[0].slug);
  const selected = niche ?? researchNiches.find((item) => item.slug === slug)!;
  const demo = getResearchDemo(selected.slug)!;
  return <div className="research-demo research-demo-live">
    {!niche && <IndustryPicker value={slug} onChange={setSlug} />}
    <WebsiteChat key={selected.slug} businessName={demo.name} researchSlug={selected.slug} />
    <details className="research-live-library" id={`research-knowledge-${selected.slug}`}><summary><BookOpen size={16} aria-hidden="true" /> Read the sample knowledge base · {demo.knowledge.length} topics</summary><p>These fictional company policies power the live conversation. Your assistant would use your own approved information.</p>{demo.knowledge.map((entry) => <details id={`knowledge-${entry.id}`} key={entry.id}><summary>{entry.title}</summary><p>{entry.content}</p></details>)}</details>
  </div>;
}
