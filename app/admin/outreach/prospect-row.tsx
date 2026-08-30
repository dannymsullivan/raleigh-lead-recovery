"use client";

import { ArrowUpRight, Mail, Pencil } from "lucide-react";
import { useState, type ReactNode } from "react";
import {
  outreachStageLabels,
  outreachWebsiteHref,
  type OutreachProspect,
  type OutreachStage,
} from "@/lib/outreach";

export function ProspectRow({ prospect, editForm, bulkFormId }: { prospect: OutreachProspect; editForm: ReactNode; bulkFormId: string }) {
  const [editing, setEditing] = useState(false);
  const due = isFollowUpDue(prospect);
  return (
    <article className="grid gap-4 px-4 py-4 lg:grid-cols-[minmax(190px,1.25fr)_minmax(180px,1fr)_145px_110px_130px_150px] lg:items-center">
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
          <p className="font-black leading-5">{prospect.company_name}</p>
          <p className="mt-1 truncate text-xs font-semibold text-black/45">
            {[prospect.city, prospect.website ? displayWebsite(prospect.website) : null].filter(Boolean).join(" · ") || "Company details not added"}
          </p>
        </div>
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-bold">{prospect.contact_name || "Contact not found"}</p>
        <p className="mt-1 truncate text-xs font-semibold text-black/45">{prospect.contact_role || prospect.email || "Add a role or email"}</p>
      </div>
      <div><StagePill stage={prospect.stage} /></div>
      <LabeledValue label="Last touch" value={formatDate(prospect.last_contacted_on)} />
      <LabeledValue label="Next follow-up" value={formatDate(prospect.next_follow_up_on)} due={due} />
      <div className="flex items-center gap-2 lg:justify-end">
        {prospect.email ? (
          <a
            className="grid h-10 w-10 place-items-center border border-[var(--product-line-strong)] bg-white hover:border-black hover:bg-[var(--product-surface-muted)]"
            href={`mailto:${prospect.email}`}
            aria-label={`Email ${prospect.contact_name || prospect.company_name}`}
            title={prospect.email}
          >
            <Mail className="h-4 w-4" aria-hidden="true" />
          </a>
        ) : null}
        {prospect.website ? (
          <a
            className="grid h-10 w-10 place-items-center border border-[var(--product-line-strong)] bg-white hover:border-black hover:bg-[var(--product-surface-muted)]"
            href={outreachWebsiteHref(prospect.website)}
            target="_blank"
            rel="noreferrer"
            aria-label={`Open ${prospect.company_name} website`}
          >
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </a>
        ) : null}
        <button
          className={`grid h-10 w-10 place-items-center border ${
            editing
              ? "border-black bg-black text-white"
              : "border-[var(--product-line-strong)] bg-white hover:border-black hover:bg-[var(--product-surface-muted)]"
          }`}
          type="button"
          aria-expanded={editing}
          aria-label={`Edit ${prospect.company_name}`}
          title="Edit prospect"
          onClick={() => setEditing((current) => !current)}
        >
          <Pencil className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      {editing ? (
        <div className="border border-[var(--product-line)] bg-[var(--product-surface-muted)] p-4 lg:col-span-6">
          {editForm}
        </div>
      ) : null}
    </article>
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
    <span className={`inline-flex border px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.07em] ${classes}`}>
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
