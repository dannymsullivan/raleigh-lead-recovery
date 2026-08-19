"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { ArrowRight, Check, Footprints, LoaderCircle, PhoneIncoming, ShieldCheck } from "lucide-react";
import posthog from "posthog-js";
import { DemoType, PUBLIC_DEMO_CONSENT_TEXT } from "@/lib/public-demo-call";

type FormState = "idle" | "submitting" | "success" | "error";

const demoOptions: Array<{ value: DemoType; label: string; detail: string }> = [
  { value: "hvac", label: "HVAC", detail: "Estimate or tune-up" },
  { value: "plumbing", label: "Plumbing", detail: "Repair or project" },
  { value: "roofing", label: "Roofing", detail: "Repair or replacement" },
  { value: "real_estate", label: "Real estate", detail: "Buyer, seller, or investor" },
  { value: "home_services", label: "Home services", detail: "General inquiry" },
  { value: "events", label: "Events", detail: "Photo booth, limo, or service" }
];

const demoBusinessNames: Record<DemoType, string> = {
  general: "Oak City Services",
  hvac: "Oak City Heating & Air",
  plumbing: "Oak City Plumbing",
  roofing: "Oak City Roofing",
  real_estate: "Oak City Real Estate",
  home_services: "Oak City Home Services",
  events: "Oak City Events"
};

export function DemoCallForm({ bookingUrl, analyticsLocation = "homepage_live_demo", handout = false, initialDemoType = "general" }: { bookingUrl: string; analyticsLocation?: string; handout?: boolean; initialDemoType?: DemoType }) {
  const [state, setState] = useState<FormState>("idle");
  const [message, setMessage] = useState("");
  const [demoType, setDemoType] = useState<DemoType>(initialDemoType);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setState("submitting");
    setMessage("");
    posthog.capture("demo_call_submitted", { location: analyticsLocation, demo_type: demoType });

    try {
      const response = await fetch("/api/demo-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          businessName: demoBusinessNames[demoType],
          phone: data.get("phone"),
          demoType,
          consent: data.get("consent") === "yes",
          website: data.get("website")
        })
      });
      const result = await response.json() as { ok?: boolean; message?: string; error?: string };
      if (!response.ok || !result.ok) throw new Error(result.error || "The demo call could not be started.");
      setState("success");
      setMessage(result.message || "Mabel is calling now. It may take up to a minute.");
      posthog.capture("demo_call_started", { location: analyticsLocation, demo_type: demoType });
      form.reset();
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "The demo call could not be started.");
      posthog.capture("demo_call_failed", { location: analyticsLocation, demo_type: demoType });
    }
  }

  return (
    <section className={`demo-call-section page-shell ${handout ? "demo-call-section-handout" : ""}`} id="try-mabel" aria-labelledby="try-mabel-heading">
      <div className="demo-call-copy">
        <p className="eyebrow"><span /> {handout ? "A live, industry-tuned phone demo" : "Lead recovery for growing North Carolina businesses"}</p>
        <h1 id="try-mabel-heading">{handout ? <>Hear Mabel call you—<em>live.</em></> : <>Turn old leads into <em>new business.</em></>}</h1>
        <p>{handout ? "Choose your business type, then enter your name and number. The right version of Mabel will call as if you were one of that business's old leads." : "You already paid to generate the leads. Mabel follows up with old and unresponsive prospects and past customers, finds the ones who are still interested, and sends qualified opportunities back to your team. Hear the real experience on your own phone."}</p>
        <div className="demo-call-expectation">
          <PhoneIncoming aria-hidden="true" />
          <div><strong>Hear the real conversation.</strong><span>Mabel uses your name, business, and selected industry in a one-time lead follow-up call.</span></div>
        </div>
        <div className="demo-call-expectation">
          <ShieldCheck aria-hidden="true" />
          <div><strong>No lead list required.</strong><span>This test calls only the number you enter and does not start a campaign.</span></div>
        </div>
      </div>

      <form className={`demo-call-form ${state === "success" ? "demo-call-form-success" : ""}`} id="try-mabel-form" onSubmit={submit}>
        {state === "success" ? (
          <div className="demo-call-next-step">
            <span className="demo-call-success-icon"><PhoneIncoming aria-hidden="true" /></span>
            <p className="eyebrow">Your demo is on the way</p>
            <h3>Like what you hear? Try Mabel on 25 real leads.</h3>
            <p>{message} The next step is a short setup call to map Mabel to your lead source, sales process, and handoff rules.</p>
            <div className="demo-call-offer" aria-label="Starter trial details">
              <span><strong>25</strong> eligible leads</span>
              <span><strong>14 days</strong> to test</span>
              <span><strong>$0</strong> setup fee</span>
            </div>
            <a
              className="demo-call-submit"
              href={bookingUrl}
              target="_blank"
              rel="noreferrer"
              data-analytics-event="post_demo_fit_call_clicked"
              data-analytics-location={`${analyticsLocation}_success`}
            >
              Book a 15-minute setup call <ArrowRight aria-hidden="true" />
            </a>
            <span className="demo-call-next-note"><Check aria-hidden="true" /> Start with an approved CSV. No CRM replacement required.</span>
          </div>
        ) : <>
        <div className="demo-call-form-heading">
          <span><Footprints aria-hidden="true" /></span>
          <div><p>Try Mabel now</p><strong>Put yourself in your customer&apos;s shoes.</strong><small>One-time live phone demo</small></div>
        </div>
        <fieldset className="demo-type-picker">
          <legend>Choose your business type</legend>
          <div className="demo-type-options">
            {demoOptions.map((option) => (
              <label key={option.value} className={demoType === option.value ? "selected" : ""}>
                <input type="radio" name="demoType" value={option.value} checked={demoType === option.value} onChange={() => setDemoType(option.value)} />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <label>
          First name
          <input name="name" type="text" autoComplete="given-name" maxLength={70} required placeholder="Alex" />
        </label>
        <label>
          Number Mabel should call
          <input name="phone" type="tel" autoComplete="tel" inputMode="tel" required placeholder="(919) 555-0123" />
        </label>
        <label className="demo-call-honeypot" aria-hidden="true">
          Website
          <input name="website" type="text" tabIndex={-1} autoComplete="off" />
        </label>
        <label className="demo-call-consent">
          <input name="consent" type="checkbox" value="yes" required />
          <span>{PUBLIC_DEMO_CONSENT_TEXT} See our <Link href="/terms">Terms</Link> and <Link href="/privacy">Privacy Policy</Link>.</span>
        </label>
        <button className="demo-call-submit" type="submit" disabled={state === "submitting"}>
          {state === "submitting" ? <><LoaderCircle className="demo-call-spinner" aria-hidden="true" /> Starting call…</> : <>Call me <ArrowRight aria-hidden="true" /></>}
        </button>
        <p className={`demo-call-status ${state}`} aria-live="polite">
          {message}
        </p>
        </>}
      </form>
    </section>
  );
}
