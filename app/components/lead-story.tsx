"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Check, Database, PhoneCall } from "lucide-react";

const stories = [
  {
    label: "Never reached",
    age: "Lead age · 94 days",
    name: "Sarah M.",
    source: "Roof replacement estimate",
    opener: "Hi Sarah, this is Mabel calling for Oak City Roofing about the roof estimate you requested earlier this year. Did you ever get that project taken care of?",
    reply: "Not yet. We put it off, but we need to revisit it before fall.",
    outcome: "Inspection requested",
  },
  {
    label: "No decision",
    age: "Lead age · 167 days",
    name: "Marcus T.",
    source: "Storm damage inquiry",
    opener: "Hi Marcus, this is Mabel calling for Oak City Roofing. You spoke with the team after a storm earlier this year. Is the roof work still unresolved?",
    reply: "Yes. I have the insurance paperwork now and need someone to look at it again.",
    outcome: "Qualified follow-up",
  },
  {
    label: "Went quiet",
    age: "Lead age · 61 days",
    name: "Jamie R.",
    source: "Online estimate request",
    opener: "Hi Jamie, this is Mabel calling for Oak City Roofing about your earlier estimate request. Is a roof replacement still something you're considering?",
    reply: "It is. I got busy and never scheduled the inspection.",
    outcome: "Inspection requested",
  },
];

export function LeadStory() {
  const [active, setActive] = useState(0);
  const story = stories[active];

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setActive((current) => (current + 1) % stories.length), 7500);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="recovery-story-wrap">
      <div className="recovery-story-label"><span>Example lead journey</span><span>Sample data</span></div>
      <div className="story-tabs" role="tablist" aria-label="Example old lead scenarios">
        {stories.map((item, index) => (
          <button
            aria-selected={index === active}
            className={index === active ? "active" : ""}
            key={item.label}
            onClick={() => setActive(index)}
            role="tab"
            type="button"
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="recovery-story-card" key={story.label}>
        <div className="recovery-record">
          <div className="recovery-record-icon"><Database aria-hidden="true" /></div>
          <div><span>{story.age}</span><strong>{story.name}</strong><p>{story.source}</p></div>
          <span className="record-status">Cold</span>
        </div>

        <div className="recovery-connector"><span /><PhoneCall aria-hidden="true" /><span /></div>

        <div className="recovery-conversation">
          <div className="recovery-bubble mabel-bubble"><span>Mabel · AI calling agent</span><p>{story.opener}</p></div>
          <div className="recovery-bubble lead-bubble"><span>{story.name}</span><p>{story.reply}</p></div>
        </div>

        <div className="recovery-outcome">
          <span><Check aria-hidden="true" /> Interest recovered</span>
          <strong>{story.outcome} <ArrowRight aria-hidden="true" /></strong>
        </div>
      </div>
    </div>
  );
}
