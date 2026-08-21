"use client";

import { Trash2 } from "lucide-react";

export function ClearLeadList({ action, total }: { action: (formData: FormData) => void | Promise<void>; total: number }) {
  return <details className="group w-full border-2 border-red-800 bg-white sm:w-80">
    <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-3 text-xs font-black text-red-800 marker:content-none">
      <span className="inline-flex items-center gap-2"><Trash2 className="h-3.5 w-3.5" /> Clear lead list</span>
      <span className="font-mono text-[9px] uppercase text-red-800/60">{total.toLocaleString()} leads</span>
    </summary>
    <form action={action} className="border-t-2 border-red-800 bg-red-50 p-3" onSubmit={(event) => {
      if (!window.confirm(`Permanently delete all ${total.toLocaleString()} leads, including their attempts and bookings? This cannot be undone.`)) event.preventDefault();
    }}>
      <p className="text-[11px] font-bold leading-5 text-red-950">Use this when you want a clean campaign and plan to upload only the approved audience.</p>
      <label className="mt-3 flex items-start gap-2 text-[11px] font-bold leading-4 text-red-950"><input className="mt-0.5 accent-red-800" name="clear_confirmation" required type="checkbox" />I understand this permanently deletes every lead, attempt, and booking for this customer.</label>
      <button className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 bg-red-800 px-3 text-xs font-black text-white transition-transform duration-100 active:scale-[0.97]" type="submit"><Trash2 className="h-3.5 w-3.5" /> Delete all {total.toLocaleString()} leads</button>
    </form>
  </details>;
}
