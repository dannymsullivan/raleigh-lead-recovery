"use client";

import { useRef, useState, useTransition } from "react";
import { AlertTriangle, Check, Eye, FileSpreadsheet, Loader2, RefreshCw, ShieldCheck, Upload } from "lucide-react";
import { bucketLabel, leadFieldOptions, type LeadBucket, type LeadColumnMapping, type LeadFieldKey } from "@/lib/lead-import";
import type { LeadUploadTicket } from "@/lib/lead-upload-server";
import { importMappedReactivationLeadsAction, prepareLeadSpreadsheetUploadAction, previewLeadSpreadsheetAction, type LeadSpreadsheetPreview } from "./actions";

const primaryFields: LeadFieldKey[] = ["full_name", "first_name", "last_name", "phone", "email", "external_id"];
const bucketOrder = ["ready_to_reengage", "price_sensitive", "timing_or_capacity", "lost_elsewhere", "disrupted", "review", "exclude"] as const;

type PreviewAction = (formData: FormData) => Promise<LeadSpreadsheetPreview>;
type ImportAction = (formData: FormData) => Promise<void>;
type UploadAction = (formData: FormData) => Promise<LeadUploadTicket>;

export function LeadImporter({ campaignId, previewAction, importAction, uploadAction, allowReplace = false, compact = false, dateSensitive = false }: { campaignId: string; previewAction?: PreviewAction; importAction?: ImportAction; uploadAction?: UploadAction; allowReplace?: boolean; compact?: boolean; dateSensitive?: boolean }) {
  const formRef = useRef<HTMLFormElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<LeadSpreadsheetPreview | null>(null);
  const [mapping, setMapping] = useState<LeadColumnMapping>({});
  const [uploadPath, setUploadPath] = useState("");
  const [fileName, setFileName] = useState("");
  const [importMode, setImportMode] = useState<"append" | "replace">("append");
  const [activeBucket, setActiveBucket] = useState<LeadBucket>("ready_to_reengage");
  const [includedBuckets, setIncludedBuckets] = useState<LeadBucket[]>(["ready_to_reengage"]);
  const [isPending, startTransition] = useTransition();
  const submitImport = importAction ?? importMappedReactivationLeadsAction.bind(null, campaignId);
  const runPreview = previewAction ?? previewLeadSpreadsheetAction.bind(null, campaignId);
  const prepareUpload = uploadAction ?? prepareLeadSpreadsheetUploadAction.bind(null, campaignId);

  function analyze(file: File, nextMapping?: LeadColumnMapping, existingPath?: string) {
    startTransition(async () => {
      try {
        let path = existingPath;
        if (!path) {
          const request = new FormData();
          request.set("file_name", file.name);
          request.set("file_size", String(file.size));
          const ticket = await prepareUpload(request);
          if (!ticket.ok || !ticket.path || !ticket.signedUrl) throw new Error(ticket.error || "The secure upload could not be prepared.");
          const uploadBody = new FormData();
          uploadBody.append("cacheControl", "3600");
          uploadBody.append("", file);
          const response = await fetch(ticket.signedUrl, { method: "PUT", headers: { "x-upsert": "false" }, body: uploadBody });
          if (!response.ok) throw new Error("The spreadsheet could not be uploaded. Please try again.");
          path = ticket.path;
          setUploadPath(path);
        }
        const data = new FormData();
        data.set("upload_path", path);
        data.set("file_name", file.name);
        if (nextMapping) data.set("column_mapping", JSON.stringify(nextMapping));
        const result = await runPreview(data);
        setPreview(result);
        if (result.mapping) setMapping(result.mapping);
        if (result.ok) {
          setActiveBucket("ready_to_reengage");
          setIncludedBuckets(["ready_to_reengage"]);
        }
      } catch (error) {
        setPreview({ ok: false, error: error instanceof Error ? error.message : "The spreadsheet could not be read." });
      }
    });
  }

  function selectedFile(): File | null {
    return fileRef.current?.files?.[0] ?? null;
  }

  function updateMapping(key: LeadFieldKey, header: string) {
    setMapping((current) => {
      const next = { ...current };
      if (header) next[key] = header;
      else delete next[key];
      return next;
    });
  }

  const hasName = Boolean(mapping.full_name || mapping.first_name || mapping.last_name);
  const selectedLeadCount = includedBuckets.reduce((total, bucket) => total + (preview?.callableBucketCounts?.[bucket] ?? 0), 0);
  const canImport = Boolean(preview?.ok && !preview.truncated && mapping.phone && hasName && selectedLeadCount > 0);

  function toggleBucket(bucket: LeadBucket) {
    if (bucket === "exclude") return;
    setIncludedBuckets((current) => current.includes(bucket) ? current.filter((item) => item !== bucket) : [...current, bucket]);
  }

  return (
    <form action={submitImport} className="border border-black bg-white" ref={formRef}>
      <input name="column_mapping" type="hidden" value={JSON.stringify(mapping)} />
      <input name="included_buckets" type="hidden" value={JSON.stringify(includedBuckets)} />
      <input name="upload_path" type="hidden" value={uploadPath} />
      <input name="file_name" type="hidden" value={fileName} />
      <div className={compact ? "p-5" : "p-6 sm:p-7"}>
        <div className="flex items-start justify-between gap-4">
          <div><p className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-black/45">Step 1 · Upload</p><h2 className={`${compact ? "text-2xl" : "text-3xl"} mt-2 font-black tracking-[-0.05em]`}>{compact ? "Add or replace leads" : "Load your leads."}</h2></div>
          <span className="grid h-10 w-10 place-items-center border border-black bg-[#d8ff57]"><FileSpreadsheet className="h-4 w-4" /></span>
        </div>
        <p className="mt-4 text-sm font-semibold leading-6 text-black/60">{compact ? "Upload another spreadsheet to update this campaign audience." : "Upload the spreadsheet you already have. Raleigh Lead Recovery will map it, clean it, and show what is usable before anything is imported."}</p>

        <label className="mt-5 grid cursor-pointer place-items-center border border-dashed border-black bg-[#faf9f5] px-5 py-6 text-center transition hover:border-black hover:bg-white">
          <Upload className="h-6 w-6" />
          <span className="mt-3 text-sm font-black">Choose CSV or XLSX</span>
          <span className="mt-1 font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-black/40">Up to 10 MB · 25,000 rows</span>
          <input
            accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) { setFileName(file.name); setUploadPath(""); setPreview(null); analyze(file); }
            }}
            ref={fileRef}
            required
            type="file"
          />
        </label>

        {isPending ? <div className="mt-5 flex items-center gap-3 border-2 border-black bg-black p-4 text-sm font-black text-white"><Loader2 className="h-4 w-4 animate-spin" /> Securely uploading and normalizing the spreadsheet…</div> : null}
        {preview?.error ? <div className="mt-5 flex gap-3 border-2 border-black bg-white p-4 text-sm font-bold"><AlertTriangle className="h-5 w-5 flex-none" />{preview.error}</div> : null}
      </div>

      {preview?.ok && preview.headers && preview.sampleRows ? <div className="border-t-2 border-black bg-[#f4f1e8] p-6 sm:p-7">
        <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-black/45">Detected file</p><p className="mt-2 text-lg font-black">{preview.fileName}</p><p className="mt-1 text-xs font-semibold text-black/50">{(preview.totalRows ?? 0).toLocaleString()} rows · {preview.headers.length} columns{preview.truncated ? " · first 25,000 rows analyzed" : ""}</p></div><button className="inline-flex h-10 items-center gap-2 border-2 border-black bg-white px-3 text-xs font-black disabled:opacity-40" disabled={isPending} onClick={() => { const file = selectedFile(); if (file) analyze(file, mapping, uploadPath); }} type="button"><RefreshCw className="h-3.5 w-3.5" /> Re-check mapping</button></div>

        <div className="mt-6 grid grid-cols-2 border-l-2 border-t-2 border-black sm:grid-cols-4">
          <Stat label="Callable" value={preview.validRows ?? 0} accent />
          <Stat label="Missing phone" value={preview.missingPhoneRows ?? 0} />
          <Stat label="Missing name" value={preview.missingNameRows ?? 0} />
          <Stat label="Duplicates" value={preview.duplicateRows ?? 0} />
        </div>

        {!mapping.phone ? <div className="mt-5 border-2 border-black bg-[#ffd7cc] p-4"><p className="text-sm font-black">This file has useful lead history, but no phone column was detected.</p><p className="mt-1 text-xs font-semibold leading-5 text-black/60">The buckets below are still useful. To call these leads, export contact details with the same record ID or choose the correct phone column manually.</p></div> : null}
        {preview.truncated ? <div className="mt-5 border-2 border-black bg-[#ffd7cc] p-4"><p className="text-sm font-black">This file is larger than the 25,000-row import limit.</p><p className="mt-1 text-xs font-semibold leading-5 text-black/60">Split it into smaller files before importing. Raleigh Lead Recovery will not import or replace a list from a partial analysis.</p></div> : null}

        <section className="mt-7"><p className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-black/45">Step 2 · Match your columns</p><div className="mt-3 grid gap-3 sm:grid-cols-2">
          {leadFieldOptions.filter((field) => primaryFields.includes(field.key)).map((field) => <MappingSelect field={field} headers={preview.headers!} mapping={mapping} onChange={updateMapping} key={field.key} />)}
        </div></section>

        <details className="mt-5 border-2 border-black bg-white"><summary className="cursor-pointer list-none p-4 text-sm font-black">Map context fields <span className="ml-2 font-mono text-[9px] uppercase text-black/40">recommended</span></summary><div className="grid gap-3 border-t-2 border-black p-4 sm:grid-cols-2">
          {leadFieldOptions.filter((field) => !primaryFields.includes(field.key)).map((field) => <MappingSelect field={field} headers={preview.headers!} mapping={mapping} onChange={updateMapping} key={field.key} />)}
        </div></details>

        <section className="mt-7"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-black/45">Step 3 · Choose your audience</p><p className="mt-2 text-sm font-semibold text-black/55">Start with the strongest segment. Click any bucket to inspect its leads, then include only the groups Raleigh Lead Recovery should contact.</p>{dateSensitive ? <p className="mt-3 border-l-4 border-black bg-white p-3 text-xs font-black">Event-date rule: Ready to re-engage requires a valid event date after today. Past or missing dates are automatically excluded.</p> : null}</div><span className="border-2 border-black bg-[#d8ff57] px-3 py-2 text-xs font-black">{selectedLeadCount.toLocaleString()} selected</span></div><div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {bucketOrder.map((bucket) => { const included = includedBuckets.includes(bucket); const disabled = bucket === "exclude"; const active = activeBucket === bucket; return <div className={`border-2 ${disabled ? "border-black bg-black text-white" : included ? "border-black bg-[#d8ff57]" : "border-black bg-white"} ${active ? "shadow-[4px_4px_0_#000]" : ""}`} key={bucket}><button aria-pressed={active} className="block min-h-20 w-full p-3 text-left transition hover:-translate-y-0.5" onClick={() => setActiveBucket(bucket)} type="button"><span className="flex items-start justify-between gap-2"><span className="text-xl font-black">{(preview.callableBucketCounts?.[bucket] ?? preview.bucketCounts?.[bucket] ?? 0).toLocaleString()}</span><Eye className="h-4 w-4" /></span><span className={`mt-1 block text-[10px] font-bold uppercase ${disabled ? "text-white/55" : "text-black/45"}`}>{bucketLabel(bucket)}</span></button><label className={`flex min-h-9 items-center gap-2 border-t-2 px-3 text-[10px] font-black uppercase ${disabled ? "border-white/30" : "border-black"}`}><input aria-label={`Include ${bucketLabel(bucket)}`} checked={included} className="accent-black" disabled={disabled} onChange={() => toggleBucket(bucket)} type="checkbox" />{disabled ? "Never import" : included ? "Included" : "Not included"}</label></div>; })}
        </div>
        <div className="mt-4 border-2 border-black bg-white"><div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-black p-4"><div><p className="font-black">{bucketLabel(activeBucket)}</p><p className="mt-1 text-xs font-semibold text-black/45">Showing up to 25 sample leads from this file.</p></div>{activeBucket !== "exclude" ? <button className="h-9 border-2 border-black px-3 text-xs font-black" onClick={() => toggleBucket(activeBucket)} type="button">{includedBuckets.includes(activeBucket) ? "Remove from import" : "Include this bucket"}</button> : null}</div><div className="max-h-80 overflow-auto divide-y divide-black/15">{preview.bucketSamples?.[activeBucket]?.length ? preview.bucketSamples[activeBucket].map((lead) => <div className="grid gap-1 px-4 py-3 sm:grid-cols-[minmax(180px,0.5fr)_1fr]" key={`${lead.rowNumber}-${lead.phoneE164 ?? lead.name}`}><div><p className="text-sm font-black">{lead.name || `Row ${lead.rowNumber}`}</p><p className="text-[11px] font-semibold text-black/40">{lead.phoneE164 || "No callable phone"}</p></div><div><p className="text-xs font-bold text-black/65">{lead.bucketReason}</p><p className="mt-1 line-clamp-2 text-[11px] font-semibold text-black/40">{lead.agentContext || "No additional context was mapped."}</p></div></div>) : <p className="p-5 text-sm font-semibold text-black/45">No rows landed in this bucket.</p>}</div></div></section>

        <details className="mt-5 border-2 border-black bg-white"><summary className="cursor-pointer list-none p-4 text-sm font-black">Preview original rows</summary><div className="overflow-x-auto border-t-2 border-black"><table className="min-w-full whitespace-nowrap text-left text-xs"><thead className="bg-black text-white"><tr>{preview.headers.map((header) => <th className="px-3 py-2 font-black" key={header}>{header}</th>)}</tr></thead><tbody>{preview.sampleRows.map((row, rowIndex) => <tr className="border-b border-black/15" key={rowIndex}>{preview.headers!.map((header, column) => <td className="max-w-64 overflow-hidden text-ellipsis px-3 py-2 font-semibold" key={header}>{row[column] || "—"}</td>)}</tr>)}</tbody></table></div></details>

        <p className="mt-7 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-black/45">Step 4 · Confirm &amp; import</p>
        <label className="mt-3 flex items-start gap-3 border-2 border-black bg-white p-4 text-xs font-bold leading-5"><input className="mt-1 h-4 w-4 flex-none accent-black" name="eligibility_attestation" required type="checkbox" />I confirm these people previously inquired or otherwise gave permission to be contacted, and the list has been checked against applicable opt-out requirements.</label>
        {allowReplace ? <fieldset className="mt-4 border-2 border-black bg-white p-4"><legend className="px-2 font-mono text-[9px] font-bold uppercase tracking-[0.14em]">Import behavior</legend><div className="grid gap-3 sm:grid-cols-2"><label className={`flex cursor-pointer items-start gap-3 border-2 border-black p-3 ${importMode === "append" ? "bg-[#d8ff57]" : "bg-white"}`}><input className="mt-1 accent-black" checked={importMode === "append"} name="import_mode" onChange={() => setImportMode("append")} type="radio" value="append" /><span><span className="block text-sm font-black">Add and update</span><span className="mt-1 block text-[10px] font-semibold leading-4 text-black/50">Keep existing leads and add new phone numbers.</span></span></label><label className={`flex cursor-pointer items-start gap-3 border-2 border-black p-3 ${importMode === "replace" ? "bg-[#ffd7cc]" : "bg-white"}`}><input className="mt-1 accent-black" checked={importMode === "replace"} name="import_mode" onChange={() => setImportMode("replace")} type="radio" value="replace" /><span><span className="block text-sm font-black">Replace campaign list</span><span className="mt-1 block text-[10px] font-semibold leading-4 text-black/50">Remove contacts absent from this validated file.</span></span></label></div>{importMode === "replace" ? <label className="mt-3 flex items-start gap-3 border-l-4 border-red-700 bg-red-50 p-3 text-xs font-bold leading-5 text-red-900"><input className="mt-1 accent-red-700" name="replace_confirmation" required type="checkbox" />I understand this replaces the current campaign list and removes its unmatched contacts, attempts, and bookings.</label> : null}</fieldset> : <input name="import_mode" type="hidden" value="append" />}
        <button className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 bg-black px-4 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-35" disabled={!canImport || isPending} type="submit"><ShieldCheck className="h-4 w-4" /> {importMode === "replace" ? "Replace with" : "Import"} {selectedLeadCount ? `${selectedLeadCount.toLocaleString()} selected leads` : "selected leads"}</button>
        {!hasName ? <p className="mt-3 text-center text-xs font-bold text-black/55">Map a full name or first/last name before importing.</p> : null}
      </div> : null}
    </form>
  );
}

function MappingSelect({ field, headers, mapping, onChange }: { field: (typeof leadFieldOptions)[number]; headers: string[]; mapping: LeadColumnMapping; onChange: (key: LeadFieldKey, header: string) => void }) {
  return <label className="block border-2 border-black bg-white p-3"><span className="flex items-center justify-between gap-2 text-xs font-black">{field.label}{mapping[field.key] ? <Check className="h-3.5 w-3.5" /> : null}</span><span className="mt-1 block text-[10px] font-semibold text-black/40">{field.description}</span><select className="mt-3 h-10 w-full border border-black bg-white px-2 text-xs font-bold outline-none focus:shadow-[3px_3px_0_#000]" value={mapping[field.key] ?? ""} onChange={(event) => onChange(field.key, event.target.value)}><option value="">Not mapped</option>{headers.map((header) => <option value={header} key={header}>{header}</option>)}</select></label>;
}

function Stat({ label, value, accent = false }: { label: string; value: number; accent?: boolean }) {
  return <div className={`border-b-2 border-r-2 border-black p-3 ${accent ? "bg-[#d8ff57]" : "bg-white"}`}><p className="text-2xl font-black">{value.toLocaleString()}</p><p className="mt-1 font-mono text-[8px] font-bold uppercase tracking-[0.12em] text-black/45">{label}</p></div>;
}
