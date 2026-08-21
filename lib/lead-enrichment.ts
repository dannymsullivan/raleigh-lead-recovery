import type { LeadBucket } from "./lead-import";

export const leadEventTypes = ["wedding", "corporate", "school", "birthday", "fundraiser", "community", "private_event", "other", "unknown"] as const;
export type LeadEventType = (typeof leadEventTypes)[number];

export const leadUrgencyBands = ["urgent_14", "near_term_30", "planning_90", "long_range", "unknown"] as const;
export type LeadUrgencyBand = (typeof leadUrgencyBands)[number];

export const leadSegments = [
  { key: "urgent_14", label: "Next 14 days" },
  { key: "near_term_30", label: "15–30 days" },
  { key: "planning_90", label: "31–90 days" },
  { key: "long_range", label: "90+ days" },
  { key: "wedding", label: "Weddings" },
  { key: "corporate", label: "Corporate" },
  { key: "birthday", label: "Birthdays" }
] as const;

export type LeadSegment = (typeof leadSegments)[number]["key"];

export type LeadEnrichment = {
  eventDate: string | null;
  eventType: LeadEventType;
  eventLocation: string | null;
  priorReason: string | null;
  urgencyBand: LeadUrgencyBand;
  priorityScore: number;
  reasons: string[];
};

function clean(value: string | null | undefined, max = 240): string | null {
  const result = value?.replace(/\s+/g, " ").trim();
  return result ? result.slice(0, max) : null;
}

function utcDay(value: Date): Date {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}

export function isoDate(value: string | null | undefined): string | null {
  const raw = clean(value, 100);
  if (!raw) return null;
  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? new Date(`${raw}T12:00:00Z`) : new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  return `${parsed.getUTCFullYear()}-${String(parsed.getUTCMonth() + 1).padStart(2, "0")}-${String(parsed.getUTCDate()).padStart(2, "0")}`;
}

export function daysUntilEvent(eventDate: string | null | undefined, now = new Date()): number | null {
  const normalized = isoDate(eventDate);
  if (!normalized) return null;
  const event = new Date(`${normalized}T12:00:00Z`);
  return Math.round((utcDay(event).getTime() - utcDay(now).getTime()) / 86_400_000);
}

export function urgencyBandForDate(eventDate: string | null | undefined, now = new Date()): LeadUrgencyBand {
  const days = daysUntilEvent(eventDate, now);
  if (days === null || days <= 0) return "unknown";
  if (days <= 14) return "urgent_14";
  if (days <= 30) return "near_term_30";
  if (days <= 90) return "planning_90";
  return "long_range";
}

export function inferEventType(...values: Array<string | null | undefined>): LeadEventType {
  const signal = values.filter(Boolean).join(" ").toLowerCase();
  if (!signal.trim()) return "unknown";
  if (/\b(wedding|bride|groom|bridal|reception|nuptial)\b/.test(signal)) return "wedding";
  if (/\b(corporate|company|conference|trade show|employee|brand activation)\b/.test(signal)) return "corporate";
  if (/\b(prom|homecoming|school|graduation|university|college)\b/.test(signal)) return "school";
  if (/\b(birthday|quincea(?:ñ|n)era|sweet sixteen)\b/.test(signal)) return "birthday";
  if (/\b(fundraiser|charity|nonprofit|non-profit|benefit)\b/.test(signal)) return "fundraiser";
  if (/\b(festival|community|street fair|public event)\b/.test(signal)) return "community";
  if (/\b(party|anniversary|reunion|baby shower|private event)\b/.test(signal)) return "private_event";
  return "unknown";
}

export function enrichLead(input: {
  jobType?: string | null;
  jobName?: string | null;
  jobDate?: string | null;
  address?: string | null;
  status?: string | null;
  closedReason?: string | null;
  notes?: string | null;
  bucket: LeadBucket;
  leadAgeDays?: number | null;
}, now = new Date()): LeadEnrichment {
  const eventDate = isoDate(input.jobDate);
  const eventType = inferEventType(input.jobType, input.jobName, input.notes);
  const urgencyBand = urgencyBandForDate(eventDate, now);
  const eventLocation = clean(input.address);
  const priorReason = clean(input.closedReason || input.status);
  const reasons: string[] = [];
  let priorityScore = 20;

  const timingPoints: Record<LeadUrgencyBand, number> = { urgent_14: 45, near_term_30: 35, planning_90: 20, long_range: 5, unknown: 0 };
  priorityScore += timingPoints[urgencyBand];
  if (urgencyBand !== "unknown") reasons.push(leadUrgencyLabel(urgencyBand));
  if (eventType !== "unknown" && eventType !== "other") { priorityScore += 5; reasons.push(leadEventTypeLabel(eventType)); }
  if (input.bucket === "ready_to_reengage") { priorityScore += 20; reasons.push("Prior follow-up signal"); }
  else if (input.bucket === "price_sensitive") { priorityScore += 12; reasons.push("Prior pricing interest"); }
  else if (input.bucket === "timing_or_capacity") { priorityScore += 8; reasons.push("Prior timing constraint"); }
  else if (input.bucket === "lost_elsewhere") priorityScore -= 15;
  else if (input.bucket === "review") priorityScore -= 10;
  if (input.leadAgeDays !== null && input.leadAgeDays !== undefined && input.leadAgeDays <= 30) { priorityScore += 8; reasons.push("Recent inquiry"); }

  return { eventDate, eventType, eventLocation, priorReason, urgencyBand, priorityScore: Math.max(0, Math.min(100, priorityScore)), reasons };
}

export function leadUrgencyLabel(value: LeadUrgencyBand): string {
  return ({ urgent_14: "Event in the next 14 days", near_term_30: "Event in 15–30 days", planning_90: "Event in 31–90 days", long_range: "Event more than 90 days away", unknown: "Event timing unknown" } satisfies Record<LeadUrgencyBand, string>)[value];
}

export function leadEventTypeLabel(value: LeadEventType): string {
  return ({ wedding: "Wedding", corporate: "Corporate event", school: "School event", birthday: "Birthday", fundraiser: "Fundraiser", community: "Community event", private_event: "Private event", other: "Other event", unknown: "Event type unknown" } satisfies Record<LeadEventType, string>)[value];
}

export function eventDateBoundaries(now = new Date()): { today: string; day14: string; day30: string; day90: string } {
  const today = utcDay(now);
  const add = (days: number) => new Date(today.getTime() + days * 86_400_000).toISOString().slice(0, 10);
  return { today: add(0), day14: add(14), day30: add(30), day90: add(90) };
}
