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
      className="border border-[var(--product-line-strong)] bg-white"
      id="add-prospect"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--product-line)] px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center bg-[var(--product-accent)]">
            <Globe2 className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-black">Paste a company website</p>
            <p className="text-[11px] font-semibold text-black/45">We&apos;ll pull the name from the URL.</p>
          </div>
        </div>
        <span className="font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-black/40">
          Quick add
        </span>
      </div>

      <div className="grid gap-3 p-4 lg:grid-cols-[minmax(240px,1.3fr)_minmax(190px,1fr)_minmax(170px,.72fr)_auto] lg:items-end">
        <label className="block text-xs font-black">
          Website
          <input
            autoComplete="url"
            autoFocus
            className="mt-1 min-h-12 w-full border-2 border-black px-3 py-2 text-base font-semibold outline-none focus:shadow-[4px_4px_0_var(--product-accent)]"
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
        <label className="block text-xs font-black">
          Company name
          <div className="relative mt-1">
            <input
              className="min-h-12 w-full border px-3 py-2 pr-9 text-sm font-semibold outline-none focus:border-black"
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
        <label className="block text-xs font-black">
          Phone <span className="font-semibold text-black/35">optional</span>
          <div className="relative mt-1">
            <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/35" aria-hidden="true" />
            <input
              className="min-h-12 w-full border py-2 pl-9 pr-3 text-sm outline-none focus:border-black"
              name="phone"
              type="tel"
              placeholder="(919) 555-0100"
            />
          </div>
        </label>
        <button
          className="inline-flex min-h-12 items-center justify-center gap-2 bg-black px-5 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-35"
          disabled={!validWebsite}
          type="submit"
        >
          Add to call list <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </form>
  );
}

