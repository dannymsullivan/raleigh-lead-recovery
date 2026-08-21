import { createClient } from "@supabase/supabase-js";
import { assessOpportunityDate, isDateSensitiveService } from "../lib/lead-eligibility";

async function main() {
const slug = process.argv.find((argument) => argument.startsWith("--slug="))?.slice(7);
const apply = process.argv.includes("--apply");
if (!slug) throw new Error("Pass --slug=<customer-slug>.");
const url = process.env.SUPABASE_URL?.trim();
const key = (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)?.trim();
if (!url || !key) throw new Error("Supabase admin credentials are missing.");
const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const { data: client, error: clientError } = await admin.from("clients").select("id,business_name").eq("slug", slug).single();
if (clientError) throw clientError;
const { data: campaign, error: campaignError } = await admin.from("reactivation_campaigns").select("id,name,status,service_type").eq("client_id", client.id).order("created_at", { ascending: false }).limit(1).single();
if (campaignError) throw campaignError;
if (campaign.status === "running") throw new Error("Pause the campaign before reclassifying leads.");
if (!isDateSensitiveService(campaign.service_type)) throw new Error(`Campaign service type “${campaign.service_type}” is not date-sensitive.`);

const ids: string[] = [];
const counts = { future: 0, past: 0, missing: 0, invalid: 0, alreadyExcluded: 0 };
for (let start = 0; ; start += 1000) {
  const { data, error } = await admin.from("reactivation_contacts").select("id,import_bucket,import_metadata,notes").eq("campaign_id", campaign.id).eq("client_id", client.id).order("id").range(start, start + 999);
  if (error) throw error;
  const rows = data ?? [];
  for (const contact of rows) {
    const result = assessOpportunityDate({ serviceType: campaign.service_type, metadata: contact.import_metadata as Record<string, string>, notes: contact.notes });
    if (result.status === "future") counts.future += 1;
    else if (result.status === "past") counts.past += 1;
    else if (result.status === "missing") counts.missing += 1;
    else if (result.status === "invalid") counts.invalid += 1;
    if (contact.import_bucket === "exclude") counts.alreadyExcluded += 1;
    else if (!result.eligible) ids.push(contact.id);
  }
  if (rows.length < 1000) break;
}

if (apply) {
  for (let start = 0; start < ids.length; start += 2000) {
    const groups = Array.from({ length: Math.ceil(Math.min(2000, ids.length - start) / 200) }, (_, index) => ids.slice(start + index * 200, start + (index + 1) * 200));
    const results = await Promise.all(groups.map((group) => admin.from("reactivation_contacts").update({ import_bucket: "exclude" }).eq("client_id", client.id).eq("campaign_id", campaign.id).in("id", group)));
    const failed = results.find((result) => result.error);
    if (failed?.error) throw failed.error;
  }
}

console.log(JSON.stringify({ customer: client.business_name, campaign: campaign.name, serviceType: campaign.service_type, mode: apply ? "applied" : "dry-run", ...counts, movedToExclude: apply ? ids.length : 0, wouldMoveToExclude: ids.length }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
