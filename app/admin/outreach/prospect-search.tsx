"use client";

import { Search, X } from "lucide-react";
import { useState } from "react";

export function ProspectSearch({ total }: { total: number }) {
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState(total);

  function filterRows(value: string) {
    const normalized = value.trim().toLowerCase();
    const rows = Array.from(document.querySelectorAll<HTMLElement>("[data-prospect-search]"));
    let visible = 0;

    rows.forEach((row) => {
      const matchesQuery = !normalized || (row.dataset.prospectSearch ?? "").includes(normalized);
      row.hidden = !matchesQuery;
      if (!matchesQuery) {
        const checkbox = row.querySelector<HTMLInputElement>('input[name="prospect_ids"]');
        if (checkbox?.checked) {
          checkbox.checked = false;
          checkbox.dispatchEvent(new Event("change", { bubbles: true }));
        }
      }
      if (matchesQuery) visible += 1;
    });

    setMatches(visible);
    window.dispatchEvent(new CustomEvent("outreach-search-change", { detail: { visible } }));
  }

  return (
    <div className="flex min-h-11 min-w-0 flex-1 items-center rounded-xl border border-[var(--product-line)] bg-white shadow-sm focus-within:border-slate-300 focus-within:ring-4 focus-within:ring-slate-100 lg:max-w-md">
      <Search className="ml-3 h-4 w-4 flex-none text-black/45" aria-hidden="true" />
      <input
        aria-label="Search prospects"
        className="min-w-0 flex-1 border-0 bg-transparent px-2 py-2 text-sm font-medium outline-none shadow-none"
        placeholder="Search company, URL, phone, contact, or notes"
        type="search"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          filterRows(event.target.value);
        }}
      />
      <span className="mr-2 whitespace-nowrap text-[10px] font-medium text-slate-400">
        {matches} shown
      </span>
      {query ? (
        <button
          aria-label="Clear prospect search"
          className="grid h-10 w-10 flex-none place-items-center border-l border-[var(--product-line)] hover:bg-[var(--product-surface-muted)]"
          type="button"
          onClick={() => {
            setQuery("");
            filterRows("");
          }}
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}
