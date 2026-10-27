"use client";

import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, BriefcaseBusiness, Check, Clock3, Database } from "lucide-react";
import { completeOnboardingAction } from "../auth-actions";
import type { Client } from "@/lib/types";
import { industryKeyForTrade, industryOptions, industryPresets, type IndustryKey } from "@/lib/industry-presets";

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const stepContent = [
  { icon: BriefcaseBusiness, label: "Your business", description: "The basics Snappy Leads needs to greet callers correctly." },
  { icon: Database, label: "What you do", description: "Services and coverage, so Snappy Leads can qualify callers." },
  { icon: Clock3, label: "Hours & rules", description: "When to answer, what is urgent, and where alerts go." }
];

export function OnboardingForm({ client, email, error }: { client: Client; email: string; error: string | null }) {
  const [step, setStep] = useState(1);
  const formRef = useRef<HTMLFormElement>(null);
  const initialIndustry = industryKeyForTrade(client.trade === "service business" ? "" : client.trade);
  const initialPreset = initialIndustry === "other" ? null : industryPresets[initialIndustry];
  const [industry, setIndustry] = useState<IndustryKey>(initialIndustry);
  const [services, setServices] = useState(client.services?.join("\n") || initialPreset?.services || "");
  const [businessDescription, setBusinessDescription] = useState(client.business_description || initialPreset?.description || "");
  const [emergencyRules, setEmergencyRules] = useState(client.emergency_rules || initialPreset?.emergencyRules || "");

  function chooseIndustry(nextIndustry: IndustryKey) {
    setIndustry(nextIndustry);
    if (nextIndustry === "other") return;
    const preset = industryPresets[nextIndustry];
    setServices(preset.services);
    setBusinessDescription(preset.description);
    setEmergencyRules(preset.emergencyRules);
  }

  function nextStep() {
    const activeStep = formRef.current?.querySelector(`[data-onboarding-step="${step}"]`) ?? null;
    if (!reportStepValidity(activeStep)) return;
    setStep((current) => Math.min(3, current + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function previousStep() {
    setStep((current) => Math.max(1, current - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="mx-auto grid max-w-6xl lg:grid-cols-[300px_1fr]">
      <aside className="border-b-2 border-black px-5 py-8 sm:px-8 lg:min-h-[calc(100vh-82px)] lg:border-b-0 lg:border-r-2 lg:py-12">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-black/45">Quick setup</p>
        <h1 className="mt-4 text-4xl font-black leading-[0.95] tracking-[-0.055em]">Set up Snappy Leads.</h1>
        <p className="mt-5 text-sm font-semibold leading-6 text-black/55">Three short steps. Nothing technical. You can change all of this later.</p>

        <ol className="mt-9 grid gap-3 lg:mt-14">
          {stepContent.map((item, index) => {
            const number = index + 1;
            const Icon = item.icon;
            const active = number === step;
            const complete = number < step;
            return (
              <li className={`flex items-center gap-3 border-2 p-3 transition-colors ${active ? "border-black bg-black text-white" : "border-transparent"}`} key={item.label}>
                <span className={`grid h-8 w-8 flex-none place-items-center rounded-full border-2 ${active ? "border-white" : "border-black"}`}>
                  {complete ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </span>
                <div><p className="text-sm font-black">{item.label}</p><p className={`mt-0.5 hidden text-[10px] font-semibold lg:block ${active ? "text-white/55" : "text-black/40"}`}>{item.description}</p></div>
              </li>
            );
          })}
        </ol>
      </aside>

      <section className="px-5 py-10 sm:px-10 sm:py-14 lg:px-16">
        <div className="mx-auto max-w-2xl">
          <div className="mb-9 flex items-center gap-2">
            {[1, 2, 3].map((number) => <span className={`h-1.5 flex-1 ${number <= step ? "bg-black" : "bg-black/12"}`} key={number} />)}
          </div>

          {error ? <p className="mb-7 border-2 border-black bg-black p-4 text-sm font-bold text-white">{error === "missing" ? "Add the required business details before finishing setup." : error === "consent" ? "Confirm permission to send transactional lead alerts to the alert number." : "We could not save the workspace. Please try again."}</p> : null}

          <form action={completeOnboardingAction} ref={formRef}>
            <div className={step === 1 ? "block" : "hidden"} data-onboarding-step="1">
              <StepHeading eyebrow="Step 1 of 3" title="First, who are we answering for?" body="This is how Snappy Leads introduces the business and how we identify your workspace." />
              <div className="mt-9 grid gap-5 sm:grid-cols-2">
                <Field label="Business name" name="business_name" defaultValue={client.business_name === "New workspace" ? "" : client.business_name} autoComplete="organization" required />
                <Field label="Your name" name="owner_name" defaultValue={client.owner_name} autoComplete="name" required />
                <Field label="Business phone" name="owner_phone" type="tel" defaultValue={client.owner_phone === "Not set" ? "" : client.owner_phone} autoComplete="tel" required />
                <label className="block text-sm font-black">Business type
                  <select className="mt-2 h-13 w-full border-2 border-black bg-white px-4 font-semibold outline-none focus:shadow-[5px_5px_0_#000]" name="trade_category" value={industry} onChange={(event) => chooseIndustry(event.target.value as IndustryKey)} required>
                    {industryOptions.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
                  </select>
                </label>
                {industry === "other" ? <Field label="What kind of business?" name="other_trade" placeholder="Tell us what you do" defaultValue={initialIndustry === "other" && client.trade !== "service business" ? client.trade : ""} required /> : null}
                <Field label="Service area" name="service_area" placeholder="Cities, regions, or ZIP codes…" defaultValue={client.service_area ?? ""} required />
                <Field label="Account email" name="account_email" type="email" defaultValue={email} disabled />
              </div>
            </div>

            <div className={step === 2 ? "block" : "hidden"} data-onboarding-step="2">
              <StepHeading eyebrow="Step 2 of 3" title="What should Snappy Leads know?" body="Plain English is perfect. This becomes the starting point for customer conversations." />
              <div className="mt-9 grid gap-6">
                <label className="block text-sm font-black">Your services <span className="font-semibold text-black/40">· one per line or separated by commas</span>
                  <textarea className="mt-2 min-h-44 w-full border-2 border-black bg-white p-4 font-semibold leading-7 outline-none focus:shadow-[5px_5px_0_#000]" name="services" placeholder={"Emergency repairs\nWater heater installation\nDrain cleaning"} value={services} onChange={(event) => setServices(event.target.value)} />
                </label>
                <label className="block text-sm font-black">Describe the business in a sentence
                  <textarea className="mt-2 min-h-28 w-full border-2 border-black bg-white p-4 font-semibold leading-7 outline-none focus:shadow-[5px_5px_0_#000]" name="business_description" placeholder="Family-owned plumbing company offering residential repairs and installations." value={businessDescription} onChange={(event) => setBusinessDescription(event.target.value)} />
                </label>
              </div>
            </div>

            <div className={step === 3 ? "block" : "hidden"} data-onboarding-step="3">
              <StepHeading eyebrow="Step 3 of 3" title="When are you open—and what can’t wait?" body="Snappy Leads uses this to set honest expectations and flag the calls that need attention now." />
              <div className="mt-9 border-l-2 border-t-2 border-black">
                {days.map((day, index) => <HourRow day={day} weekend={index > 4} key={day} />)}
              </div>
              <div className="mt-8 grid gap-6">
                <label className="block text-sm font-black">What counts as an emergency?
                  <textarea className="mt-2 min-h-28 w-full border-2 border-black bg-white p-4 font-semibold leading-7 outline-none focus:shadow-[5px_5px_0_#000]" name="emergency_rules" placeholder="Active flooding, burst pipes, sewage backup, or no water to the home." value={emergencyRules} onChange={(event) => setEmergencyRules(event.target.value)} />
                </label>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Callback expectation" name="callback_window" defaultValue={client.callback_window ?? "15 minutes for emergencies; 2 hours otherwise"} />
                  <Field label="Send lead alerts to" name="alert_phone" type="tel" defaultValue={client.alert_phone ?? (client.owner_phone === "Not set" ? "" : client.owner_phone)} placeholder="Mobile number" />
                </div>
                <label className="block text-sm font-black">Timezone
                  <select className="mt-2 h-13 w-full border-2 border-black bg-white px-4 font-semibold outline-none focus:shadow-[5px_5px_0_#000]" name="timezone" defaultValue={client.timezone ?? "America/New_York"}>
                    <option value="America/New_York">Eastern Time</option><option value="America/Chicago">Central Time</option><option value="America/Denver">Mountain Time</option><option value="America/Los_Angeles">Pacific Time</option>
                  </select>
                </label>
                <label className="flex items-start gap-3 border-2 border-black bg-white p-4 text-xs font-semibold leading-5 text-black/65">
                  <input className="mt-1 h-4 w-4 flex-none accent-black" name="alert_sms_consent" type="checkbox" required />
                  <span>I confirm that I control the alert number or have the recipient&apos;s express consent, and I agree that Snappy Leads may send transactional lead alerts and account notifications to it. Message frequency varies. Message and data rates may apply. Reply STOP to unsubscribe or HELP for help. Consent is not a condition of purchase.</span>
                </label>
              </div>

              <div className="mt-8 border-2 border-black bg-white p-5">
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-black/45">What happens next</p>
                {industry === "other" ? <p className="mt-4 text-sm font-semibold leading-6 text-black/60">Your details go to Danny for a quick review. He’ll tailor the call flow with you before your number goes live.</p> : <div className="mt-4 grid gap-3 text-sm font-bold sm:grid-cols-3">
                  <p className="flex gap-2"><Check className="h-4 w-4 flex-none" /> Call flows build</p><p className="flex gap-2"><Check className="h-4 w-4 flex-none" /> Your number is assigned</p><p className="flex gap-2"><Check className="h-4 w-4 flex-none" /> Make a test call</p>
                </div>}
              </div>
            </div>

            <div className="mt-10 flex items-center justify-between border-t-2 border-black pt-6">
              {step > 1 ? <button className="inline-flex h-12 items-center gap-2 px-2 text-sm font-black" type="button" onClick={previousStep}><ArrowLeft className="h-4 w-4" /> Back</button> : <span />}
              {step < 3 ? <button className="inline-flex h-12 items-center gap-2 bg-black px-6 text-sm font-black text-white" type="button" onClick={nextStep}>Continue <ArrowRight className="h-4 w-4" /></button> : <button className="inline-flex h-12 items-center gap-2 bg-black px-6 text-sm font-black text-white" type="submit">{industry === "other" ? "Request guided setup" : "Build my call flows"} <ArrowRight className="h-4 w-4" /></button>}
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}

export function reportStepValidity(container: ParentNode | null): boolean {
  if (!container) return false;
  const controls = Array.from(container.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>("input, textarea, select"));
  const invalid = controls.find((control) => !control.checkValidity());
  invalid?.reportValidity();
  return !invalid;
}

function StepHeading({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) {
  return <div><p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-black/45">{eyebrow}</p><h2 className="mt-4 text-4xl font-black leading-[0.96] tracking-[-0.055em] sm:text-5xl">{title}</h2><p className="mt-5 max-w-xl text-base font-semibold leading-7 text-black/55">{body}</p></div>;
}

function Field({ label, name, type = "text", placeholder, defaultValue, autoComplete, required = false, disabled = false }: { label: string; name: string; type?: string; placeholder?: string; defaultValue?: string; autoComplete?: string; required?: boolean; disabled?: boolean }) {
  return <label className="block text-sm font-black">{label}<input className="mt-2 h-13 w-full border-2 border-black bg-white px-4 font-semibold outline-none focus:shadow-[5px_5px_0_#000] disabled:bg-black/5 disabled:text-black/45" name={name} type={type} placeholder={placeholder} defaultValue={defaultValue} autoComplete={autoComplete} required={required} disabled={disabled} /></label>;
}

function HourRow({ day, weekend }: { day: string; weekend: boolean }) {
  const [closed, setClosed] = useState(weekend);
  const key = day.toLowerCase();
  return (
    <div className="grid items-center gap-3 border-b-2 border-r-2 border-black bg-white p-4 sm:grid-cols-[120px_1fr_auto]">
      <p className="text-sm font-black">{day}</p>
      <div className={`flex items-center gap-2 ${closed ? "opacity-25" : ""}`}><input className="h-10 min-w-0 flex-1 border border-black px-2 font-mono text-xs" name={`${key}_open`} type="time" defaultValue="08:00" disabled={closed} /><span className="text-xs font-bold">to</span><input className="h-10 min-w-0 flex-1 border border-black px-2 font-mono text-xs" name={`${key}_close`} type="time" defaultValue="17:00" disabled={closed} /></div>
      <label className="flex items-center gap-2 text-xs font-black"><input className="h-4 w-4 accent-black" name={`${key}_closed`} type="checkbox" checked={closed} onChange={(event) => setClosed(event.target.checked)} /> Closed</label>
    </div>
  );
}
