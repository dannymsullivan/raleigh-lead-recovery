import Link from "next/link";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { bucketLabel, type LeadBucket } from "@/lib/lead-import";
import { assessOpportunityDate } from "@/lib/lead-eligibility";
import { daysUntilEvent, leadEventTypeLabel, leadSegments, leadUrgencyLabel, urgencyBandForDate } from "@/lib/lead-enrichment";
import type { ReactivationContact } from "@/lib/types";

export const leadPageSize = 20;
export const leadBuckets: LeadBucket[] = ["ready_to_reengage", "price_sensitive", "timing_or_capacity", "lost_elsewhere", "disrupted", "review", "exclude"];
export const leadStatuses = ["queued", "calling", "interested", "follow_up", "booked", "contacted", "not_interested", "completed_project", "wrong_number", "do_not_call", "no_answer", "failed"] as const;

export function firstParam(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : "";
}

export function pageNumber(value: string | string[] | undefined): number {
  const parsed = Number(firstParam(value));
  return Number.isFinite(parsed) ? Math.max(1, Math.floor(parsed)) : 1;
}

export function leadListHref(basePath: string, values: { search?: string; bucket?: string; status?: string; segment?: string; page?: number }): string {
  const params = new URLSearchParams();
  if (values.search) params.set("lead_search", values.search);
  if (values.bucket) params.set("lead_bucket", values.bucket);
  if (values.status) params.set("lead_status", values.status);
  if (values.segment) params.set("lead_segment", values.segment);
  if (values.page && values.page > 1) params.set("lead_page", String(values.page));
  return `${basePath}${params.size ? `?${params.toString()}` : ""}#leads`;
}

export function LeadFilters({ basePath, search, bucket, status, segment, segmentCounts, total, page, shown }: { basePath: string; search: string; bucket: string; status: string; segment: string; segmentCounts: Record<string, number>; total: number; page: number; shown: number }) {
  const start = total && shown ? (page - 1) * leadPageSize + 1 : 0;
  const end = start ? start + shown - 1 : 0;
  return <div className="border-b border-black bg-[#f4f1e8] p-4 sm:p-5">
    <nav aria-label="Audience segments" className="mb-4 flex flex-wrap gap-1.5">
      <Link className={`inline-flex min-h-9 items-center gap-2 rounded-sm border px-3 py-2 text-[11px] font-black ${!segment ? "border-black bg-[#d8ff57]" : "border-black/20 bg-white hover:border-black/45"}`} href={leadListHref(basePath, { search, bucket, status })}><span>All qualified</span><span className="font-mono text-[9px] text-black/45">{(segmentCounts.all ?? 0).toLocaleString()}</span></Link>
      {leadSegments.map((item) => <Link className={`inline-flex min-h-9 items-center gap-2 rounded-sm border px-3 py-2 text-[11px] font-black ${segment === item.key ? "border-black bg-[#d8ff57]" : "border-black/20 bg-white hover:border-black/45"}`} href={leadListHref(basePath, { search, bucket, status, segment: item.key })} key={item.key}><span>{item.label}</span><span className="font-mono text-[9px] text-black/45">{(segmentCounts[item.key] ?? 0).toLocaleString()}</span></Link>)}
    </nav>
    <form action={basePath} className="grid gap-2 lg:grid-cols-[minmax(220px,1fr)_210px_190px_auto]" method="get">
      {segment ? <input name="lead_segment" type="hidden" value={segment} /> : null}
      <label className="relative"><span className="sr-only">Search leads</span><Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-black/35" /><input className="h-11 w-full border-2 border-black bg-white pl-9 pr-3 text-sm font-semibold outline-none focus:shadow-[3px_3px_0_#000]" defaultValue={search} name="lead_search" placeholder="Search name or phone" /></label>
      <label><span className="sr-only">Filter by bucket</span><select className="h-11 w-full border-2 border-black bg-white px-3 text-xs font-black" defaultValue={bucket} name="lead_bucket"><option value="eligible">Qualified audience</option><option value="all">All leads, including excluded</option>{leadBuckets.map((item) => <option key={item} value={item}>{bucketLabel(item)}</option>)}</select></label>
      <label><span className="sr-only">Filter by status</span><select className="h-11 w-full border-2 border-black bg-white px-3 text-xs font-black" defaultValue={status} name="lead_status"><option value="">All outcomes</option>{leadStatuses.map((item) => <option key={item} value={item}>{item.replaceAll("_", " ")}</option>)}</select></label>
      <button className="h-11 bg-black px-5 text-xs font-black text-white" type="submit">Apply filters</button>
    </form>
    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-black/45"><span>{total.toLocaleString()} matching lead{total === 1 ? "" : "s"}{shown ? ` · showing ${start.toLocaleString()}–${end.toLocaleString()}` : ""}</span>{search || bucket !== "eligible" || status || segment ? <Link className="font-black text-black underline underline-offset-4" href={`${basePath}#leads`}>Reset filters</Link> : null}</div>
  </div>;
}

export function LeadPagination({ basePath, search, bucket, status, segment, page, total }: { basePath: string; search: string; bucket: string; status: string; segment: string; page: number; total: number }) {
  const pages = Math.max(1, Math.ceil(total / leadPageSize));
  if (pages <= 1) return null;
  return <nav aria-label="Lead pages" className="flex items-center justify-between border-t border-black bg-[#f4f1e8] p-4 text-xs font-black"><Link aria-disabled={page <= 1} className={`inline-flex h-10 items-center gap-2 border border-black bg-white px-3 ${page <= 1 ? "pointer-events-none opacity-35" : ""}`} href={leadListHref(basePath, { search, bucket, status, segment, page: page - 1 })}><ChevronLeft className="h-4 w-4" /> Previous</Link><span>Page {page.toLocaleString()} of {pages.toLocaleString()}</span><Link aria-disabled={page >= pages} className={`inline-flex h-10 items-center gap-2 border border-black bg-white px-3 ${page >= pages ? "pointer-events-none opacity-35" : ""}`} href={leadListHref(basePath, { search, bucket, status, segment, page: page + 1 })}>Next <ChevronRight className="h-4 w-4" /></Link></nav>;
}

export function LeadContext({ contact, serviceType = "" }: { contact: ReactivationContact; serviceType?: string }) {
  const metadata = contact.import_metadata ?? {};
  const dateEligibility = assessOpportunityDate({ serviceType, metadata, notes: contact.notes });
  const useful = ["Job Name", "Job Type", "Job Date", "Status", "Closed Reason", "Source", "Address"].flatMap((key) => metadata[key] ? [[key, metadata[key]]] : []);
  const urgency = urgencyBandForDate(contact.event_date || dateEligibility.rawDate);
  const days = daysUntilEvent(contact.event_date || dateEligibility.rawDate);
  const eventType = contact.event_type && contact.event_type !== "unknown" && contact.event_type !== "other" ? leadEventTypeLabel(contact.event_type) : null;
  if (!contact.notes && !useful.length && !dateEligibility.required && !eventType) return null;
  return <div className="mt-3"><div className="flex flex-wrap gap-1.5">{eventType ? <span className="rounded-sm border border-black/20 bg-white px-2 py-1 text-[10px] font-black">{eventType}</span> : null}{urgency !== "unknown" ? <span className={`rounded-sm border px-2 py-1 text-[10px] font-black ${urgency === "urgent_14" ? "border-black bg-[#d8ff57]" : "border-black/20 bg-white"}`}>{leadUrgencyLabel(urgency)}{days !== null ? ` · ${days}d` : ""}</span> : null}{contact.priority_score ? <span className="rounded-sm border border-black/20 bg-white px-2 py-1 font-mono text-[9px] font-bold text-black/50">Priority {contact.priority_score}</span> : null}</div><details className="mt-2 border-l-2 border-black bg-black/[0.035] px-3 py-2"><summary className="cursor-pointer text-xs font-black">Why this lead is here</summary><div className="mt-3 grid gap-3 text-xs font-semibold text-black/60">{dateEligibility.required ? <div className={`border p-3 ${dateEligibility.eligible ? "border-black/20 bg-[#d8ff57]" : "border-black bg-[#ffd7cc]"}`}><p className="font-mono text-[8px] font-bold uppercase tracking-[0.12em]">Date eligibility</p><p className="mt-1 font-black text-black">{dateEligibility.label}{dateEligibility.rawDate ? ` · ${dateEligibility.rawDate}` : ""}</p><p className="mt-1 text-[10px] font-semibold text-black/55">Event campaigns contact only leads with a confirmed date after today.</p></div> : null}{contact.notes ? <p className="whitespace-pre-line leading-5">{contact.notes}</p> : null}{useful.length ? <dl className="grid gap-2 sm:grid-cols-2">{useful.map(([label, value]) => <div key={label}><dt className="font-mono text-[8px] font-bold uppercase text-black/35">{label}</dt><dd className="mt-1 font-bold text-black/65">{value}</dd></div>)}</dl> : null}</div></details></div>;
}

export function ImportReceipt({ imported, skipped, suppressed, buckets, replaced }: { imported: string; skipped: string; suppressed: string; buckets: string; replaced: boolean }) {
  const labels = buckets.split(",").filter((item): item is LeadBucket => leadBuckets.includes(item as LeadBucket)).map(bucketLabel);
  return <div className="mt-7 border-2 border-black bg-[#d8ff57] p-5"><p className="font-mono text-[9px] font-bold uppercase tracking-[0.16em]">Import complete</p><div className="mt-3 grid gap-3 sm:grid-cols-3"><div><strong className="text-2xl font-black">{Number(imported).toLocaleString()}</strong><span className="ml-2 text-xs font-bold">{replaced ? "loaded after replacement" : "imported"}</span></div><div><strong className="text-2xl font-black">{Number(skipped).toLocaleString()}</strong><span className="ml-2 text-xs font-bold">not imported</span></div><div><strong className="text-2xl font-black">{Number(suppressed).toLocaleString()}</strong><span className="ml-2 text-xs font-bold">suppressed</span></div></div>{labels.length ? <p className="mt-4 border-t-2 border-black/20 pt-3 text-xs font-bold">Audience: {labels.join(" · ")}</p> : null}</div>;
}
