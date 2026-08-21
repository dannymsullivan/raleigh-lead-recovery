import { normalizeUsPhone } from "./reactivation";
import { assessOpportunityDate } from "./lead-eligibility";

export const leadFieldKeys = [
  "external_id",
  "company",
  "brand",
  "full_name",
  "first_name",
  "last_name",
  "phone",
  "email",
  "status",
  "status_changed_at",
  "inquired_at",
  "job_name",
  "job_type",
  "job_date",
  "closed_reason",
  "source",
  "address",
  "notes"
] as const;

export type LeadFieldKey = (typeof leadFieldKeys)[number];
export type LeadColumnMapping = Partial<Record<LeadFieldKey, string>>;
export type LeadBucket = "ready_to_reengage" | "price_sensitive" | "timing_or_capacity" | "lost_elsewhere" | "disrupted" | "review" | "exclude";

export type SpreadsheetData = {
  headers: string[];
  rows: string[][];
  totalRows: number;
  truncated: boolean;
};

export type NormalizedImportedLead = {
  rowNumber: number;
  externalId: string | null;
  company: string | null;
  brand: string | null;
  name: string;
  phoneE164: string | null;
  email: string | null;
  source: string | null;
  leadAgeDays: number | null;
  notes: string | null;
  bucket: LeadBucket;
  bucketReason: string;
  agentContext: string;
  metadata: Record<string, string>;
};

export type LeadImportAnalysis = {
  mapping: LeadColumnMapping;
  rows: NormalizedImportedLead[];
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  missingPhoneRows: number;
  missingNameRows: number;
  bucketCounts: Record<LeadBucket, number>;
  callableBucketCounts: Record<LeadBucket, number>;
  bucketSamples: Record<LeadBucket, NormalizedImportedLead[]>;
};

export const leadFieldOptions: Array<{ key: LeadFieldKey; label: string; description: string }> = [
  { key: "external_id", label: "Record ID", description: "CRM or source-system identifier" },
  { key: "company", label: "Parent company", description: "Owning company or account" },
  { key: "brand", label: "Brand", description: "Customer-facing business or location" },
  { key: "full_name", label: "Full name", description: "Contact name in one column" },
  { key: "first_name", label: "First name", description: "Used with last name when full name is absent" },
  { key: "last_name", label: "Last name", description: "Used with first name when full name is absent" },
  { key: "phone", label: "Phone", description: "Required before Mabel can call" },
  { key: "email", label: "Email", description: "Optional contact email" },
  { key: "status", label: "Lead status", description: "Current or final CRM stage" },
  { key: "status_changed_at", label: "Status changed", description: "When the current stage was set" },
  { key: "inquired_at", label: "Inquiry date", description: "When the lead first reached out" },
  { key: "job_name", label: "Opportunity / job", description: "Project, event, estimate, or opportunity name" },
  { key: "job_type", label: "Job type", description: "Service, event, or project category" },
  { key: "job_date", label: "Job date", description: "Requested or scheduled date" },
  { key: "closed_reason", label: "Closed / lost reason", description: "Why the opportunity did not close" },
  { key: "source", label: "Lead source", description: "Website, referral, ads, or other source" },
  { key: "address", label: "Address / location", description: "Service or event location" },
  { key: "notes", label: "Notes", description: "Prior conversation context" }
];

const aliases: Record<LeadFieldKey, string[]> = {
  external_id: ["id", "lead_id", "contact_id", "record_id", "customer_id", "opportunity_id"],
  company: ["company", "company_name", "parent_company", "account", "account_name", "organization"],
  brand: ["brand", "business_unit", "location_name", "branch"],
  full_name: ["name", "full_name", "contact_name", "lead_name", "customer_name", "client_name"],
  first_name: ["first_name", "firstname", "given_name", "contact_first_name"],
  last_name: ["last_name", "lastname", "surname", "family_name", "contact_last_name"],
  phone: ["phone", "phone_number", "mobile", "mobile_phone", "cell", "cell_phone", "telephone", "contact_phone", "primary_phone"],
  email: ["email", "email_address", "contact_email", "primary_email"],
  status: ["status", "lead_status", "stage", "pipeline_stage", "opportunity_status"],
  status_changed_at: ["status_changed", "status_changed_at", "stage_changed", "stage_changed_at", "closed_at"],
  inquired_at: ["inquired", "inquired_at", "inquiry_date", "created", "created_at", "lead_created", "lead_date", "received_at"],
  job_name: ["job_name", "opportunity", "opportunity_name", "project", "project_name", "event_name", "estimate_name"],
  job_type: ["job_type", "service", "service_type", "project_type", "event_type", "category"],
  job_date: ["job_date", "service_date", "event_date", "appointment_date", "requested_date", "project_date"],
  closed_reason: ["closed_reason", "lost_reason", "close_reason", "disposition", "outcome", "reason"],
  source: ["source", "lead_source", "marketing_source", "channel", "origin"],
  address: ["address", "service_address", "event_address", "property_address", "location", "venue"],
  notes: ["notes", "note", "context", "description", "comments", "details", "last_note"]
};

const bucketLabels: Record<LeadBucket, string> = {
  ready_to_reengage: "Ready to re-engage",
  price_sensitive: "Price-sensitive",
  timing_or_capacity: "Timing / capacity",
  lost_elsewhere: "Lost elsewhere",
  disrupted: "Canceled / disrupted",
  review: "Needs review",
  exclude: "Exclude"
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function headerKey(value: string): string {
  return value.trim().toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function valueAt(row: string[], headers: string[], mapping: LeadColumnMapping, key: LeadFieldKey): string {
  const header = mapping[key];
  if (!header) return "";
  const index = headers.indexOf(header);
  return index < 0 ? "" : (row[index] ?? "").trim();
}

function firstNonempty(...values: string[]): string {
  return values.find((value) => value.trim())?.trim() ?? "";
}

function parseDate(value: string): Date | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const date = /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ? new Date(`${trimmed}T12:00:00Z`) : new Date(trimmed);
  return Number.isNaN(date.getTime()) ? null : date;
}

function normalizeEmail(value: string): string | null {
  const email = value.trim().toLowerCase();
  return emailPattern.test(email) ? email.slice(0, 320) : null;
}

function containsAny(value: string, terms: string[]): string | null {
  const normalized = value.toLowerCase();
  return terms.find((term) => normalized.includes(term)) ?? null;
}

export function classifyLeadBucket(status: string, closedReason: string): { bucket: LeadBucket; reason: string } {
  const signal = `${status} ${closedReason}`.trim().toLowerCase();
  const excluded = containsAny(signal, ["ignore", "duplicate", "spam", "fishing", "test", "delete", "do not call", "rude", "legal"]);
  if (excluded) return { bucket: "exclude", reason: `Matched exclusion signal “${excluded}”` };
  const price = containsAny(signal, ["budget", "price", "pricing", "credit", "cost", "expensive"]);
  if (price) return { bucket: "price_sensitive", reason: `Price signal “${price}”` };
  const ready = containsAny(signal, ["ghost", "stale", "more info", "not ready", "need more", "follow up", "proposal", "priority", "qualified", "annual"]);
  if (ready) return { bucket: "ready_to_reengage", reason: `Follow-up signal “${ready}”` };
  const disrupted = containsAny(signal, ["cancel", "covid", "hurricane", "weather", "emergency", "reschedul"]);
  if (disrupted) return { bucket: "disrupted", reason: `Disruption signal “${disrupted}”` };
  const competitor = containsAny(signal, ["booked other", "other vendor", "different direction", "lost", "already booked"]);
  if (competitor) return { bucket: "lost_elsewhere", reason: `Competitive-loss signal “${competitor}”` };
  const timing = containsAny(signal, ["unavailable", "distance", "location", "date", "too far", "last minute", "busy", "out of state", "residence", "spacing"]);
  if (timing) return { bucket: "timing_or_capacity", reason: `Timing or capacity signal “${timing}”` };
  return { bucket: "review", reason: signal ? "No high-confidence rule matched" : "No status or closed reason was provided" };
}

export function inferLeadColumnMapping(headers: string[], rows: string[][] = []): LeadColumnMapping {
  const mapping: LeadColumnMapping = {};
  const normalized = headers.map(headerKey);
  for (const key of leadFieldKeys) {
    const index = normalized.findIndex((header) => aliases[key].includes(header));
    if (index >= 0) mapping[key] = headers[index];
  }

  const sample = rows.slice(0, 100);
  if (!mapping.email) {
    const index = headers.findIndex((_, column) => {
      const values = sample.map((row) => row[column]?.trim()).filter(Boolean) as string[];
      return values.length >= 3 && values.filter((value) => emailPattern.test(value)).length / values.length >= 0.8;
    });
    if (index >= 0) mapping.email = headers[index];
  }
  if (!mapping.phone) {
    const index = headers.findIndex((_, column) => {
      const values = sample.map((row) => row[column]?.trim()).filter(Boolean) as string[];
      return values.length >= 3 && values.filter((value) => Boolean(normalizeUsPhone(value))).length / values.length >= 0.8;
    });
    if (index >= 0) mapping.phone = headers[index];
  }
  return mapping;
}

export function buildLeadAgentContext(lead: {
  company?: string | null;
  brand?: string | null;
  status?: string;
  closedReason?: string;
  inquiredAt?: string;
  jobName?: string;
  jobType?: string;
  jobDate?: string;
  source?: string;
  address?: string;
  notes?: string;
  bucketReason?: string;
}): string {
  const parts = [
    lead.brand ? `Brand: ${lead.brand}` : "",
    lead.company && lead.company !== lead.brand ? `Parent company: ${lead.company}` : "",
    lead.jobName ? `Prior opportunity: ${lead.jobName}` : "",
    lead.jobType ? `Type: ${lead.jobType}` : "",
    lead.jobDate ? `Requested date: ${lead.jobDate}` : "",
    lead.inquiredAt ? `Inquired: ${lead.inquiredAt}` : "",
    lead.status ? `Prior status: ${lead.status}` : "",
    lead.closedReason ? `Why it closed: ${lead.closedReason}` : "",
    lead.source ? `Source: ${lead.source}` : "",
    lead.address ? `Location: ${lead.address}` : "",
    lead.notes ? `Notes: ${lead.notes}` : "",
    lead.bucketReason ? `Import signal: ${lead.bucketReason}` : ""
  ].filter(Boolean);
  return parts.join("\n").slice(0, 2000);
}

export function analyzeLeadRows(headers: string[], rows: string[][], suppliedMapping?: LeadColumnMapping, now = new Date(), serviceType = ""): LeadImportAnalysis {
  const mapping = suppliedMapping ?? inferLeadColumnMapping(headers, rows);
  const seen = new Set<string>();
  const normalizedRows: NormalizedImportedLead[] = [];
  const bucketCounts = Object.fromEntries(Object.keys(bucketLabels).map((key) => [key, 0])) as Record<LeadBucket, number>;
  const callableBucketCounts = Object.fromEntries(Object.keys(bucketLabels).map((key) => [key, 0])) as Record<LeadBucket, number>;
  const bucketSamples = Object.fromEntries((Object.keys(bucketLabels) as LeadBucket[]).map((key) => [key, [] as NormalizedImportedLead[]])) as Record<LeadBucket, NormalizedImportedLead[]>;
  let invalidRows = 0;
  let duplicateRows = 0;
  let missingPhoneRows = 0;
  let missingNameRows = 0;

  rows.forEach((row, index) => {
    const fullName = valueAt(row, headers, mapping, "full_name");
    const firstName = valueAt(row, headers, mapping, "first_name");
    const lastName = valueAt(row, headers, mapping, "last_name");
    const jobName = valueAt(row, headers, mapping, "job_name");
    const name = firstNonempty(fullName, `${firstName} ${lastName}`.trim());
    const phoneE164 = normalizeUsPhone(valueAt(row, headers, mapping, "phone"));
    const email = normalizeEmail(valueAt(row, headers, mapping, "email"));
    const status = valueAt(row, headers, mapping, "status");
    const closedReason = valueAt(row, headers, mapping, "closed_reason");
    const inquiredAt = valueAt(row, headers, mapping, "inquired_at");
    const company = valueAt(row, headers, mapping, "company") || null;
    const brand = valueAt(row, headers, mapping, "brand") || null;
    const source = valueAt(row, headers, mapping, "source") || null;
    const notesValue = valueAt(row, headers, mapping, "notes");
    const jobDate = valueAt(row, headers, mapping, "job_date");
    const dateEligibility = assessOpportunityDate({ serviceType, jobDate }, now);
    const semanticBucket = classifyLeadBucket(status, closedReason);
    const bucketResult = dateEligibility.required && !dateEligibility.eligible
      ? { bucket: "exclude" as const, reason: `${dateEligibility.label}${dateEligibility.rawDate ? ` (${dateEligibility.rawDate})` : ""}` }
      : dateEligibility.status === "future"
        ? { ...semanticBucket, reason: `Future event confirmed (${dateEligibility.rawDate}) · ${semanticBucket.reason}` }
        : semanticBucket;
    bucketCounts[bucketResult.bucket] += 1;
    const inquiredDate = parseDate(inquiredAt);
    const leadAgeDays = inquiredDate ? Math.max(0, Math.floor((now.getTime() - inquiredDate.getTime()) / 86_400_000)) : null;
    const metadata = Object.fromEntries(headers.map((header, column) => [header, (row[column] ?? "").slice(0, 2000)]).filter(([, value]) => value));
    const agentContext = buildLeadAgentContext({
      company,
      brand,
      status,
      closedReason,
      inquiredAt,
      jobName,
      jobType: valueAt(row, headers, mapping, "job_type"),
      jobDate,
      source: source ?? "",
      address: valueAt(row, headers, mapping, "address"),
      notes: notesValue,
      bucketReason: bucketResult.reason
    });

    if (!phoneE164) missingPhoneRows += 1;
    if (!name) missingNameRows += 1;
    const duplicate = Boolean(phoneE164 && seen.has(phoneE164));
    if (!phoneE164 || !name || bucketResult.bucket === "exclude") invalidRows += 1;
    else if (duplicate) duplicateRows += 1;
    else {
      seen.add(phoneE164);
      callableBucketCounts[bucketResult.bucket] += 1;
    }

    const normalizedLead: NormalizedImportedLead = {
      rowNumber: index + 2,
      externalId: valueAt(row, headers, mapping, "external_id") || null,
      company,
      brand,
      name: name.slice(0, 160),
      phoneE164,
      email,
      source,
      leadAgeDays,
      notes: agentContext || notesValue.slice(0, 2000) || null,
      bucket: bucketResult.bucket,
      bucketReason: bucketResult.reason,
      agentContext,
      metadata
    };
    normalizedRows.push(normalizedLead);
    if (bucketSamples[bucketResult.bucket].length < 25 && (bucketResult.bucket === "exclude" || (phoneE164 && name && !duplicate))) bucketSamples[bucketResult.bucket].push(normalizedLead);
  });

  return {
    mapping,
    rows: normalizedRows,
    validRows: seen.size,
    invalidRows,
    duplicateRows,
    missingPhoneRows,
    missingNameRows,
    bucketCounts,
    callableBucketCounts,
    bucketSamples
  };
}

export function bucketLabel(bucket: LeadBucket): string {
  return bucketLabels[bucket];
}

export function parseCsvRows(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    if (char === '"') {
      if (quoted && input[index + 1] === '"') { field += '"'; index += 1; }
      else quoted = !quoted;
    } else if (char === "," && !quoted) { row.push(field.trim()); field = ""; }
    else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && input[index + 1] === "\n") index += 1;
      row.push(field.trim()); field = "";
      if (row.some(Boolean)) rows.push(row);
      row = [];
    } else field += char;
  }
  row.push(field.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}
