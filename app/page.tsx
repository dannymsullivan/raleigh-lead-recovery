import {
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  ClipboardCheck,
  ExternalLink,
  MessageSquareText,
  PhoneCall,
  Wrench
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { requestAuditAction } from "./actions";
import { demoReportHref } from "@/lib/demo-report";

const demoNumber = "+19842992155";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const heroProof = [
  "Your current number stays the same",
  "Only missed calls roll over",
  "Plumbing issue arrives by text"
];

const dayProblems = [
  "Both hands are under a sink",
  "The crew is driving between jobs",
  "An urgent call arrives after hours"
];

const reportBullets = [
  "Answered calls and lead summaries",
  "Urgent plumbing issues flagged",
  "Estimated pipeline value, not claimed revenue"
];

const auditIncludes = [
  "Help setting up missed-call forwarding",
  "Plumbing-specific caller intake",
  "Owner text alerts with lead details",
  "A simple end-of-week report"
];

const wedgePoints = [
  {
    title: "Not a new phone system",
    body: "Keep your current shop number, carrier, and daily call flow. This only handles the calls that would have gone unanswered."
  },
  {
    title: "Not generic AI answering",
    body: "Riley asks plumbing-specific questions about leaks, drains, water heaters, sewer backups, urgency, address, and callback timing."
  },
  {
    title: "Not self-serve setup",
    body: "Danny helps configure forwarding, tests the first calls, reviews the report, and tunes the shop rules during the pilot."
  }
];

const workflow = [
  {
    title: "A missed call rolls over",
    body: "Busy line, no answer, or after-hours. Your existing shop number forwards only the calls you miss.",
    icon: PhoneCall
  },
  {
    title: "Riley captures the job",
    body: "Caller name, callback number, address, issue, urgency, and timing are collected with a plumbing-specific intake.",
    icon: ClipboardCheck
  },
  {
    title: "You get the lead fast",
    body: "The owner gets the summary by text, and the weekly report shows what would have gone to voicemail.",
    icon: MessageSquareText
  }
];

const faqs = [
  {
    question: "How does Riley know plumbing?",
    answer: "Riley starts with a plumbing-specific intake for leaks, drains, water heaters, sewage backups, no-water calls, and quote requests. It captures details without quoting prices or promising dispatch."
  },
  {
    question: "Will customers call a new number?",
    answer: "No. Customers keep calling your normal shop number. Only missed, busy, or after-hours calls forward to Raleigh Lead Recovery."
  },
  {
    question: "Can Riley learn our shop rules?",
    answer: "Yes. The assistant can be tuned for your service area, hours, emergency rules, job types, preferred wording, and callback process."
  },
  {
    question: "Do we need software integrations?",
    answer: "Not for the free audit. Start with simple forwarding and owner alerts. CRM, dispatch, spreadsheet, or customer database connections can come later if the audit proves useful."
  },
  {
    question: "Can I turn it off?",
    answer: "Yes. You control call forwarding and can turn it off any time."
  },
  {
    question: "What does the audit prove?",
    answer: "It shows how many missed calls were answered, what the jobs were, which ones looked urgent, and the estimated value represented by the captured details."
  }
];

export default async function LandingPage({ searchParams }: PageProps) {
  const search = (await searchParams) ?? {};
  const requestError = search.request === "missing";

  return (
    <main className="min-h-screen bg-[#f3f4ee] text-[#090d07]">
      <section className="relative min-h-[760px] overflow-hidden bg-[#080d06] text-white lg:min-h-[820px]">
        <Image
          src="/plumber.webp"
          alt="Plumber working beside a water heater while a phone rings on the tool box"
          fill
          sizes="100vw"
          className="object-cover object-[70%_center] sm:object-center"
          priority
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#080d06_0%,rgba(8,13,6,0.95)_22%,rgba(8,13,6,0.52)_53%,rgba(8,13,6,0.06)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-[linear-gradient(0deg,#080d06_0%,rgba(8,13,6,0)_100%)]" />

        <header className="relative z-10 px-5 py-6">
          <nav className="mx-auto flex max-w-7xl items-center justify-between gap-3">
            <Link className="inline-flex min-w-0 items-center gap-3 font-bold" href="/">
              <span className="flex h-10 w-10 items-center justify-center rounded bg-[#cfff04] text-[#080d06]">
                <Wrench className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="truncate text-sm sm:text-base">Raleigh Lead Recovery</span>
            </Link>
            <div className="flex shrink-0 items-center gap-4">
              <Link className="hidden text-sm font-black text-white/72 hover:text-white sm:inline" href="/blog">
                Blog
              </Link>
              <a className="inline-flex items-center gap-2 rounded bg-[#cfff04] px-3 py-3 text-sm font-black text-[#080d06] shadow-[0_8px_24px_rgba(207,255,4,0.22)] hover:bg-[#bbed00] sm:px-5" href="#request">
                <span className="hidden sm:inline">Start free audit</span>
                <span className="sm:hidden">Audit</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
          </nav>
        </header>

        <div className="relative z-10 mx-auto flex min-h-[600px] max-w-7xl flex-col justify-center px-5 pb-20 pt-14 lg:min-h-[660px]">
          <div className="max-w-xl">
            <p className="mb-8 inline-flex items-center gap-2 text-sm font-black text-[#cfff04]">
              <Wrench className="h-4 w-4" aria-hidden="true" />
              Missed-call recovery for Raleigh plumbers
            </p>
            <h1 className="text-6xl font-black leading-[0.98] tracking-normal sm:text-7xl lg:text-8xl">
              Keep working. We&apos;ll catch the call.
            </h1>
            <p className="mt-8 max-w-lg text-lg font-medium leading-8 text-white/72 sm:text-xl">
              When your hands are on a water heater, drain line, or active leak, Riley answers the missed call, captures the plumbing issue, and texts the lead to your shop. No phone system migration.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a className="inline-flex items-center justify-center gap-2 rounded bg-[#cfff04] px-5 py-4 font-black text-[#080d06] hover:bg-[#bbed00]" href="#request">
                Start free audit
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </a>
              <a className="inline-flex items-center justify-center gap-2 rounded border border-white/15 px-5 py-4 font-black text-white hover:bg-white/10" href={`tel:${demoNumber}`}>
                <PhoneCall className="h-5 w-5" aria-hidden="true" />
                Call the demo
              </a>
            </div>
          </div>
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-5">
          <div className="grid border border-white/10 bg-[#080d06]/95 sm:grid-cols-3">
            {heroProof.map((point) => (
              <div key={point} className="flex min-h-16 items-center gap-3 border-white/10 px-6 py-4 text-sm font-semibold text-white/72 sm:border-l first:sm:border-l-0">
                <Check className="h-5 w-5 flex-none text-[#cfff04]" aria-hidden="true" />
                {point}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#fbfcf6] px-5 py-24">
        <div className="mx-auto grid max-w-7xl gap-16 lg:grid-cols-2 lg:items-center">
          <figure className="overflow-hidden rounded border border-[#c8c9bf] bg-[#efefe8]">
            <Image
              src="/plumber2.webp"
              alt="Plumber working under a sink with a phone visible in a tool bag"
              width={1216}
              height={832}
              className="aspect-[1.2/1] w-full object-cover"
              priority
            />
            <figcaption className="flex items-center gap-3 border-t border-[#c8c9bf] px-5 py-4 text-sm font-medium text-[#3e4238]">
              <Wrench className="h-4 w-4" aria-hidden="true" />
              The work demands your hands. The caller still expects an answer.
            </figcaption>
          </figure>

          <div>
            <p className="text-sm font-black text-[#d74322]">Built around a plumber&apos;s day</p>
            <h2 className="mt-6 max-w-2xl text-5xl font-black leading-[1.02] tracking-normal lg:text-6xl">
              You should not have to choose between the job and the phone.
            </h2>
            <p className="mt-8 max-w-2xl text-xl leading-9 text-[#41453d]">
              The calls most likely to get missed often arrive when you are least able to stop. Riley gives the caller an immediate response and gives you the context to call back quickly.
            </p>
            <div className="mt-10 border-t border-[#c8c9bf]">
              {dayProblems.map((problem) => (
                <div key={problem} className="flex items-center gap-4 border-b border-[#c8c9bf] py-5 text-lg font-black">
                  <Check className="h-5 w-5 flex-none text-[#9fc600]" aria-hidden="true" />
                  {problem}
                </div>
              ))}
            </div>
            <div className="mt-9 flex gap-4 rounded bg-[#f0f0e9] p-6 text-lg leading-8">
              <Clock3 className="mt-1 h-6 w-6 flex-none text-[#090d07]" aria-hidden="true" />
              <p>
                <span className="font-black">The result:</span> fewer mystery voicemails and faster callbacks with the plumbing issue already summarized.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#fbfcf6] px-5 pb-24">
        <div className="mx-auto grid max-w-7xl gap-16 lg:grid-cols-[0.58fr_1fr] lg:items-center">
          <div>
            <p className="text-sm font-black text-[#d74322]">What the audit proves</p>
            <h2 className="mt-6 max-w-xl text-5xl font-black leading-[1.02] tracking-normal lg:text-6xl">
              Seven days of real calls. One clear report.
            </h2>
            <p className="mt-8 max-w-xl text-xl leading-9 text-[#41453d]">
              See which calls were answered, what the jobs were, which were urgent, and the estimated value represented by the captured details.
            </p>
            <div className="mt-9 grid gap-5">
              {reportBullets.map((bullet) => (
                <div key={bullet} className="flex items-center gap-4 text-lg">
                  <CheckCircle2 className="h-5 w-5 flex-none text-[#9fc600]" aria-hidden="true" />
                  {bullet}
                </div>
              ))}
            </div>
            <a className="mt-10 inline-flex items-center gap-2 rounded bg-[#090d07] px-6 py-4 font-black text-white hover:bg-[#20251d]" href={demoReportHref}>
              View example report
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </a>
          </div>

          <div className="overflow-hidden rounded border border-[#c8c9bf] bg-[#efefe8] shadow-[0_22px_45px_rgba(9,13,7,0.12)]">
            <Image
              src="/report-preview.png?clean=1"
              alt="Example missed-call report with captured calls and estimated job value"
              width={1400}
              height={900}
              className="w-full"
              unoptimized
            />
            <p className="border-t border-[#c8c9bf] px-5 py-4 text-base text-[#3e4238]">
              Example report with masked customer details. Estimated values are based on captured job information.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-[#ecede6] px-5 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 border-b border-[#bfc1b7] pb-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <h2 className="max-w-xl text-5xl font-black leading-[1.02] tracking-normal lg:text-6xl">
              The call never hits a dead end.
            </h2>
            <p className="max-w-3xl text-xl leading-9 text-[#41453d]">
              No new customer-facing number. No dispatch overhaul. Start with the calls already slipping to voicemail.
            </p>
          </div>

          <div>
            {workflow.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="grid gap-5 border-b border-[#bfc1b7] py-8 lg:grid-cols-[0.12fr_0.32fr_1fr] lg:items-center">
                  <p className="text-sm font-black text-[#4d5148]">{String(index + 1).padStart(2, "0")}</p>
                  <div className="flex items-center gap-5">
                    <span className="flex h-12 w-12 flex-none items-center justify-center rounded bg-[#090d07] text-white">
                      <Icon className="h-6 w-6" aria-hidden="true" />
                    </span>
                    <h3 className="text-xl font-black tracking-normal">{step.title}</h3>
                  </div>
                  <p className="text-lg leading-8 text-[#41453d]">{step.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-[#080d06] px-5 py-24 text-white">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 border-b border-white/12 pb-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
            <div>
              <p className="text-sm font-black text-[#cfff04]">The local wedge</p>
              <h2 className="mt-5 max-w-2xl text-5xl font-black leading-[1.02] tracking-normal lg:text-6xl">
                Built for the calls voicemail loses.
              </h2>
            </div>
            <p className="max-w-3xl text-xl leading-9 text-white/68">
              Big phone platforms manage every call, text, teammate, inbox, and workflow. Raleigh Lead Recovery starts narrower: catch missed plumbing calls, alert the owner, and prove whether those calls were worth saving.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {wedgePoints.map((point) => (
              <div key={point.title} className="border border-white/12 bg-white/[0.03] p-6">
                <h3 className="text-xl font-black tracking-normal">{point.title}</h3>
                <p className="mt-4 leading-7 text-white/62">{point.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="request" className="bg-[#fbfcf6] px-5 py-24">
        <div className="mx-auto grid max-w-7xl overflow-hidden border border-[#d0d1c8] bg-white lg:grid-cols-[0.52fr_0.48fr]">
          <div className="bg-[#ecede6] p-8 sm:p-14">
            <p className="text-sm font-black text-[#d74322]">Free 7-day missed-call audit</p>
            <h2 className="mt-6 max-w-xl text-5xl font-black leading-[1.02] tracking-normal lg:text-6xl">
              Try it on the calls you already miss.
            </h2>
            <p className="mt-8 max-w-xl text-xl leading-9 text-[#41453d]">
              No card. No customer-facing number change. At the end of the week, continue only if the captured calls make sense for your shop.
            </p>
            <div className="mt-10 grid gap-5">
              {auditIncludes.map((item) => (
                <div key={item} className="flex items-center gap-4 text-lg">
                  <Check className="h-5 w-5 flex-none" aria-hidden="true" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <form action={requestAuditAction} className="p-8 sm:p-14">
            <div className="mb-8">
              <h2 className="text-3xl font-black tracking-normal">Request the free audit</h2>
              <p className="mt-3 leading-7 text-[#41453d]">Danny will follow up personally to confirm fit and forwarding.</p>
              {requestError ? <p className="mt-4 bg-[#fff0e8] px-3 py-2 text-sm font-black text-[#bb3d22]">Business, owner, and phone are required.</p> : null}
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Business name" name="business_name" required />
              <Field label="Owner name" name="owner_name" required />
              <Field label="Mobile number" name="owner_phone" type="tel" required />
              <Field label="Email" name="owner_email" type="email" />
            </div>
            <div className="mt-5">
              <Field label="Service area" name="service_area" placeholder="Raleigh, Cary, Apex..." />
            </div>

            <label className="mt-5 block text-sm font-black text-[#090d07]">
              What happens to missed calls today?
              <textarea
                className="mt-3 min-h-32 w-full rounded border border-[#bfc1b7] bg-[#fbfcf6] px-4 py-3 font-medium outline-none focus:border-[#090d07]"
                name="notes"
                placeholder="Voicemail, owner answers when available, answering service..."
              />
            </label>

            <button className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded bg-[#090d07] px-5 py-4 font-black text-white hover:bg-[#20251d]" type="submit">
              Request free audit
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </button>
          </form>
        </div>
      </section>

      <section className="bg-[#080d06] px-5 py-24 text-white">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.5fr_1fr]">
          <div>
            <h2 className="max-w-sm text-5xl font-black leading-[1.02] tracking-normal lg:text-6xl">
              Built for shops that are already busy.
            </h2>
            <p className="mt-7 max-w-sm text-xl leading-9 text-white/62">
              Start simple. Prove the missed-call volume. Add shop rules and connections only when they help.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {faqs.map((faq) => (
              <details key={faq.question} className="border border-white/8 bg-white/[0.02] p-6">
                <summary className="text-lg font-black">{faq.question}</summary>
                <p className="mt-4 leading-7 text-white/62">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
        <div className="mx-auto mt-20 max-w-7xl">
          <a className="inline-flex items-center gap-2 font-black text-[#cfff04]" href={`tel:${demoNumber}`}>
            <PhoneCall className="h-5 w-5" aria-hidden="true" />
            Call the demo
          </a>
        </div>
      </section>

      <section className="bg-[#f3f4ee] px-5 py-20">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.42fr_0.58fr] lg:items-center">
          <div className="flex items-center gap-6">
            <Image
              src="/danny.jpeg"
              alt="Danny Sullivan"
              width={96}
              height={96}
              className="h-24 w-24 flex-none rounded border border-[#bfc1b7] object-cover"
            />
            <div>
              <p className="text-sm font-black text-[#d74322]">Built locally</p>
              <h2 className="mt-3 text-3xl font-black leading-tight tracking-normal">Danny Sullivan, Raleigh</h2>
            </div>
          </div>
          <div className="border-[#bfc1b7] lg:border-l lg:pl-12">
            <p className="text-lg leading-8 text-[#41453d]">
              I built Raleigh Lead Recovery for local service businesses that lose calls while the crew is on a job. I help set up forwarding, review the first week, and make sure the report shows what was actually captured.
            </p>
            <a
              className="mt-7 inline-flex items-center gap-2 font-black text-[#090d07] underline underline-offset-4"
              href="https://www.linkedin.com/in/danny-sullivan-raleigh"
              rel="noreferrer"
              target="_blank"
            >
              Connect on LinkedIn
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#bfc1b7] bg-[#f3f4ee] px-5 py-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-5 text-sm text-[#41453d] sm:flex-row">
          <p>© 2026 Raleigh Lead Recovery</p>
          <div className="flex gap-6">
            <Link className="font-semibold text-[#090d07]" href="/blog">
              Blog
            </Link>
            <a className="font-semibold text-[#090d07]" href={`tel:${demoNumber}`}>
              Call demo
            </a>
            <a className="font-semibold text-[#090d07]" href="#request">
              Free audit
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
  required = false
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block text-sm font-black text-[#090d07]">
      {label}
      <input
        className="mt-3 h-14 w-full rounded border border-[#bfc1b7] bg-[#fbfcf6] px-4 font-medium outline-none focus:border-[#090d07]"
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
      />
    </label>
  );
}
