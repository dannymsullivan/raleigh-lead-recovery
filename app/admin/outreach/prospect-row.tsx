"use client";

import { ArrowUpRight, Bot, ChevronDown, Mail, Pencil, Phone, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  outreachCallOutcomes,
  outreachPotentialCustomerLabels,
  outreachStageLabels,
  outreachWebsiteHref,
  type OutreachProspect,
  type OutreachStage,
} from "@/lib/outreach";

export function ProspectRow({ prospect, editForm, bulkFormId, logCallAction, agentCallAction, agentConfigured }: { prospect: OutreachProspect; editForm: ReactNode; bulkFormId: string; logCallAction: (formData: FormData) => void | Promise<void>; agentCallAction: (formData: FormData) => void | Promise<void>; agentConfigured: boolean }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [logging, setLogging] = useState(false);
  const due = isFollowUpDue(prospect);
  useEffect(() => {
    if (!prospect.call_in_progress_at) return;
    const interval = window.setInterval(() => router.refresh(), 5_000);
    return () => window.clearInterval(interval);
  }, [prospect.call_in_progress_at, router]);
  return (
    <article
      className="grid gap-3 px-5 py-4 transition-colors hover:bg-slate-50/60 lg:grid-cols-[minmax(190px,1.25fr)_minmax(155px,.9fr)_125px_125px_120px_220px] lg:items-center"
      data-prospect-search={[
        prospect.company_name,
        prospect.website,
        prospect.city,
        prospect.contact_name,
        prospect.contact_role,
        prospect.email,
        prospect.phone,
        prospect.notes,
      ].filter(Boolean).join(" ").toLowerCase()}
    >
      <div className="flex min-w-0 items-start gap-3">
        <input
          aria-label={`Select ${prospect.company_name}`}
          className="mt-1 h-4 w-4 flex-none accent-black"
          form={bulkFormId}
          name="prospect_ids"
          type="checkbox"
          value={prospect.id}
        />
        <div className="min-w-0">
          <p className="font-semibold leading-5 text-slate-950">{prospect.company_name}</p>
          <p className="mt-1 truncate text-xs font-medium text-slate-500">
            {[prospect.city, prospect.website ? displayWebsite(prospect.website) : null].filter(Boolean).join(" · ") || "Company details not added"}
          </p>
        </div>
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-slate-800">{prospect.contact_name || "Contact not found"}</p>
        <p className="mt-1 truncate text-xs text-slate-500">{prospect.contact_role || prospect.email || "Add a role or email"}</p>
      </div>
      <CallOutcome outcome={prospect.last_call_outcome} date={prospect.last_contacted_on} />
      <LabeledValue label="Next follow-up" value={formatDate(prospect.next_follow_up_on)} due={due} />
      <div><StagePill stage={prospect.stage} /></div>
      <div className="flex items-center gap-2 lg:justify-end">
        {prospect.email ? (
          <a
            className="grid h-10 w-10 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            href={`mailto:${prospect.email}`}
            aria-label={`Email ${prospect.contact_name || prospect.company_name}`}
            title={prospect.email}
          >
            <Mail className="h-4 w-4" aria-hidden="true" />
          </a>
        ) : null}
        {prospect.website ? (
          <a
            className="grid h-10 w-10 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            href={outreachWebsiteHref(prospect.website)}
            target="_blank"
            rel="noreferrer"
            aria-label={`Open ${prospect.company_name} website`}
          >
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </a>
        ) : null}
        <a
          className="grid h-10 w-10 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          href={`https://www.google.com/search?q=${encodeURIComponent(`${prospect.company_name}${prospect.city ? ` ${prospect.city}` : ""}`)}`}
          target="_blank"
          rel="noreferrer"
          aria-label={`Search Google for ${prospect.company_name}`}
          title="Research in Google"
        >
          <Search className="h-4 w-4" aria-hidden="true" />
        </a>
        {prospect.phone ? (
          <button
            className={`inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold ${
              logging
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-800 hover:bg-slate-200"
            }`}
            type="button"
            aria-expanded={logging}
            aria-label={`Call and log ${prospect.company_name}`}
            title="Call & log outcome"
            onClick={() => { setLogging((current) => !current); setEditing(false); }}
          >
            <Phone className="h-4 w-4" aria-hidden="true" /> Call
          </button>
        ) : null}
        <button
          className={`grid h-10 w-10 place-items-center rounded-lg ${
            editing
              ? "bg-slate-900 text-white"
              : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          }`}
          type="button"
          aria-expanded={editing}
          aria-label={`Edit ${prospect.company_name}`}
          title="Edit prospect"
          onClick={() => { setEditing((current) => !current); setLogging(false); }}
        >
          <Pencil className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      {logging && prospect.phone ? (
        <div className="rounded-xl bg-slate-50 p-3 lg:col-span-6">
          <form action={agentCallAction} className="mb-3 rounded-xl border border-[var(--product-line)] bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="flex items-center gap-2 text-sm font-semibold text-slate-900"><Bot className="h-4 w-4" aria-hidden="true" /> Have Chloe call and qualify</p>
                <p className="mt-1 text-xs text-slate-500">The outcome and potential-customer signal are logged automatically.</p>
              </div>
              <button
                className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                disabled={!agentConfigured || Boolean(prospect.call_in_progress_at) || Boolean(prospect.do_not_call_at)}
                type="submit"
              >
                <Bot className="h-4 w-4" aria-hidden="true" />
                {prospect.call_in_progress_at ? "Call in progress" : prospect.do_not_call_at ? "Do not call" : "Start AI call"}
              </button>
            </div>
            <label className="mt-3 flex items-start gap-2 text-xs leading-5 text-slate-600">
              <input className="mt-0.5 h-4 w-4 flex-none accent-black" name="eligibility_attested" required type="checkbox" value="yes" />
              I confirmed this is a business number, the call is permitted, and the prospect has not opted out.
            </label>
          </form>
          <div className="flex flex-wrap items-center gap-2">
            <a
              className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50"
              href={`tel:${prospect.phone}`}
            >
              <Phone className="h-4 w-4" aria-hidden="true" /> Call {prospect.phone}
            </a>
            <span className="mx-1 text-xs font-medium text-slate-400">
              Then tap one result
            </span>
            <form action={logCallAction} className="flex flex-wrap gap-2">
              <button
                className="min-h-11 rounded-lg bg-[var(--product-accent)] px-4 text-sm font-semibold text-slate-950 hover:brightness-95"
                name="outcome"
                type="submit"
                value="real_person"
              >
                Answered
              </button>
              <button
                className="min-h-11 rounded-lg bg-white px-4 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
                name="outcome"
                type="submit"
                value="no_answer"
              >
                No answer
              </button>
              <details className="relative">
                <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-2 border border-[var(--product-line-strong)] bg-white px-3 text-xs font-black hover:border-black">
                  Other <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                </summary>
                <div className="absolute right-0 top-[calc(100%+4px)] z-10 grid min-w-40 border border-black bg-white p-1 shadow-lg">
                  {(["voicemail", "busy", "wrong_number"] as const).map((key) => (
                    <button
                      className="min-h-10 px-3 text-left text-xs font-black hover:bg-[var(--product-surface-muted)]"
                      key={key}
                      name="outcome"
                      type="submit"
                      value={key}
                    >
                      {outreachCallOutcomes[key]}
                    </button>
                  ))}
                </div>
              </details>
            </form>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Answered schedules tomorrow. No answer schedules another attempt in two days. You can change the date anytime.
          </p>
        </div>
      ) : null}
      {prospect.notes ? (
        <p className="line-clamp-2 whitespace-pre-line pl-7 text-xs leading-5 text-slate-500 lg:col-span-6">
          {prospect.notes}
        </p>
      ) : null}
      {prospect.last_call_summary ? (
        <div className="ml-7 rounded-lg bg-emerald-50 px-3 py-2 text-xs leading-5 lg:col-span-6">
          <p className="font-black">
            {prospect.potential_customer ? outreachPotentialCustomerLabels[prospect.potential_customer] : "AI call summary"}
          </p>
          <p className="mt-0.5 line-clamp-2 font-semibold text-black/50">{prospect.last_call_summary}</p>
        </div>
      ) : null}
      {editing ? (
        <div className="rounded-xl bg-slate-50 p-4 lg:col-span-6">
          {editForm}
        </div>
      ) : null}
    </article>
  );
}

function CallOutcome({ outcome, date }: { outcome: OutreachProspect["last_call_outcome"]; date: string | null }) {
  return (
    <div>
      <p className="mb-1 font-mono text-[8px] font-bold uppercase tracking-[0.1em] text-black/40 lg:hidden">Last result</p>
      {outcome ? (
        <>
          <p className="text-xs font-black">{outreachCallOutcomes[outcome]}</p>
          <p className="mt-1 text-[10px] font-semibold text-black/40">{formatDate(date)}</p>
        </>
      ) : (
        <p className="text-xs font-bold text-black/35">Not called</p>
      )}
    </div>
  );
}

function LabeledValue({ label, value, due = false }: { label: string; value: string; due?: boolean }) {
  return (
    <div>
      <p className="mb-1 font-mono text-[8px] font-bold uppercase tracking-[0.1em] text-black/40 lg:hidden">{label}</p>
      <p className={`text-xs font-bold tabular-nums ${due ? "text-red-700" : "text-black/55"}`}>{value}</p>
    </div>
  );
}

function StagePill({ stage }: { stage: OutreachStage }) {
  const classes =
    stage === "pilot_booked"
      ? "border-black bg-[var(--product-accent)] text-black"
      : stage === "not_interested"
        ? "border-[var(--product-line-strong)] text-black/40"
        : stage === "replied" || stage === "call_scheduled"
          ? "border-black bg-black text-white"
          : "border-[var(--product-line-strong)] bg-white text-black/60";
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold ${classes}`}>
      {outreachStageLabels[stage]}
    </span>
  );
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(
    new Date(`${value}T12:00:00Z`),
  );
}

function isFollowUpDue(prospect: OutreachProspect): boolean {
  if (!prospect.next_follow_up_on || ["pilot_booked", "not_interested"].includes(prospect.stage)) return false;
  return prospect.next_follow_up_on <= new Date().toISOString().slice(0, 10);
}

function displayWebsite(value: string): string {
  return value.replace(/^https?:\/\//i, "").replace(/\/$/, "");
}
