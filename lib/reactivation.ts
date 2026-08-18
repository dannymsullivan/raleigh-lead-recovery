export type ImportedLead = {
  name: string;
  phoneE164: string;
  email: string | null;
  source: string | null;
  leadAgeDays: number | null;
  notes: string | null;
};

export type ReactivationOutcome = "interested_now" | "follow_up_later" | "project_completed" | "not_interested" | "wrong_number" | "do_not_call" | "no_answer" | "failed";

export function normalizeUsPhone(value: string): string | null {
  const digits = value.replace(/\D/g, "");
  const national = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
  return /^\d{10}$/.test(national) ? `+1${national}` : null;
}

function parseCsvRows(input: string): string[][] {
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

export function parseLeadCsv(input: string): { leads: ImportedLead[]; invalidRows: number; duplicateRows: number } {
  const rows = parseCsvRows(input.replace(/^\uFEFF/, ""));
  if (!rows.length) return { leads: [], invalidRows: 0, duplicateRows: 0 };
  const headers = rows[0].map((header) => header.toLowerCase().replace(/[\s-]+/g, "_"));
  const nameIndex = headers.findIndex((header) => ["name", "full_name", "lead_name"].includes(header));
  const phoneIndex = headers.findIndex((header) => ["phone", "number", "phone_number", "mobile"].includes(header));
  if (nameIndex < 0 || phoneIndex < 0) throw new Error("CSV needs name and phone columns.");
  const indexOf = (...names: string[]) => headers.findIndex((header) => names.includes(header));
  const emailIndex = indexOf("email", "email_address");
  const sourceIndex = indexOf("source", "lead_source");
  const ageIndex = indexOf("age_days", "lead_age_days", "days_old");
  const notesIndex = indexOf("notes", "note", "context");
  const seen = new Set<string>();
  const leads: ImportedLead[] = [];
  let invalidRows = 0;
  let duplicateRows = 0;

  for (const row of rows.slice(1)) {
    const phoneE164 = normalizeUsPhone(row[phoneIndex] ?? "");
    const name = (row[nameIndex] ?? "").trim();
    if (!name || !phoneE164) { invalidRows += 1; continue; }
    if (seen.has(phoneE164)) { duplicateRows += 1; continue; }
    seen.add(phoneE164);
    const parsedAge = ageIndex >= 0 && row[ageIndex] ? Number(row[ageIndex]) : null;
    leads.push({
      name: name.slice(0, 160),
      phoneE164,
      email: emailIndex >= 0 ? row[emailIndex]?.trim().slice(0, 320) || null : null,
      source: sourceIndex >= 0 ? row[sourceIndex]?.trim().slice(0, 160) || null : null,
      leadAgeDays: parsedAge !== null && Number.isFinite(parsedAge) && parsedAge >= 0 ? Math.floor(parsedAge) : null,
      notes: notesIndex >= 0 ? row[notesIndex]?.trim().slice(0, 2000) || null : null
    });
  }
  return { leads, invalidRows, duplicateRows };
}

export function contactStatusForOutcome(outcome: ReactivationOutcome): string {
  const statuses: Record<ReactivationOutcome, string> = {
    interested_now: "interested",
    follow_up_later: "follow_up",
    project_completed: "completed_project",
    not_interested: "not_interested",
    wrong_number: "wrong_number",
    do_not_call: "do_not_call",
    no_answer: "no_answer",
    failed: "failed"
  };
  return statuses[outcome];
}

export function isPriorityOutcome(outcome: ReactivationOutcome): boolean {
  return outcome === "interested_now";
}
