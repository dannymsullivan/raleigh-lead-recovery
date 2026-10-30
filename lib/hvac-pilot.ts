export const pilotLeadSources = ["Google Ads", "Google Local Services Ads", "Both Google Ads and Local Services Ads", "Other paid marketing", "Not currently paying for leads"] as const;
export const crawlPilotLeadSources = ["Google search", "Referrals and word of mouth", "Google Ads or Local Services Ads", "Other sources", "Not sure yet"] as const;
export const pilotTrafficLevels = ["Under 100", "100–499", "500–1,999", "2,000+", "Not sure yet"] as const;
export const pilotUtmKeys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;

/** Validate independently of the form; keep the full application within the CRM's 2,000-character limit. */
export function pilotApplicationNotes(input: unknown, niche: "hvac" | "crawl-space" = "hvac"): string | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const data = input as Record<string, unknown>;
  const field = (key: string, max: number) => {
    const value = typeof data[key] === "string" ? data[key].trim() : "";
    return value && value.length <= max ? value.replace(/[\r\n\u0000-\u001f]+/g, " ") : null;
  };
  const serviceArea = field("serviceArea", 120), gap = field("responseGap", 300), followUp = field("followUpOwner", 100);
  if (!serviceArea || !gap || !followUp || data.participation !== true || data.pricing !== true
    || !(niche === "crawl-space" ? (crawlPilotLeadSources as readonly string[]) : (pilotLeadSources as readonly string[])).includes(data.leadSource as string)
    || !pilotTrafficLevels.includes(data.traffic as typeof pilotTrafficLevels[number])) return null;
  const attribution = data.attribution && typeof data.attribution === "object" && !Array.isArray(data.attribution)
    ? data.attribution as Record<string, unknown> : {};
  const tags = pilotUtmKeys.flatMap(key => typeof attribution[key] === "string" && attribution[key].trim()
    ? [`${key}: ${attribution[key].replace(/[\r\n\u0000-\u001f]+/g, " ").trim().slice(0, 80)}`] : []);
  return [niche === "hvac" ? "Raleigh HVAC pilot application · 3 months" : "Raleigh crawl space pilot application · 3 months", "Scope: one business/location/website; 1,000 AI replies per month; website chat only.",
    `Service area: ${serviceArea}`, `${niche === "crawl-space" ? "Main lead source" : "Paid lead source"}: ${data.leadSource}`, `Monthly website visits: ${data.traffic}`,
    `Current response gap: ${gap}`, `Follow-up owner: ${followUp}`,
    niche === "hvac" ? "Confirmed: HVAC business with capacity; authority to approve setup; knowledge review and monthly results check-ins." : "Confirmed: crawl space business with capacity; authority to approve setup; knowledge review and monthly results check-ins.",
    "Acknowledged: $399/month to continue at the same allowance; no automatic paid enrollment.",
    niche === "hvac" ? "Application page: /raleigh-pilot" : "Application page: /crawl-space-pilot", ...tags].join("\n");
}
