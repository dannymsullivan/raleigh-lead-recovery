"use client";

import { ArchiveX } from "lucide-react";

export function RemoveExcludedLeads({ action, total }: { action: (formData: FormData) => void | Promise<void>; total: number }) {
  if (!total) return null;

  return <details className="group w-full border border-black bg-white sm:w-64">
    <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-3 text-xs font-black marker:content-none">
      <span className="inline-flex items-center gap-2"><ArchiveX className="h-3.5 w-3.5" /> Remove excluded</span>
      <span className="font-mono text-[9px] uppercase text-black/45">{total.toLocaleString()}</span>
    </summary>
    <form action={action} className="border-t border-black bg-[#faf9f5] p-3" onSubmit={(event) => {
      if (!window.confirm(`Permanently remove ${total.toLocaleString()} excluded records? Qualified leads will stay in this campaign.`)) event.preventDefault();
    }}>
      <p className="text-[11px] font-bold leading-5 text-black/65">Deletes only records classified as Exclude. The qualified audience and suppression list are preserved.</p>
      <label className="mt-3 flex items-start gap-2 text-[11px] font-bold leading-4"><input className="mt-0.5 accent-black" name="remove_excluded_confirmation" required type="checkbox" />Keep qualified leads and remove excluded records.</label>
      <button className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 bg-black px-3 text-xs font-black text-white" type="submit"><ArchiveX className="h-3.5 w-3.5" /> Remove {total.toLocaleString()} excluded</button>
    </form>
  </details>;
}
