"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { useRef, useState } from "react";
import { contactEmail } from "@/lib/contact";

export function TrialRequestForm() {
  const submissionId = useRef<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = new FormData(event.currentTarget);
    submissionId.current ??= crypto.randomUUID();
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/trial-request", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...Object.fromEntries(form), consent: form.get("consent") === "on", submissionId: submissionId.current }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Your request couldn’t be saved. Please try again.");
      setSent(true);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Your request couldn’t be saved. Please try again."); }
    finally { setBusy(false); }
  }

  if (sent) return <div className="trial-form trial-form-success" role="status"><CheckCircle2 size={38} aria-hidden="true" /><h3>Your request has been received.</h3><p>Danny will email you to get your setup started. Your two-week trial begins when your chatbot is ready to go live.</p><Link className="rlr-inline-link" href="/dashboard-demo">Preview the customer dashboard <ArrowRight aria-hidden="true" /></Link></div>;

  return <form className="trial-form" onSubmit={submit} aria-label="Request your two-week free trial">
    <div className="trial-form-heading"><span>14-DAY WEBSITE CHAT TRIAL</span><h3>Request your free trial.</h3><p>Tell us where to reach you and what your business needs.</p></div>
    <div className="trial-form-fields">
      <label>Your name<input name="name" autoComplete="name" required maxLength={100} /></label>
      <label>Business name<input name="business" autoComplete="organization" required maxLength={160} /></label>
      <label className="trial-form-wide">Email<input name="email" type="email" autoComplete="email" required maxLength={200} /></label>
      <label className="trial-form-wide">Website <span>(optional)</span><input name="website" inputMode="url" autoComplete="url" placeholder="yourbusiness.com" maxLength={500} /></label>
      <label className="trial-form-wide">What would you like help with?<textarea name="needs" required rows={3} maxLength={2000} placeholder="Answering questions, capturing leads, following up…" /></label>
    </div>
    <div className="trial-form-trap" aria-hidden="true"><label>Leave this blank<input name="fax" tabIndex={-1} autoComplete="off" /></label></div>
    <label className="trial-form-consent"><input name="consent" type="checkbox" required /> <span>Danny can email me about my trial request. <Link href="/privacy">Privacy policy</Link></span></label>
    {error ? <p className="trial-form-error" role="alert">{error} You can also <a href={`mailto:${contactEmail}`}>email Danny</a>.</p> : null}
    <button className="rlr-button rlr-button-primary" type="submit" disabled={busy}>{busy ? "Sending your request…" : "Request my free trial"} <ArrowRight aria-hidden="true" /></button>
    <p className="trial-form-note">No card required. Your trial starts after setup.</p>
  </form>;
}
