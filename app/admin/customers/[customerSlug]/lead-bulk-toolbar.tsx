"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";

export function LeadBulkToolbar({ action, formId, total }: { action: (formData: FormData) => void | Promise<void>; formId: string; total: number }) {
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    const boxes = () => Array.from(document.querySelectorAll<HTMLInputElement>(`input[type="checkbox"][form="${formId}"][name="contact_ids"]`));
    const update = () => setSelected(boxes().filter((box) => box.checked).length);
    const current = boxes();
    current.forEach((box) => box.addEventListener("change", update));
    update();
    return () => current.forEach((box) => box.removeEventListener("change", update));
  }, [formId, total]);

  function selectAll(checked: boolean) {
    document.querySelectorAll<HTMLInputElement>(`input[type="checkbox"][form="${formId}"][name="contact_ids"]`).forEach((box) => { box.checked = checked; });
    setSelected(checked ? total : 0);
  }

  return <form action={action} className="flex flex-wrap items-center gap-2" id={formId} onSubmit={(event) => {
    if (!window.confirm(`Delete ${selected} selected lead${selected === 1 ? "" : "s"}? Their attempts and bookings will also be removed. This cannot be undone.`)) event.preventDefault();
  }}>
    <label className="inline-flex h-10 cursor-pointer items-center gap-2 border-2 border-black bg-white px-3 text-xs font-black"><input className="accent-black" checked={selected > 0 && selected === total} onChange={(event) => selectAll(event.target.checked)} type="checkbox" /> Select this page ({total})</label>
    <button className="inline-flex h-10 items-center gap-2 border-2 border-red-700 px-3 text-xs font-black text-red-700 disabled:cursor-not-allowed disabled:opacity-35" disabled={!selected} type="submit"><Trash2 className="h-3.5 w-3.5" /> Delete selected ({selected})</button>
  </form>;
}
