export type OpportunityDateEligibility = {
  required: boolean;
  status: "not_required" | "future" | "past" | "missing" | "invalid";
  rawDate: string | null;
  date: Date | null;
  eligible: boolean;
  label: string;
};

const dateSensitiveTerms = ["event", "wedding", "photo booth", "photobooth", "venue", "party"];
const dateKeys = ["job_date", "service_date", "event_date", "appointment_date", "requested_date", "project_date"];

function normalizedKey(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

export function isDateSensitiveService(serviceType: string): boolean {
  const normalized = serviceType.toLowerCase();
  return dateSensitiveTerms.some((term) => normalized.includes(term));
}

export function opportunityDateFromContext(metadata: Record<string, string> | null | undefined, notes?: string | null): string | null {
  for (const [key, value] of Object.entries(metadata ?? {})) {
    if (dateKeys.includes(normalizedKey(key)) && value.trim()) return value.trim();
  }
  return notes?.match(/Requested date:\s*([^\n]+)/i)?.[1]?.trim() ?? null;
}

export function assessOpportunityDate(input: { serviceType: string; jobDate?: string | null; metadata?: Record<string, string> | null; notes?: string | null }, now = new Date()): OpportunityDateEligibility {
  const required = isDateSensitiveService(input.serviceType);
  if (!required) return { required, status: "not_required", rawDate: null, date: null, eligible: true, label: "Date not required for this campaign" };
  const rawDate = input.jobDate?.trim() || opportunityDateFromContext(input.metadata, input.notes);
  if (!rawDate) return { required, status: "missing", rawDate: null, date: null, eligible: false, label: "Event date missing" };
  const date = /^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? new Date(`${rawDate}T12:00:00Z`) : new Date(rawDate);
  if (Number.isNaN(date.getTime())) return { required, status: "invalid", rawDate, date: null, eligible: false, label: "Event date needs review" };
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const eventDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  if (eventDay <= today) return { required, status: "past", rawDate, date, eligible: false, label: "Event date has passed" };
  return { required, status: "future", rawDate, date, eligible: true, label: "Future event confirmed" };
}
