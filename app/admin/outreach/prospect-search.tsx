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
    <div className="flex min-h-11 min-w-0 flex-1 items-center border-2 border-black bg-white focus-within:shadow-[4px_4px_0_var(--product-accent)] lg:max-w-md">
      <Search className="ml-3 h-4 w-4 flex-none text-black/45" aria-hidden="true" />
      <input
        aria-label="Search prospects"
        className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm font-semibold outline-none"
        placeholder="Search company, URL, phone, contact, or notes"
        type="search"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          filterRows(event.target.value);
        }}
      />
      <span className="mr-2 whitespace-nowrap font-mono text-[9px] font-bold uppercase tracking-[0.08em] text-black/40">
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
