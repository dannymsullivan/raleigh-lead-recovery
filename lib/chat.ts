export type KnowledgeEntry = { id: string; title: string; content: string; keywords: string; published?: boolean };
export type ChatMessage = { role: "user" | "assistant"; content: string; source?: string; sources?: Pick<KnowledgeEntry, "id" | "title" | "content">[] };
export type ChatAttribution = { landing_page: string; referrer: string; utm_source: string; utm_medium: string; utm_campaign: string; utm_content: string; utm_term: string };

export { demoKnowledge } from "./demo-knowledge";

const words = (value: string) => value.toLowerCase().match(/[a-z0-9]+/g) ?? [];
const stopWords = new Set(["a", "an", "and", "are", "can", "do", "does", "for", "i", "in", "is", "it", "me", "my", "of", "on", "the", "to", "we", "what", "you", "your"]);

/** Return approved source text verbatim. Unknown questions never produce invented facts. */
export function answerFromKnowledge(question: string, entries: KnowledgeEntry[]): { content: string; source?: string } {
  if (/\b(gas (smell|leak)|smell gas|carbon monoxide|fire|smoke|sparking)\b/i.test(question)) {
    return { content: "If there may be immediate danger, leave the area if it is safe and contact emergency services or your utility from a safe location. This chat cannot dispatch emergency help." };
  }
  const terms = [...new Set(words(question).filter((word) => !stopWords.has(word)))];
  const matches = entries.filter((entry) => entry.published !== false).map((entry) => {
    const title = new Set(words(entry.title));
    const tags = new Set(words(entry.keywords));
    const body = new Set(words(entry.content));
    return { entry, score: terms.reduce((sum, term) => sum + (title.has(term) ? 4 : tags.has(term) ? 3 : body.has(term) ? 1 : 0), 0) };
  }).sort((a, b) => b.score - a.score);
  if (matches[0]?.score >= 3) return { content: matches[0].entry.content, source: matches[0].entry.title };
  if (/^(hi|hello|hey|thanks|thank you)[!. ]*$/i.test(question.trim())) return { content: "Hi! Ask me about services, service areas, hours, or pricing." };
  return { content: "I don’t have an approved answer to that yet. Please check with the business directly." };
}

function safePage(value: unknown): string {
  if (typeof value !== "string") return "";
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) ? `${url.origin}${url.pathname}`.slice(0, 500) : "";
  } catch { return ""; }
}

export function parseAttribution(value: unknown): ChatAttribution {
  const input = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const text = (key: string) => typeof input[key] === "string" ? (input[key] as string).trim().slice(0, 120) : "";
  return { landing_page: safePage(input.landing_page), referrer: safePage(input.referrer), utm_source: text("utm_source"), utm_medium: text("utm_medium"), utm_campaign: text("utm_campaign"), utm_content: text("utm_content"), utm_term: text("utm_term") };
}

export function attributionSource(attribution: Partial<ChatAttribution> | null): string {
  if (attribution?.utm_source) return attribution.utm_source;
  try { return new URL(attribution?.referrer || "").hostname; } catch { return "Direct / unknown"; }
}

export type ChatRecord = { id: string; created_at: string; attribution: ChatAttribution; messages: ChatMessage[]; lead_name: string | null; lead_email: string | null; lead_phone: string | null; lead_request: string | null; lead_captured_at: string | null; lead_status: "new" | "contacted" | "booked" | "lost"; booked_value: number | null };

export function chatMetrics(chats: Pick<ChatRecord, "attribution" | "lead_captured_at" | "lead_status" | "booked_value">[]) {
  const sources = new Map<string, { source: string; chats: number; leads: number; booked: number; revenue: number }>();
  let leads = 0, booked = 0, revenue = 0;
  for (const chat of chats) {
    const source = attributionSource(chat.attribution);
    const row = sources.get(source) ?? { source, chats: 0, leads: 0, booked: 0, revenue: 0 };
    row.chats++;
    if (chat.lead_captured_at) { leads++; row.leads++; }
    if (chat.lead_captured_at && chat.lead_status === "booked") { booked++; row.booked++; const value = Number(chat.booked_value) || 0; revenue += value; row.revenue += value; }
    sources.set(source, row);
  }
  return { chats: chats.length, leads, booked, revenue, conversion: chats.length ? Math.round(leads / chats.length * 100) : 0, sources: [...sources.values()].sort((a, b) => b.leads - a.leads || b.chats - a.chats) };
}
