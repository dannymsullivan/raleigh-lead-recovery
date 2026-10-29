"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import posthog from "posthog-js";
import { contactEmail } from "@/lib/contact";
import { pilotLeadSources, pilotTrafficLevels, pilotUtmKeys } from "@/lib/hvac-pilot";

function track(event: string) {
  if (process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN?.trim()) {
    try { posthog.capture(event, { offer: "raleigh_hvac_pilot", location: "raleigh-pilot" }); } catch { /* Analytics must never block an application. */ }
  }
}

export function HvacPilotForm() {
  const submissionId = useRef<string | null>(null);
  const started = useRef(false);
  const submitting = useRef(false);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    const form = new FormData(event.currentTarget);
    submissionId.current ??= crypto.randomUUID();
    submitting.current = true;
    setBusy(true); setError("");
    try {
      const params = new URLSearchParams(window.location.search);
      const response = await fetch("/api/trial-request", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.get("name"), business: form.get("business"), email: form.get("email"), website: form.get("website"),
          fax: form.get("fax"), consent: form.get("consent") === "on", submissionId: submissionId.current, offer: "raleigh_hvac_pilot",
          pilot: { serviceArea: form.get("serviceArea"), leadSource: form.get("leadSource"), traffic: form.get("traffic"),
            responseGap: form.get("responseGap"), followUpOwner: form.get("followUpOwner"), participation: form.get("participation") === "on", pricing: form.get("pricing") === "on",
            attribution: Object.fromEntries(pilotUtmKeys.map(key => [key, (params.get(key) || "").slice(0, 80)])) } }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Your application couldn’t be saved. Please try again.");
      setSent(true);
      track("hvac_pilot_application_submitted");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Your application couldn’t be saved. Please try again."); }
    finally { submitting.current = false; setBusy(false); }
  }

  if (sent) return <div className="trial-form trial-form-success pilot-success" role="status" aria-live="polite"><CheckCircle2 size={40} aria-hidden="true" /><h3>Your application is in.</h3><p>Danny will review your website and email you about a short fit call. Applying doesn’t reserve a place or start paid service.</p><p>If selected, your three free months start when your chatbot goes live.</p><Link className="rlr-inline-link" href="/dashboard-demo">Explore the lead dashboard <ArrowRight aria-hidden="true" /></Link></div>;

  return <form className="trial-form pilot-form ph-no-capture" aria-label="Apply for the Raleigh HVAC pilot" onSubmit={submit} onFocus={() => {
    if (!started.current) { started.current = true; track("hvac_pilot_application_started"); }
  }}>
    <div className="trial-form-heading"><span>RALEIGH HVAC PILOT</span><h3>Tell us about your shop.</h3><p>We’ll review fit together. No card required.</p></div>
    <div className="trial-form-fields">
      <label>Your name<input name="name" required maxLength={100} autoComplete="name" /></label>
      <label>HVAC business name<input name="business" required maxLength={160} autoComplete="organization" /></label>
      <label>Email<input name="email" type="email" required maxLength={200} autoComplete="email" /></label>
      <label>Website<input name="website" required maxLength={500} inputMode="url" autoComplete="url" placeholder="yourbusiness.com" /></label>
      <label className="trial-form-wide">Which Triangle communities do you serve?<input name="serviceArea" required maxLength={120} placeholder="Raleigh, Cary, Apex…" /></label>
      <label>Where do you pay for leads?<select name="leadSource" required defaultValue=""><option value="" disabled>Select a source</option>{pilotLeadSources.map(value => <option key={value}>{value}</option>)}</select></label>
      <label>Monthly website visits<select name="traffic" required defaultValue=""><option value="" disabled>Choose an estimate</option>{pilotTrafficLevels.map(value => <option key={value}>{value}</option>)}</select></label>
      <label className="trial-form-wide">What happens to website inquiries when you’re busy or closed?<textarea name="responseGap" required maxLength={300} rows={3} placeholder="Forms wait until morning, the office handles repeated questions…" /></label>
      <label className="trial-form-wide">Who would follow up with new leads?<input name="followUpOwner" required maxLength={100} placeholder="Me, our office manager, our dispatcher…" /></label>
    </div>
    <div className="trial-form-trap" aria-hidden="true"><label>Leave this blank<input name="fax" tabIndex={-1} autoComplete="off" /></label></div>
    <label className="trial-form-consent"><input name="participation" type="checkbox" required /><span>We have capacity for more HVAC work. I can approve website setup and will help review business information and results each month.</span></label>
    <label className="trial-form-consent"><input name="pricing" type="checkbox" required /><span>I understand the pilot includes 1,000 AI replies per month for three months. Continuing afterward is $399/month at the same allowance, only if we choose to continue.</span></label>
    <label className="trial-form-consent"><input name="consent" type="checkbox" required /><span>Danny can email me about this application. <Link href="/privacy">Privacy policy</Link></span></label>
    {error && <p className="trial-form-error" role="alert">{error} You can also <a href={`mailto:${contactEmail}`}>email Danny</a>.</p>}
    <button className="rlr-button rlr-button-primary" disabled={busy} type="submit">{busy ? "Sending application…" : "Apply for the pilot"}<ArrowRight aria-hidden="true" /></button>
    <p className="trial-form-note">Selection follows a fit call. No automatic charges.</p>
  </form>;
}
