"use client";

import Image from "next/image";
import { ArrowDown, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const stops = [
  { selector: ".rlr-founder", title: "Meet your human", tip: "Danny handles setup. I handle the waving." },
  { selector: ".sales-problem", title: "Sound familiar?", tip: "Help customers get answers while your team is busy." },
  { selector: "#products", title: "Pick your front desk", tip: "Start with website chat. Add voice when you need it." },
  { selector: "#how-it-works", title: "Three easy steps", tip: "Share your business details. We set it up, and you test it." },
  { selector: "#outcomes", title: "Follow the lead", tip: "See the conversation, where it came from, and what happened next." },
  { selector: "#pricing", title: "Pick your coverage", tip: "Chat, voice, or both. Try website chat free for two weeks." },
  { selector: "#trial", title: "Ready when you are", tip: "Bring your questions. We’ll help with the setup." },
  { selector: "#questions", title: "A few good answers", tip: "Still curious? These are the questions people usually ask." },
] as const;

/** One guide follows the reader; navigation only happens on an explicit click. */
export function SalesGuide() {
  const [position, setPosition] = useState({ docked: false, stop: 0 });
  const [expanded, setExpanded] = useState(false);
  const [wide, setWide] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const hero = document.querySelector(".rlr-hero");
    const sections = stops.map((stop) => document.querySelector(stop.selector));
    let frame = 0;
    const update = () => {
      frame = 0;
      setWide(window.innerWidth >= 1500);
      let active = 0;
      sections.forEach((section, index) => {
        if (section && section.getBoundingClientRect().top <= window.innerHeight * .45) active = index;
      });
      const docked = !preference.matches && (hero?.getBoundingClientRect().bottom ?? 0) < 160;
      setPosition((current) => current.stop === active && current.docked === docked ? current : { stop: active, docked });
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    preference.addEventListener("change", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      preference.removeEventListener("change", schedule);
    };
  }, []);

  function visit(index: number) {
    const target = index < stops.length ? document.querySelector(stops[index].selector) : document.getElementById("try-chat");
    target?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" });
    setExpanded(false);
  }

  const mascot = <Image src="/illustrations/front-desk-mascot.png" alt="" width={160} height={146} sizes="(max-width: 1499px) 76px, 130px" />;
  if (!position.docked || dismissed) return <button className="sales-guide-home" aria-label="Start the page tour" title="Let me show you around" onClick={() => { setDismissed(false); visit(0); }}>{mascot}</button>;

  const stop = stops[position.stop];
  return createPortal(<aside className={`sales-guide sales-guide-position-${position.stop % 3}${expanded ? " is-expanded" : ""}`} aria-label="Page guide">
    <div className="sales-guide-bubble" id="sales-guide-tip">
      <button className="sales-guide-dismiss" aria-label="Dismiss page guide" onClick={() => setDismissed(true)}><X size={15} /></button>
      <span className="sales-guide-eyebrow">I’m Snappy. Let me show you around.</span>
      <strong>{stop.title}</strong><p>{stop.tip}</p>
      <button className="sales-guide-next" onClick={() => visit(position.stop + 1)}>{position.stop === stops.length - 1 ? "Back to the demo" : "Next stop"} <ArrowDown size={14} aria-hidden="true" /></button>
    </div>
    <button className="sales-guide-character" aria-label={wide ? "Go to the next section" : expanded ? "Hide guide tip" : "Show guide tip"} aria-expanded={wide ? undefined : expanded} aria-controls={wide ? undefined : "sales-guide-tip"} onClick={() => wide ? visit(position.stop + 1) : setExpanded((value) => !value)}>{mascot}<span>Need a hand?</span></button>
    <button className="sales-guide-small-dismiss" aria-label="Dismiss page guide" onClick={() => setDismissed(true)}><X size={13} /></button>
  </aside>, document.body);
}
