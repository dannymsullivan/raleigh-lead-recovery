"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Check, Database, PhoneCall } from "lucide-react";

const stories = [
  {
    label: "Never reached",
    age: "Lead age · 94 days",
    name: "Sarah M.",
    source: "Water heater estimate",
    status: "Cold",
    opener: "Hi Sarah, I'm an automated calling assistant for Oak City Home Services following up on the water heater estimate you requested earlier this year. Did you ever get that project taken care of?",
    reply: "Not yet. We put it off, but we need to revisit it before fall.",
    outcome: "Appointment requested",
  },
  {
    label: "No decision",
    age: "Lead age · 167 days",
    name: "Marcus T.",
    source: "HVAC replacement inquiry",
    status: "Cold",
    opener: "Hi Marcus, I'm an automated calling assistant for Oak City Home Services. You spoke with the team about replacing your HVAC system earlier this year. Is that project still open?",
    reply: "Yes. We put it off, but the system is acting up again and I need someone to look at it.",
    outcome: "Qualified follow-up",
  },
  {
    label: "Service due",
    age: "Last service · 11 months ago",
    name: "Linda P.",
    source: "Annual HVAC tune-up",
    status: "Due soon",
    opener: "Hi Linda, I'm an automated calling assistant for Oak City Home Services. It’s been about a year since your last HVAC tune-up, and the team wanted to help you get ahead of the next season. Would you like to find a time for your annual service?",
    reply: "Yes, I’ve been meaning to schedule that. Do you have anything next week?",
    outcome: "Tune-up requested",
  },
  {
    label: "Limo quote",
    age: "Inquiry age · 23 days",
    name: "Erica W.",
    source: "Wedding transportation quote",
    status: "Open quote",
    opener: "Hi Erica, I'm an automated calling assistant for Triangle Executive Limo following up on the wedding transportation quote you requested for October. Are you still looking for a vehicle?",
    reply: "Yes. We finalized the guest count and I’m ready to look at the options again.",
    outcome: "Quote follow-up",
  },
  {
    label: "Seller lead",
    age: "Inquiry age · 48 days",
    name: "Carlos B.",
    source: "Property seller inquiry",
    status: "Went quiet",
    opener: "Hi Carlos, I'm an automated calling assistant for Oak City Property Group following up on your earlier property inquiry. Are you still open to talking through your options?",
    reply: "Yes. My timing changed, and I’d like someone to call me this week.",
    outcome: "Seller follow-up",
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
      <div className="story-tabs" role="tablist" aria-label="Example customer outreach scenarios">
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
          <span className="record-status">{story.status}</span>
        </div>

        <div className="recovery-connector"><span /><PhoneCall aria-hidden="true" /><span /></div>

        <div className="recovery-conversation">
          <div className="recovery-bubble agent-bubble"><span>Raleigh Lead Recovery · automated call</span><p>{story.opener}</p></div>
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
