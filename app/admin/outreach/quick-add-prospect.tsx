"use client";

import { ArrowRight, Check, Globe2, Phone } from "lucide-react";
import { useState } from "react";
import { companyNameFromWebsite } from "@/lib/outreach";

export function QuickAddProspect({
  action,
}: {
  action: (formData: FormData) => void | Promise<void>;
}) {
  const [website, setWebsite] = useState("");
  const [companyName, setCompanyName] = useState("");
  const validWebsite = Boolean(companyNameFromWebsite(website));

  return (
    <form
      action={action}
      className="overflow-hidden rounded-xl border border-[var(--product-line)] bg-white shadow-sm"
      id="add-prospect"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--product-line)] px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--product-accent)]">
            <Globe2 className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-900">Add one company</p>
            <p className="text-xs text-slate-500">Paste the website and we&apos;ll fill the name.</p>
          </div>
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
          Quick add
        </span>
      </div>

      <div className="grid gap-3 p-4 lg:grid-cols-[minmax(240px,1.3fr)_minmax(190px,1fr)_minmax(170px,.72fr)_auto] lg:items-end">
        <label className="block text-xs font-semibold text-slate-700">
          Website
          <input
            autoComplete="url"
            autoFocus
            className="mt-1 min-h-12 w-full border px-3 py-2 text-base font-medium outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
            name="website"
            placeholder="paste company.com"
            required
            value={website}
            onChange={(event) => {
              const value = event.target.value;
              setWebsite(value);
              setCompanyName(companyNameFromWebsite(value) ?? "");
            }}
          />
        </label>
        <label className="block text-xs font-semibold text-slate-700">
          Company name
          <div className="relative mt-1">
            <input
              className="min-h-12 w-full border px-3 py-2 pr-9 text-sm font-medium outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
              name="company_name"
              placeholder="Filled from URL"
              value={companyName}
              onChange={(event) => setCompanyName(event.target.value)}
            />
            {validWebsite && companyName ? (
              <Check className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-green-700" aria-hidden="true" />
            ) : null}
          </div>
        </label>
        <label className="block text-xs font-semibold text-slate-700">
          Phone <span className="font-semibold text-black/35">optional</span>
          <div className="relative mt-1">
            <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/35" aria-hidden="true" />
            <input
              className="min-h-12 w-full border py-2 pl-9 pr-3 text-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
              name="phone"
              type="tel"
              placeholder="(919) 555-0100"
            />
          </div>
        </label>
        <button
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-35"
          disabled={!validWebsite}
          type="submit"
        >
          Add to call list <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </form>
  );
}
