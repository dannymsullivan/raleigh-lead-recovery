"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { ArrowRight, Check, LoaderCircle, PhoneIncoming, ShieldCheck } from "lucide-react";
import posthog from "posthog-js";
import { PUBLIC_DEMO_CONSENT_TEXT } from "@/lib/public-demo-call";

type FormState = "idle" | "submitting" | "success" | "error";

export function DemoCallForm({ bookingUrl }: { bookingUrl: string }) {
  const [state, setState] = useState<FormState>("idle");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setState("submitting");
    setMessage("");
    posthog.capture("demo_call_submitted", { location: "homepage_live_demo" });

    try {
      const response = await fetch("/api/demo-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          businessName: data.get("businessName"),
          phone: data.get("phone"),
          consent: data.get("consent") === "yes",
          website: data.get("website")
        })
      });
      const result = await response.json() as { ok?: boolean; message?: string; error?: string };
      if (!response.ok || !result.ok) throw new Error(result.error || "The demo call could not be started.");
      setState("success");
      setMessage(result.message || "Mabel is calling now. It may take up to a minute.");
      posthog.capture("demo_call_started", { location: "homepage_live_demo" });
      form.reset();
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "The demo call could not be started.");
      posthog.capture("demo_call_failed", { location: "homepage_live_demo" });
    }
  }

  return (
    <section className="demo-call-section page-shell" id="try-mabel" aria-labelledby="try-mabel-heading">
      <div className="demo-call-copy">
        <p className="eyebrow"><span /> Lead recovery for growing North Carolina businesses</p>
        <h1 id="try-mabel-heading">Turn old leads into <em>new business.</em></h1>
        <p>You already paid to generate the leads. Mabel follows up with old and unresponsive prospects and past customers, finds the ones who are still interested, and sends qualified opportunities back to your team. Try the real experience on your own phone before sharing a lead.</p>
        <div className="demo-call-expectation">
          <PhoneIncoming aria-hidden="true" />
          <div><strong>Hear the real conversation.</strong><span>Mabel uses your name and business name in a one-time personalized call.</span></div>
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
              data-analytics-location="homepage_live_demo_success"
            >
              Book a 15-minute setup call <ArrowRight aria-hidden="true" />
            </a>
            <span className="demo-call-next-note"><Check aria-hidden="true" /> Start with an approved CSV. No CRM replacement required.</span>
          </div>
        ) : <>
        <div className="demo-call-form-heading">
          <span>01</span>
          <div><p>Try Mabel now</p><strong>Live calls: weekdays, noon–7 PM ET</strong></div>
        </div>
        <label>
          Your name
          <input name="name" type="text" autoComplete="name" maxLength={70} required placeholder="Alex Morgan" />
        </label>
        <label>
          Business Mabel is calling for
          <input name="businessName" type="text" autoComplete="organization" maxLength={100} required placeholder="Acme Property Group" />
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
          {state === "submitting" ? <><LoaderCircle className="demo-call-spinner" aria-hidden="true" /> Starting call…</> : <>Call me as the lead <ArrowRight aria-hidden="true" /></>}
        </button>
        <p className={`demo-call-status ${state}`} aria-live="polite">
          {message}
        </p>
        </>}
      </form>
    </section>
  );
}
