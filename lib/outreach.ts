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
  id: string;
  company_name: string;
  website: string | null;
  city: string | null;
  contact_name: string | null;
  contact_role: string | null;
  email: string | null;
  phone: string | null;
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

export type OutreachBulkRow = {
  company_name: string;
  city: string | null;
  website: string | null;
  phone: string | null;
};

export const outreachBulkLineLimit = 100;

// Format: one prospect per line, fields separated by "|" or tabs:
// Company | City | Website | Phone — only the company is required.
export function parseOutreachBulkLines(text: string): { rows: OutreachBulkRow[]; skipped: number } {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).slice(0, outreachBulkLineLimit);
  const seen = new Set<string>();
  const rows: OutreachBulkRow[] = [];
  let skipped = 0;
  for (const line of lines) {
    const [company, city, website, phone] = line.split(/\||\t/).map((part) => part.trim());
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
      website: website?.slice(0, 500) || null,
      phone: phone?.slice(0, 60) || null,
    });
  }
  return { rows, skipped };
}
