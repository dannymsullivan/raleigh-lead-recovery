import type { Client } from "./types";
import type { KnowledgeEntry } from "./chat";

type BusinessFacts = Pick<Client, "business_name" | "services" | "service_area" | "business_hours" | "timezone">;

/** Only public business facts; owner contacts and internal emergency/escalation rules stay private. */
export function businessProfileKnowledge(client: BusinessFacts): KnowledgeEntry[] {
  const entries: KnowledgeEntry[] = [];
  if (client.services?.length) entries.push({ id: "profile-services", title: "Services", content: `${client.business_name} offers: ${client.services.join(", ")}.`.slice(0, 3000), keywords: `services repair maintenance install ${client.services.join(" ")}`.slice(0, 500) });
  if (client.service_area?.trim()) entries.push({ id: "profile-area", title: "Service area", content: `Our service area: ${client.service_area.trim()}.`, keywords: `area location serve service zip address ${client.service_area}`.slice(0, 500) });
  const hours = Object.entries(client.business_hours ?? {}).map(([day, schedule]) => `${day}: ${schedule.closed ? "closed" : `${schedule.open}–${schedule.close}`}`).join("; ");
  if (hours) entries.push({ id: "profile-hours", title: "Office hours", content: `Office hours: ${hours}${client.timezone ? ` (${client.timezone})` : ""}. A team member confirms appointment availability.`, keywords: "hours open close time office weekend monday tuesday wednesday thursday friday saturday sunday" });
  return entries;
}

export function effectiveChatKnowledge(profile: KnowledgeEntry[], custom: KnowledgeEntry[]): KnowledgeEntry[] {
  const published = custom.filter((entry) => entry.published !== false);
  const overrides = new Set(published.map((entry) => entry.title.toLowerCase().trim()));
  return [...published, ...profile.filter((entry) => !overrides.has(entry.title.toLowerCase().trim()))];
}
