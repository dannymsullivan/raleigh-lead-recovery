"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";

export function ProspectBulkToolbar({ action, formId, total }: { action: (formData: FormData) => void | Promise<void>; formId: string; total: number }) {
  const [selected, setSelected] = useState(0);
  const [visibleTotal, setVisibleTotal] = useState(total);

  useEffect(() => {
    const boxes = () => Array.from(document.querySelectorAll<HTMLInputElement>(`input[type="checkbox"][form="${formId}"][name="prospect_ids"]`))
      .filter((box) => !box.closest<HTMLElement>("[data-prospect-search]")?.hidden);
    const update = () => setSelected(boxes().filter((box) => box.checked).length);
    const current = Array.from(document.querySelectorAll<HTMLInputElement>(`input[type="checkbox"][form="${formId}"][name="prospect_ids"]`));
    const handleSearch = (event: Event) => {
      setVisibleTotal((event as CustomEvent<{ visible: number }>).detail.visible);
      update();
    };
    current.forEach((box) => box.addEventListener("change", update));
    window.addEventListener("outreach-search-change", handleSearch);
    update();
    return () => {
      current.forEach((box) => box.removeEventListener("change", update));
      window.removeEventListener("outreach-search-change", handleSearch);
    };
  }, [formId, total]);

  function selectAll(checked: boolean) {
    const visibleBoxes = Array.from(document.querySelectorAll<HTMLInputElement>(`input[type="checkbox"][form="${formId}"][name="prospect_ids"]`))
      .filter((box) => !box.closest<HTMLElement>("[data-prospect-search]")?.hidden);
    visibleBoxes.forEach((box) => { box.checked = checked; });
    setSelected(checked ? visibleBoxes.length : 0);
  }

  return <form action={action} className="flex flex-wrap items-center gap-2" id={formId} onSubmit={(event) => {
    if (!window.confirm(`Remove ${selected} selected prospect${selected === 1 ? "" : "s"} from the tracker? This cannot be undone.`)) event.preventDefault();
  }}>
    <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-[var(--product-line)] bg-white px-3 text-xs font-semibold text-slate-600"><input className="accent-slate-900" checked={selected > 0 && selected === visibleTotal} onChange={(event) => selectAll(event.target.checked)} type="checkbox" /> Select shown ({visibleTotal})</label>
    <button className="inline-flex h-9 items-center gap-2 rounded-lg px-3 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:text-slate-300" disabled={!selected} type="submit"><Trash2 className="h-3.5 w-3.5" /> Delete ({selected})</button>
  </form>;
}
