"use client";

import { useEffect, useState } from "react";
import {
  Check,
  MessageSquareText,
  PhoneMissed,
  RotateCcw,
} from "lucide-react";

const steps = [
  { label: "Call missed", icon: PhoneMissed },
  { label: "Text sent", icon: MessageSquareText },
  { label: "Lead replied", icon: Check },
];

export function AutoTextBackDemo() {
  const [activeStep, setActiveStep] = useState(2);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!isPlaying) return;

    const nextStep = window.setTimeout(() => {
      if (activeStep >= steps.length - 1) {
        setIsPlaying(false);
        return;
      }
      setActiveStep((step) => step + 1);
    }, 1150);

    return () => window.clearTimeout(nextStep);
  }, [activeStep, isPlaying]);

  function replay() {
    setActiveStep(0);
    setIsPlaying(true);
  }

  return (
    <div className="text-back-demo" aria-label="Example of an automatic missed-call text conversation">
      <div className="text-back-demo-bar">
        <div>
          <span className="text-back-demo-dot" />
          Example text conversation
        </div>
        <span>Tuesday · 6:42 PM</span>
      </div>

      <div className="text-back-demo-body">
        <div className="text-back-demo-timeline" aria-label="Text-back workflow stages">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isComplete = index <= activeStep;

            return (
              <button
                className={isComplete ? "complete" : ""}
                key={step.label}
                type="button"
                onClick={() => {
                  setIsPlaying(false);
                  setActiveStep(index);
                }}
                aria-pressed={activeStep === index}
              >
                <span><Icon aria-hidden="true" /></span>
                {step.label}
              </button>
            );
          })}
        </div>

        <div className="text-back-phone">
          <div className="text-back-phone-header">
            <span className="text-back-avatar">RLR</span>
            <div>
              <strong>Raleigh Lead Recovery</strong>
              <span>Text message · Just now</span>
            </div>
          </div>

          <div className="text-back-phone-screen" aria-live="polite">
            <div className="text-back-missed-call">
              <PhoneMissed aria-hidden="true" />
              <div>
                <strong>Missed call</strong>
                <span>6:42 PM · No voicemail</span>
              </div>
            </div>

            {activeStep >= 1 ? (
              <div className="text-back-bubble business">
                Hi, this is Oak City Heating &amp; Air. Sorry we missed your call.
                What can we help with? Reply here and our team will follow up.
                <span>Sent automatically · 6:42 PM</span>
              </div>
            ) : null}

            {activeStep >= 2 ? (
              <div className="text-back-bubble customer">
                Our upstairs AC stopped cooling. Can someone come tomorrow?
                <span>Customer · 6:43 PM</span>
              </div>
            ) : null}
          </div>
        </div>

        <div className={`text-back-demo-result ${activeStep >= 2 ? "visible" : ""}`}>
          <div>
            <span><Check aria-hidden="true" /></span>
            <div>
              <p>Lead recovered</p>
              <strong>No cooling · Appointment requested</strong>
            </div>
          </div>
          <span>Sent to owner</span>
        </div>

        <button className="text-back-replay" type="button" onClick={replay} disabled={isPlaying}>
          <RotateCcw aria-hidden="true" />
          {isPlaying ? "Playing recovery…" : "Replay the recovery"}
        </button>
        <p className="text-back-demo-caption">
          Illustrative demo. The wording and routing are customized to your business.
        </p>
      </div>
    </div>
  );
}
