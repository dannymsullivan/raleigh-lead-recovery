export const outreachStages = [
  "not_contacted",
  "email_sent",
  "replied",
  "call_scheduled",
  "pilot_booked",
  "not_interested",
] as const;

export type OutreachStage = (typeof outreachStages)[number];

export const outreachStageLabels: Record<OutreachStage, string> = {
  not_contacted: "Not contacted",
  email_sent: "Email sent",
  replied: "Replied",
  call_scheduled: "Call scheduled",
  pilot_booked: "Pilot booked",
  not_interested: "Not interested",
};

export type OutreachProspect = {
  inbound_source?: string | null;
  id: string;
  company_name: string;
  website: string | null;
  address: string | null;
  city: string | null;
  contact_name: string | null;
  contact_role: string | null;
  email: string | null;
  phone: string | null;
  last_call_outcome: OutreachCallOutcome | null;
  last_retell_call_id: string | null;
  potential_customer: OutreachPotentialCustomer | null;
  last_call_summary: string | null;
  call_in_progress_at: string | null;
  do_not_call_at: string | null;
  automated_call_attempt_count: number;
  stage: OutreachStage;
  last_contacted_on: string | null;
  next_follow_up_on: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type OutreachSummary = {
  total: number;
  ready: number;
  replies: number;
  pilots: number;
  followUpsDue: number;
};

export function buildOutreachSummary(
  prospects: Pick<OutreachProspect, "stage" | "next_follow_up_on">[],
  today = new Date().toISOString().slice(0, 10),
): OutreachSummary {
  return prospects.reduce<OutreachSummary>(
    (summary, prospect) => {
      summary.total += 1;
      if (prospect.stage === "not_contacted") summary.ready += 1;
      if (["replied", "call_scheduled", "pilot_booked"].includes(prospect.stage)) summary.replies += 1;
      if (prospect.stage === "pilot_booked") summary.pilots += 1;
      if (
        prospect.next_follow_up_on &&
        prospect.next_follow_up_on <= today &&
        !["pilot_booked", "not_interested"].includes(prospect.stage)
      ) {
        summary.followUpsDue += 1;
      }
      return summary;
    },
    { total: 0, ready: 0, replies: 0, pilots: 0, followUpsDue: 0 },
  );
}

export function outreachWebsiteHref(value: string): string {
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

export const outreachCallOutcomes = {
  real_person: "Real person answered",
  interested: "Interested",
  follow_up: "Follow up",
  not_interested: "Not interested",
  do_not_call: "Do not call",
  voicemail: "Voicemail",
  no_answer: "No answer",
  busy: "Busy",
  wrong_number: "Wrong number",
  failed: "Call failed",
} as const;

export type OutreachCallOutcome = keyof typeof outreachCallOutcomes;

export const outreachPotentialCustomerLabels = {
  yes: "Potential customer",
  maybe: "Maybe",
  no: "Not a fit",
} as const;

export type OutreachPotentialCustomer = keyof typeof outreachPotentialCustomerLabels;

export function isOutreachCallOutcome(value: string): value is OutreachCallOutcome {
  return Object.hasOwn(outreachCallOutcomes, value);
}

export function normalizeOutreachWebsite(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
    if (!url.hostname.includes(".")) return null;
    return url.hostname.toLowerCase().replace(/^www\./i, "");
  } catch {
    return null;
  }
}

export function outreachCallUpdate(
  outcome: OutreachCallOutcome,
  today = new Date().toISOString().slice(0, 10),
): {
  last_call_outcome: OutreachCallOutcome;
  last_contacted_on: string;
  next_follow_up_on: string | null;
} {
  const followUpDays: Record<OutreachCallOutcome, number | null> = {
    real_person: 1,
    interested: 1,
    follow_up: 2,
    not_interested: null,
    do_not_call: null,
    voicemail: 2,
    no_answer: 2,
    busy: 1,
    wrong_number: null,
    failed: 1,
  };
  const days = followUpDays[outcome];
  if (days === null) {
    return { last_call_outcome: outcome, last_contacted_on: today, next_follow_up_on: null };
  }
  const followUp = new Date(`${today}T12:00:00Z`);
  followUp.setUTCDate(followUp.getUTCDate() + days);
  return {
    last_call_outcome: outcome,
    last_contacted_on: today,
    next_follow_up_on: followUp.toISOString().slice(0, 10),
  };
}

// "https://www.cool-breeze-hvac.com/contact" -> "Cool Breeze HVAC"
export function companyNameFromWebsite(input: string): string | null {
  const hostname = normalizeOutreachWebsite(input);
  if (!hostname) return null;
  const domain = hostname.split(".")[0];
  const serviceWords = [
    "airconditioning",
    "conditioning",
    "contractors",
    "mechanical",
    "electrical",
    "american",
    "plumbing",
    "solutions",
    "services",
    "heating",
    "cooling",
    "company",
    "experts",
    "comfort",
    "systems",
    "service",
    "electric",
    "airflow",
    "hvac",
    "and",
    "air",
  ];
  const words = domain
    .split(/[-_]/)
    .filter(Boolean)
    .flatMap((part) => splitKnownSuffixes(part, serviceWords))
    .map(formatCompanyWord);
  return words.join(" ").slice(0, 160) || null;
}

function splitKnownSuffixes(value: string, knownWords: string[]): string[] {
  let remaining = value.toLowerCase();
  const suffixes: string[] = [];
  while (remaining) {
    const match = knownWords.find((word) => remaining.endsWith(word));
    if (!match || remaining === match) break;
    suffixes.unshift(match);
    remaining = remaining.slice(0, -match.length);
  }
  return [remaining, ...suffixes].filter(Boolean);
}

function formatCompanyWord(word: string): string {
  if (word === "hvac") return "HVAC";
  if (word === "and") return "and";
  if (word === "airconditioning") return "Air Conditioning";
  return word.charAt(0).toUpperCase() + word.slice(1);
}

export type OutreachBulkRow = {
  company_name: string;
  city: string | null;
  address: string | null;
  website: string | null;
  phone: string | null;
};

export const outreachBulkLineLimit = 100;

// Format: one prospect per line, fields separated by "|" or tabs:
// Company | City | Address | Website | Phone — only the company is required.
export function parseOutreachBulkLines(text: string): { rows: OutreachBulkRow[]; skipped: number } {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).slice(0, outreachBulkLineLimit);
  const seen = new Set<string>();
  const rows: OutreachBulkRow[] = [];
  let skipped = 0;
  for (const line of lines) {
    const parts = line.split(/\||\t/).map((part) => part.trim());
    const [company, city] = parts;
    const hasAddressColumn = parts.length >= 5
      || (parts.length === 4 && !normalizeOutreachWebsite(parts[2] ?? ""));
    const [address, website, phone] = hasAddressColumn
      ? [parts[2], parts[3], parts[4]]
      : [undefined, parts[2], parts[3]];
    const companyName = (company ?? "").slice(0, 160);
    const key = companyName.toLowerCase();
    if (!companyName || seen.has(key)) {
      skipped += 1;
      continue;
    }
    seen.add(key);
    rows.push({
      company_name: companyName,
      city: city?.slice(0, 100) || null,
      address: address?.slice(0, 300) || null,
      website: website?.slice(0, 500) || null,
      phone: phone?.slice(0, 60) || null,
    });
  }
  return { rows, skipped };
}
