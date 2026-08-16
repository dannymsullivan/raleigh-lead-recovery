"use client";

import { useEffect, useState } from "react";
import { Check, Moon, Sparkles } from "lucide-react";

const stories = [
  {
    label: "Plumbing",
    time: "10:47 PM",
    customer: "My water heater is leaking. Can someone come tomorrow?",
    question: "I can help with that. What’s the service address?",
    answer: "Address received · active leak · shutoff located",
    response: "I can reserve the 8–10 AM window tomorrow. Does that work?",
    booked: "Tomorrow · 8–10 AM",
  },
  {
    label: "HVAC",
    time: "8:26 PM",
    customer: "Our upstairs AC stopped working. How soon can you come?",
    question: "I’m sorry you’re dealing with that. What’s the property address?",
    answer: "Address received · no cooling upstairs · system running",
    response: "I have an arrival window tomorrow morning or afternoon. Which is better?",
    booked: "Tomorrow morning",
  },
  {
    label: "Roofing",
    time: "6:14 AM",
    customer: "A branch hit our roof and water is coming in.",
    question: "I’ll mark this urgent. Is everyone safe, and what’s the address?",
    answer: "Address received · active leak · storm damage",
    response: "The emergency team can call you by 7 AM and prioritize the inspection.",
    booked: "Urgent callback queued",
  },
  {
    label: "Exterior",
    time: "9:38 PM",
    customer: "How much to clean the gutters on my house?",
    question: "Happy to help. What’s the property address?",
    answer: "Address received · two-story home · 2,100 sq ft",
    response: "This should be about $179–$219. I can reserve Tuesday or Thursday.",
    booked: "Thursday reserved",
  },
];

export function LeadStory() {
  const [active, setActive] = useState(0);
  const story = stories[active];

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setActive((current) => (current + 1) % stories.length), 7000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="story-wrap">
      <div className="story-tabs" role="tablist" aria-label="Example lead scenarios">
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

      <div className="story-card" key={story.label}>
        <div className="story-header">
          <span><Moon aria-hidden="true" /> Lead arrives · {story.time}</span>
          <span className="live-status">Mabel answered</span>
        </div>
        <div className="conversation">
          <div className="message customer-message"><span>Customer</span><p>{story.customer}</p></div>
          <div className="message mabel-message"><span><Sparkles aria-hidden="true" /> Mabel</span><p>{story.question}</p></div>
          <div className="signal"><Check aria-hidden="true" /> {story.answer}</div>
          <div className="message mabel-message"><span><Sparkles aria-hidden="true" /> Mabel</span><p>{story.response}</p></div>
        </div>
        <div className="booked-row"><span><Check aria-hidden="true" /> Booked</span><strong>{story.booked}</strong></div>
      </div>

      <div className="competitor-note"><span>7:00 AM · Your competitor</span><strong>New lead · 8 hours old</strong></div>
    </div>
  );
}
