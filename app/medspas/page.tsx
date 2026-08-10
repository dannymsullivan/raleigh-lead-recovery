import type { Metadata } from "next";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  ExternalLink,
  MessageSquareText,
  PhoneCall,
  ShieldCheck
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { requestAuditAction } from "../actions";

const demoNumber = "+19842992155";
const heroImage =
  "https://images.pexels.com/photos/3997983/pexels-photo-3997983.jpeg?auto=compress&cs=tinysrgb&w=1800";
const treatmentImage =
  "https://images.pexels.com/photos/5069432/pexels-photo-5069432.jpeg?auto=compress&cs=tinysrgb&w=1400";

export const metadata: Metadata = {
  title: "Missed-Call Recovery for Raleigh Med Spas | Raleigh Lead Recovery",
  description:
    "A 7-day missed-call audit for med spas and aesthetic clinics that captures consult requests, callback details, and preferred timing without replacing your phone system."
};

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const heroProof = [
  "Your current number can stay",
  "Only missed calls roll over",
  "Consult details arrive by text"
];

const clinicProblems = [
  "The injector is in a treatment room",
  "The front desk is checking out a client",
  "A consult request comes in after hours"
];

const reportBullets = [
  "Consult requests captured",
  "Treatment interest and timing summarized",
  "Estimated opportunity, not promised revenue"
];

const auditIncludes = [
  "Help setting up missed-call forwarding",
  "Aesthetic consult intake tuned to your clinic",
  "Owner or front-desk text alerts",
  "A simple end-of-week missed-call report"
];

const workflow = [
  {
    title: "A missed call rolls over",
    body: "Busy line, no answer, or after-hours. Your existing clinic number forwards only the calls your team misses.",
    icon: PhoneCall
  },
  {
    title: "Mabel captures the consult",
    body: "Caller name, callback number, treatment interest, preferred timing, new/existing client status, and basic routing notes are collected.",
    icon: ClipboardCheck
  },
  {
    title: "Your team gets the context",
    body: "The summary arrives by text so the right person can follow up without replaying voicemail or guessing what the caller wanted.",
    icon: MessageSquareText
  }
];

const wedgePoints = [
  {
    title: "Not a call center",
    body: "This is not a generic receptionist reading a script. Mabel is tuned for consult capture and hands the lead back to your clinic."
  },
  {
    title: "Not medical advice",
    body: "Mabel does not recommend treatments, diagnose, or quote clinical promises. The job is to capture intent and route follow-up."
  },
  {
    title: "Not a booking migration",
    body: "Start with missed-call capture. Booking software, CRM, and database connections can come later if the audit proves useful."
  }
];

const faqs = [
  {
    question: "Does Mabel give medical advice?",
    answer:
      "No. Mabel captures appointment intent and routes the request. It should not diagnose, recommend treatment, give medical instructions, or make clinical promises."
  },
  {
    question: "Will clients call a new number?",
    answer:
      "No. Clients keep calling your normal clinic number. Only missed, busy, or after-hours calls forward to Raleigh Lead Recovery."
  },
  {
    question: "Can Mabel quote prices?",
    answer:
      "For the free audit, no. Mabel can say the team will follow up with details. Pricing rules can be added later only if your clinic wants approved wording."
  },
  {
    question: "What details does the intake collect?",
    answer:
      "Caller name, callback number, treatment interest, preferred timing, whether they are new or returning, and any short context they volunteer."
  },
  {
    question: "Can it connect to our booking system?",
    answer:
      "Not required for the audit. Start with forwarding and text alerts. Booking, CRM, spreadsheet, or database connections can be explored after the workflow proves useful."
  },
  {
    question: "What about sensitive information?",
    answer:
      "The audit should stay focused on consult routing, not medical history. If you want deeper health intake or PHI workflows, that needs a separate compliance review."
  }
];

export default async function MedSpasPage({ searchParams }: PageProps) {
  const search = (await searchParams) ?? {};
  const requestError = search.request === "missing";

  return (
    <main className="min-h-screen bg-[#f8f4ef] text-[#201713]">
      <section className="relative min-h-[760px] overflow-hidden bg-[#1b1210] text-white lg:min-h-[820px]">
        <Image
          src={heroImage}
          alt="Aesthetic treatment room with a client receiving facial care"
          fill
          sizes="100vw"
          className="object-cover object-[58%_center]"
          priority
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#1b1210_0%,rgba(27,18,16,0.96)_28%,rgba(27,18,16,0.56)_58%,rgba(27,18,16,0.12)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-[linear-gradient(0deg,#1b1210_0%,rgba(27,18,16,0)_100%)]" />

        <header className="relative z-10 px-5 py-6">
          <nav className="mx-auto flex max-w-7xl items-center justify-between gap-3">
            <Link className="inline-flex min-w-0 items-center gap-3 font-bold" href="/">
              <span className="flex h-10 w-10 items-center justify-center rounded bg-[#f1d6c6] text-[#1b1210]">
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="truncate text-sm sm:text-base">Raleigh Lead Recovery</span>
            </Link>
            <div className="flex shrink-0 items-center gap-4">
              <Link className="hidden text-sm font-black text-white/72 hover:text-white sm:inline" href="/blog">
                Blog
              </Link>
              <a
                className="inline-flex items-center gap-2 rounded bg-[#f1d6c6] px-3 py-3 text-sm font-black text-[#1b1210] shadow-[0_8px_24px_rgba(241,214,198,0.22)] hover:bg-[#ffd9c1] sm:px-5"
                href="#request"
              >
                <span className="hidden sm:inline">Start free audit</span>
                <span className="sm:hidden">Audit</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
          </nav>
        </header>

        <div className="relative z-10 mx-auto flex min-h-[600px] max-w-7xl flex-col justify-center px-5 pb-20 pt-14 lg:min-h-[660px]">
          <div className="max-w-2xl">
            <p className="mb-8 inline-flex items-center gap-2 text-sm font-black text-[#f1d6c6]">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              Missed-call recovery for Raleigh med spas
            </p>
            <h1 className="text-6xl font-black leading-[0.98] tracking-normal sm:text-7xl lg:text-8xl">
              Catch consults after your front desk stops.
            </h1>
            <p className="mt-8 max-w-xl text-lg font-medium leading-8 text-white/72 sm:text-xl">
              When your team is in treatment, checking out clients, or closed for the day, Mabel answers missed calls, captures the consult request, and texts the lead to your clinic. No phone system migration.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a className="inline-flex items-center justify-center gap-2 rounded bg-[#f1d6c6] px-5 py-4 font-black text-[#1b1210] hover:bg-[#ffd9c1]" href="#request">
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
          <div className="grid border border-white/10 bg-[#1b1210]/95 sm:grid-cols-3">
            {heroProof.map((point) => (
              <div key={point} className="flex min-h-16 items-center gap-3 border-white/10 px-6 py-4 text-sm font-semibold text-white/72 sm:border-l first:sm:border-l-0">
                <Check className="h-5 w-5 flex-none text-[#f1d6c6]" aria-hidden="true" />
                {point}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#fffaf6] px-5 py-24">
        <div className="mx-auto grid max-w-7xl gap-16 lg:grid-cols-2 lg:items-center">
          <figure className="overflow-hidden rounded border border-[#d8c9be] bg-[#f4ebe4]">
            <Image
              src={treatmentImage}
              alt="Aesthetician applying skincare treatment in a med spa room"
              width={1400}
              height={1680}
              className="aspect-[1.08/1] w-full object-cover"
              loading="lazy"
            />
            <figcaption className="flex items-center gap-3 border-t border-[#d8c9be] px-5 py-4 text-sm font-medium text-[#604d44]">
              <Clock3 className="h-4 w-4" aria-hidden="true" />
              The treatment room needs focus. The caller still expects a response.
            </figcaption>
          </figure>

          <div>
            <p className="text-sm font-black text-[#a5563e]">Built around an aesthetic clinic&apos;s day</p>
            <h2 className="mt-6 max-w-2xl text-5xl font-black leading-[1.02] tracking-normal lg:text-6xl">
              You should not have to choose between the client in front of you and the next consult.
            </h2>
            <p className="mt-8 max-w-2xl text-xl leading-9 text-[#5a4b44]">
              Missed calls often happen when your team is doing the work that drives revenue. Mabel gives callers a calm response and gives your team the context to follow up quickly.
            </p>
            <div className="mt-10 border-t border-[#d8c9be]">
              {clinicProblems.map((problem) => (
                <div key={problem} className="flex items-center gap-4 border-b border-[#d8c9be] py-5 text-lg font-black">
                  <Check className="h-5 w-5 flex-none text-[#a5563e]" aria-hidden="true" />
                  {problem}
                </div>
              ))}
            </div>
            <div className="mt-9 flex gap-4 rounded bg-[#f4ebe4] p-6 text-lg leading-8">
              <MessageSquareText className="mt-1 h-6 w-6 flex-none text-[#201713]" aria-hidden="true" />
              <p>
                <span className="font-black">The result:</span> fewer mystery voicemails and faster consult follow-up with the request already summarized.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="sample-report" className="bg-[#fffaf6] px-5 pb-24">
        <div className="mx-auto grid max-w-7xl gap-16 lg:grid-cols-[0.58fr_1fr] lg:items-center">
          <div>
            <p className="text-sm font-black text-[#a5563e]">What the audit proves</p>
            <h2 className="mt-6 max-w-xl text-5xl font-black leading-[1.02] tracking-normal lg:text-6xl">
              Seven days of missed consults. One clear report.
            </h2>
            <p className="mt-8 max-w-xl text-xl leading-9 text-[#5a4b44]">
              See which calls were captured, what people wanted, when they hoped to come in, and whether the missed volume is worth saving.
            </p>
            <div className="mt-9 grid gap-5">
              {reportBullets.map((bullet) => (
                <div key={bullet} className="flex items-center gap-4 text-lg">
                  <CheckCircle2 className="h-5 w-5 flex-none text-[#a5563e]" aria-hidden="true" />
                  {bullet}
                </div>
              ))}
            </div>
            <a className="mt-10 inline-flex items-center gap-2 rounded bg-[#201713] px-6 py-4 font-black text-white hover:bg-[#382821]" href="#request">
              Request med spa audit
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </a>
          </div>

          <div className="overflow-hidden rounded border border-[#d8c9be] bg-[#f4ebe4] shadow-[0_22px_45px_rgba(32,23,19,0.12)]">
            <div className="border-b border-[#d8c9be] bg-white p-6 sm:p-8">
              <p className="mb-3 inline-flex rounded bg-[#f6ddd1] px-2 py-1 text-sm font-black text-[#8c3f2f]">7-day missed consult pilot</p>
              <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-start">
                <div>
                  <h3 className="max-w-xl text-4xl font-black leading-tight tracking-normal">
                    Oak & Rose Aesthetics, here is what your front desk missed.
                  </h3>
                  <p className="mt-4 max-w-xl text-sm leading-6 text-[#5a4b44]">
                    Customer details are masked for sharing. Full callback details go to the clinic by text.
                  </p>
                </div>
                <div className="rounded bg-[#201713] p-5 text-white">
                  <p className="text-sm text-white/70">Estimated consult value captured</p>
                  <p className="mt-2 text-4xl font-black tracking-normal">$7,400</p>
                  <p className="mt-2 text-xs text-white/62">Opportunity value, not closed revenue.</p>
                </div>
              </div>
            </div>

            <div className="grid gap-3 p-6 sm:grid-cols-3 sm:p-8">
              <SampleStat label="Calls answered" value="18" />
              <SampleStat label="Consults captured" value="11" />
              <SampleStat label="After-hours" value="7" />
            </div>

            <div className="grid gap-3 px-6 pb-6 sm:px-8 sm:pb-8">
              <SampleCall tag="BOTOX" name="Megan R." detail="Interested in first-time Botox consult before a wedding." value="$650" />
              <SampleCall tag="FILLER" name="Lauren P." detail="Asked about lip filler availability next week." value="$900" />
              <SampleCall tag="LASER" name="Jamie K." detail="Wanted laser hair removal consult and evening appointment options." value="$1,200" />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#f4ebe4] px-5 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 border-b border-[#d8c9be] pb-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <h2 className="max-w-xl text-5xl font-black leading-[1.02] tracking-normal lg:text-6xl">
              The consult request never hits a dead end.
            </h2>
            <p className="max-w-3xl text-xl leading-9 text-[#5a4b44]">
              No new customer-facing number. No software migration. Start with the calls already slipping to voicemail.
            </p>
          </div>

          <div>
            {workflow.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="grid gap-5 border-b border-[#d8c9be] py-8 lg:grid-cols-[0.12fr_0.32fr_1fr] lg:items-center">
                  <p className="text-sm font-black text-[#7b665c]">{String(index + 1).padStart(2, "0")}</p>
                  <div className="flex items-center gap-5">
                    <span className="flex h-12 w-12 flex-none items-center justify-center rounded bg-[#201713] text-white">
                      <Icon className="h-6 w-6" aria-hidden="true" />
                    </span>
                    <h3 className="text-xl font-black tracking-normal">{step.title}</h3>
                  </div>
                  <p className="text-lg leading-8 text-[#5a4b44]">{step.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-[#1b1210] px-5 py-24 text-white">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 border-b border-white/12 pb-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
            <div>
              <p className="text-sm font-black text-[#f1d6c6]">The local wedge</p>
              <h2 className="mt-5 max-w-2xl text-5xl font-black leading-[1.02] tracking-normal lg:text-6xl">
                Built for consult capture, not clinic replacement.
              </h2>
            </div>
            <p className="max-w-3xl text-xl leading-9 text-white/68">
              Big platforms try to manage every inbox, calendar, call, text, campaign, and patient workflow. Raleigh Lead Recovery starts narrower: catch missed consult calls, alert your team, and prove whether those calls were worth saving.
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

      <section id="request" className="bg-[#fffaf6] px-5 py-24">
        <div className="mx-auto grid max-w-7xl overflow-hidden border border-[#d8c9be] bg-white lg:grid-cols-[0.52fr_0.48fr]">
          <div className="bg-[#f4ebe4] p-8 sm:p-14">
            <p className="text-sm font-black text-[#a5563e]">Free 7-day missed-consult audit</p>
            <h2 className="mt-6 max-w-xl text-5xl font-black leading-[1.02] tracking-normal lg:text-6xl">
              Try it on the consult calls you already miss.
            </h2>
            <p className="mt-8 max-w-xl text-xl leading-9 text-[#5a4b44]">
              No card. No customer-facing number change. At the end of the week, continue only if the captured requests make sense for your clinic.
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
            <input name="source" type="hidden" value="medspa_landing" />
            <div className="mb-8">
              <h2 className="text-3xl font-black tracking-normal">Request the med spa audit</h2>
              <p className="mt-3 leading-7 text-[#5a4b44]">Danny will follow up personally to confirm fit and forwarding.</p>
              {requestError ? <p className="mt-4 bg-[#fff0e8] px-3 py-2 text-sm font-black text-[#bb3d22]">Clinic, contact, and phone are required.</p> : null}
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Clinic name" name="business_name" required />
              <Field label="Owner or manager" name="owner_name" required />
              <Field label="Mobile number" name="owner_phone" type="tel" required />
              <Field label="Email" name="owner_email" type="email" />
            </div>
            <div className="mt-5">
              <Field label="Service area" name="service_area" placeholder="Raleigh, Cary, Durham..." />
            </div>

            <label className="mt-5 block text-sm font-black text-[#201713]">
              What happens to missed consult calls today?
              <textarea
                className="mt-3 min-h-32 w-full rounded border border-[#d8c9be] bg-[#fffaf6] px-4 py-3 font-medium outline-none focus:border-[#201713]"
                name="notes"
                placeholder="Voicemail, front desk calls back later, booking software, Instagram DMs..."
              />
            </label>

            <button className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded bg-[#201713] px-5 py-4 font-black text-white hover:bg-[#382821]" type="submit">
              Request free audit
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </button>
          </form>
        </div>
      </section>

      <section className="bg-[#1b1210] px-5 py-24 text-white">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.5fr_1fr]">
          <div>
            <h2 className="max-w-sm text-5xl font-black leading-[1.02] tracking-normal lg:text-6xl">
              Built for clinics that are already busy.
            </h2>
            <p className="mt-7 max-w-sm text-xl leading-9 text-white/62">
              Start simple. Prove missed-call volume. Add booking rules and integrations only when they help.
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
          <a className="inline-flex items-center gap-2 font-black text-[#f1d6c6]" href={`tel:${demoNumber}`}>
            <PhoneCall className="h-5 w-5" aria-hidden="true" />
            Call the demo
          </a>
        </div>
      </section>

      <section className="bg-[#f8f4ef] px-5 py-20">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.42fr_0.58fr] lg:items-center">
          <div className="flex items-center gap-6">
            <Image
              src="/danny.jpeg"
              alt="Danny Sullivan"
              width={96}
              height={96}
              className="h-24 w-24 flex-none rounded border border-[#d8c9be] object-cover"
            />
            <div>
              <p className="text-sm font-black text-[#a5563e]">Built locally</p>
              <h2 className="mt-3 text-3xl font-black leading-tight tracking-normal">Danny Sullivan, Raleigh</h2>
            </div>
          </div>
          <div className="border-[#d8c9be] lg:border-l lg:pl-12">
            <p className="text-lg leading-8 text-[#5a4b44]">
              I built Raleigh Lead Recovery for local businesses that lose calls when the team is already serving clients. I help set up forwarding, review the first week, and tune the intake so it reflects the way your clinic actually follows up.
            </p>
            <a
              className="mt-7 inline-flex items-center gap-2 font-black text-[#201713] underline underline-offset-4"
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

      <footer className="border-t border-[#d8c9be] bg-[#f8f4ef] px-5 py-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-5 text-sm text-[#5a4b44] sm:flex-row">
          <p>&copy; 2026 Raleigh Lead Recovery</p>
          <div className="flex gap-6">
            <Link className="font-semibold text-[#201713]" href="/">
              Plumbers
            </Link>
            <a className="font-semibold text-[#201713]" href={`tel:${demoNumber}`}>
              Call demo
            </a>
            <a className="font-semibold text-[#201713]" href="#request">
              Free audit
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}

function SampleStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-[#d8c9be] bg-white p-4">
      <p className="text-sm text-[#7b665c]">{label}</p>
      <p className="mt-2 text-3xl font-black tracking-normal text-[#201713]">{value}</p>
    </div>
  );
}

function SampleCall({ tag, name, detail, value }: { tag: string; name: string; detail: string; value: string }) {
  return (
    <div className="rounded border border-[#d8c9be] bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="rounded bg-[#f6ddd1] px-2 py-1 text-xs font-black text-[#8c3f2f]">{tag}</span>
          <span className="text-sm text-[#7b665c]">Callback captured</span>
        </div>
        <p className="text-sm font-black text-[#201713]">{value}</p>
      </div>
      <h4 className="mt-4 text-lg font-black tracking-normal">{name}</h4>
      <p className="mt-1 text-sm leading-6 text-[#5a4b44]">{detail}</p>
    </div>
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
    <label className="block text-sm font-black text-[#201713]">
      {label}
      <input
        className="mt-3 h-14 w-full rounded border border-[#d8c9be] bg-[#fffaf6] px-4 font-medium outline-none focus:border-[#201713]"
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
      />
    </label>
  );
}
