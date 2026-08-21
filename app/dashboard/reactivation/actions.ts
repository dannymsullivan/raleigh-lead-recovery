"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { adminCookie, verifyAdminSessionToken } from "@/lib/admin";
import { getSupabaseAuth, isSupabaseAuthConfigured } from "@/lib/supabase-auth";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { parseLeadCsv } from "@/lib/reactivation";
import { analyzeLeadRows, inferLeadColumnMapping, leadFieldKeys, type LeadBucket, type LeadColumnMapping, type NormalizedImportedLead } from "@/lib/lead-import";
import { parseLeadSpreadsheet } from "@/lib/lead-spreadsheet-server";
import { createLeadUploadTicket, readLeadUpload, removeLeadUpload, type LeadUploadTicket } from "@/lib/lead-upload-server";
import { reactivationTelephonyReady, runReactivationBatch } from "@/lib/reactivation-vapi";
import { assessOpportunityDate, isDateSensitiveService } from "@/lib/lead-eligibility";

async function workspace(): Promise<{ userId: string; clientId: string }> {
  if (!isSupabaseAuthConfigured()) redirect("/login?error=configuration");
  const auth = await getSupabaseAuth();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) redirect("/login");
  const { data } = await getSupabaseAdmin().from("clients").select("id").eq("user_id", user.id).maybeSingle();
  if (!data) redirect("/signup?error=workspace");
  return { userId: user.id, clientId: data.id as string };
}

async function requireAdminClient(clientId: string): Promise<void> {
  const cookieStore = await cookies();
  if (!verifyAdminSessionToken(cookieStore.get(adminCookie.name)?.value)) redirect("/admin?error=session");
  const { data } = await getSupabaseAdmin().from("clients").select("id").eq("id", clientId).maybeSingle();
  if (!data) redirect("/admin?error=client-missing");
}

function value(formData: FormData, key: string): string {
  const item = formData.get(key);
  return typeof item === "string" ? item.trim() : "";
}

export async function createReactivationCampaignAction(formData: FormData): Promise<void> {
  const { clientId } = await workspace();
  const name = value(formData, "name");
  if (!name) redirect("/dashboard/reactivation?error=campaign_name");
  const maxAttempts = Math.min(5, Math.max(1, Number(value(formData, "max_attempts")) || 2));
  const dailyLimit = Math.min(500, Math.max(1, Number(value(formData, "daily_limit")) || 25));
  const { error } = await getSupabaseAdmin().from("reactivation_campaigns").insert({
    client_id: clientId,
    name: name.slice(0, 160),
    service_type: value(formData, "service_type").slice(0, 100) || "general service",
    calling_timezone: value(formData, "calling_timezone") || "America/New_York",
    calling_window_start: value(formData, "calling_window_start") || "09:00",
    calling_window_end: value(formData, "calling_window_end") || "18:00",
    max_attempts: maxAttempts,
    daily_limit: dailyLimit
  });
  if (error) redirect("/dashboard/reactivation?error=campaign_save");
  revalidatePath("/dashboard/reactivation");
  redirect("/dashboard/reactivation?created=1");
}

export async function createAdminCampaignAction(clientId: string, returnPath: string, formData: FormData): Promise<void> {
  await requireAdminClient(clientId);
  const name = value(formData, "name");
  if (!name) redirect(`${returnPath}?error=campaign_name`);
  const maxAttempts = Math.min(5, Math.max(1, Number(value(formData, "max_attempts")) || 2));
  const dailyLimit = Math.min(500, Math.max(1, Number(value(formData, "daily_limit")) || 25));
  const { error } = await getSupabaseAdmin().from("reactivation_campaigns").insert({
    client_id: clientId,
    name: name.slice(0, 160),
    service_type: value(formData, "service_type").slice(0, 100) || "general service",
    calling_timezone: value(formData, "calling_timezone") || "America/New_York",
    calling_window_start: value(formData, "calling_window_start") || "09:00",
    calling_window_end: value(formData, "calling_window_end") || "18:00",
    max_attempts: maxAttempts,
    daily_limit: dailyLimit
  });
  if (error) redirect(`${returnPath}?error=campaign_save`);
  revalidatePath(returnPath);
  redirect(`${returnPath}?campaign_created=1#lead-import`);
}

export async function importReactivationLeadsAction(campaignId: string, formData: FormData): Promise<void> {
  const { userId, clientId } = await workspace();
  if (formData.get("eligibility_attestation") !== "on") redirect("/dashboard/reactivation?error=attestation");
  const file = formData.get("lead_file");
  if (!(file instanceof File) || !file.size || file.size > 2_000_000) redirect("/dashboard/reactivation?error=file");
  const admin = getSupabaseAdmin();
  const { data: campaign } = await admin.from("reactivation_campaigns").select("id").eq("id", campaignId).eq("client_id", clientId).maybeSingle();
  if (!campaign) redirect("/dashboard/reactivation?error=campaign");

  let parsed;
  try { parsed = parseLeadCsv(await file.text()); }
  catch { redirect("/dashboard/reactivation?error=csv_columns"); }
  const leads = parsed.leads.slice(0, 5000);
  if (!leads.length) redirect("/dashboard/reactivation?error=no_valid_leads");
  const { data: suppressed } = await admin.from("suppression_entries").select("phone_e164").eq("client_id", clientId);
  const blocked = new Set((suppressed ?? []).map((entry) => entry.phone_e164));
  const eligible = leads.filter((lead) => !blocked.has(lead.phoneE164));
  const { error } = await admin.from("reactivation_contacts").upsert(eligible.map((lead) => ({
    client_id: clientId,
    campaign_id: campaignId,
    name: lead.name,
    phone_e164: lead.phoneE164,
    email: lead.email,
    source: lead.source,
    lead_age_days: lead.leadAgeDays,
    notes: lead.notes
  })), { onConflict: "campaign_id,phone_e164", ignoreDuplicates: true });
  if (error) redirect("/dashboard/reactivation?error=import");
  await admin.from("reactivation_campaigns").update({ status: "ready", eligibility_attested_at: new Date().toISOString(), eligibility_attested_by: userId }).eq("id", campaignId).eq("client_id", clientId);
  const skipped = parsed.invalidRows + parsed.duplicateRows + (leads.length - eligible.length);
  revalidatePath("/dashboard/reactivation");
  redirect(`/dashboard/reactivation?imported=${eligible.length}&skipped=${skipped}`);
}

export type LeadSpreadsheetPreview = {
  ok: boolean;
  error?: string;
  fileName?: string;
  headers?: string[];
  sampleRows?: string[][];
  mapping?: LeadColumnMapping;
  totalRows?: number;
  truncated?: boolean;
  validRows?: number;
  invalidRows?: number;
  duplicateRows?: number;
  missingPhoneRows?: number;
  missingNameRows?: number;
  bucketCounts?: Record<LeadBucket, number>;
  callableBucketCounts?: Record<LeadBucket, number>;
  bucketSamples?: Record<LeadBucket, NormalizedImportedLead[]>;
};

const importableBuckets: LeadBucket[] = ["ready_to_reengage", "price_sensitive", "timing_or_capacity", "lost_elsewhere", "disrupted", "review"];

function selectedImportBuckets(raw: string): LeadBucket[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return importableBuckets.filter((bucket) => parsed.includes(bucket));
  } catch {
    return [];
  }
}

async function ownedCampaign(campaignId: string, clientId: string): Promise<boolean> {
  const { data } = await getSupabaseAdmin().from("reactivation_campaigns").select("id").eq("id", campaignId).eq("client_id", clientId).maybeSingle();
  return Boolean(data);
}

async function ownedCampaignServiceType(campaignId: string, clientId: string): Promise<string | null> {
  const { data } = await getSupabaseAdmin().from("reactivation_campaigns").select("service_type").eq("id", campaignId).eq("client_id", clientId).maybeSingle();
  return typeof data?.service_type === "string" ? data.service_type : null;
}

function requestedMapping(formData: FormData, headers: string[]): LeadColumnMapping | null {
  const raw = value(formData, "column_mapping");
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return Object.fromEntries(leadFieldKeys.flatMap((key) => {
      const header = parsed[key];
      return typeof header === "string" && headers.includes(header) ? [[key, header]] : [];
    })) as LeadColumnMapping;
  } catch {
    return null;
  }
}

async function prepareLeadSpreadsheetUploadForClient(campaignId: string, clientId: string, formData: FormData): Promise<LeadUploadTicket> {
  if (!(await ownedCampaign(campaignId, clientId))) return { ok: false, error: "Campaign not found." };
  return createLeadUploadTicket(clientId, campaignId, value(formData, "file_name"), Number(value(formData, "file_size")));
}

export async function prepareLeadSpreadsheetUploadAction(campaignId: string, formData: FormData): Promise<LeadUploadTicket> {
  const { clientId } = await workspace();
  return prepareLeadSpreadsheetUploadForClient(campaignId, clientId, formData);
}

export async function prepareAdminLeadSpreadsheetUploadAction(clientId: string, campaignId: string, formData: FormData): Promise<LeadUploadTicket> {
  await requireAdminClient(clientId);
  return prepareLeadSpreadsheetUploadForClient(campaignId, clientId, formData);
}

async function previewLeadSpreadsheetForClient(campaignId: string, clientId: string, formData: FormData): Promise<LeadSpreadsheetPreview> {
  const serviceType = await ownedCampaignServiceType(campaignId, clientId);
  if (serviceType === null) return { ok: false, error: "Campaign not found." };
  try {
    const file = await readLeadUpload(value(formData, "upload_path"), value(formData, "file_name"), clientId, campaignId);
    const sheet = await parseLeadSpreadsheet(file);
    const mapping = requestedMapping(formData, sheet.headers) ?? inferLeadColumnMapping(sheet.headers, sheet.rows);
    const analysis = analyzeLeadRows(sheet.headers, sheet.rows, mapping, new Date(), serviceType);
    return {
      ok: true,
      fileName: file.name,
      headers: sheet.headers,
      sampleRows: sheet.rows.slice(0, 5),
      mapping,
      totalRows: sheet.totalRows,
      truncated: sheet.truncated,
      validRows: analysis.validRows,
      invalidRows: analysis.invalidRows,
      duplicateRows: analysis.duplicateRows,
      missingPhoneRows: analysis.missingPhoneRows,
      missingNameRows: analysis.missingNameRows,
      bucketCounts: analysis.bucketCounts,
      callableBucketCounts: analysis.callableBucketCounts,
      bucketSamples: analysis.bucketSamples
    };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "This spreadsheet could not be read." };
  }
}

export async function previewLeadSpreadsheetAction(campaignId: string, formData: FormData): Promise<LeadSpreadsheetPreview> {
  const { clientId } = await workspace();
  return previewLeadSpreadsheetForClient(campaignId, clientId, formData);
}

export async function previewAdminLeadSpreadsheetAction(clientId: string, campaignId: string, formData: FormData): Promise<LeadSpreadsheetPreview> {
  await requireAdminClient(clientId);
  return previewLeadSpreadsheetForClient(campaignId, clientId, formData);
}

async function importMappedLeadsForClient(campaignId: string, clientId: string, attestedBy: string | null, returnPath: string, formData: FormData): Promise<void> {
  const errorPath = (code: string) => `${returnPath}${returnPath.includes("?") ? "&" : "?"}error=${code}`;
  const replace = value(formData, "import_mode") === "replace";
  if (formData.get("eligibility_attestation") !== "on") redirect(errorPath("attestation"));
  if (replace && formData.get("replace_confirmation") !== "on") redirect(errorPath("replace_confirmation"));
  const serviceType = await ownedCampaignServiceType(campaignId, clientId);
  if (serviceType === null) redirect(errorPath("campaign"));
  const uploadPath = value(formData, "upload_path");
  const fileName = value(formData, "file_name");

  let file;
  try { file = await readLeadUpload(uploadPath, fileName, clientId, campaignId); }
  catch { redirect(errorPath("file")); }

  let sheet;
  try { sheet = await parseLeadSpreadsheet(file); }
  catch { await removeLeadUpload(uploadPath, clientId, campaignId); redirect(errorPath("spreadsheet")); }
  if (sheet.truncated) {
    await removeLeadUpload(uploadPath, clientId, campaignId);
    redirect(errorPath("too_many_rows"));
  }
  const mapping = requestedMapping(formData, sheet.headers) ?? inferLeadColumnMapping(sheet.headers, sheet.rows);
  const analysis = analyzeLeadRows(sheet.headers, sheet.rows, mapping, new Date(), serviceType);
  const includedBuckets = selectedImportBuckets(value(formData, "included_buckets"));
  if (!includedBuckets.length) { await removeLeadUpload(uploadPath, clientId, campaignId); redirect(errorPath("bucket_selection")); }
  const unique = new Map<string, (typeof analysis.rows)[number]>();
  for (const lead of analysis.rows) {
    if (lead.phoneE164 && lead.name && includedBuckets.includes(lead.bucket) && !unique.has(lead.phoneE164)) unique.set(lead.phoneE164, lead);
  }
  if (!unique.size) { await removeLeadUpload(uploadPath, clientId, campaignId); redirect(errorPath("no_callable_leads")); }

  const admin = getSupabaseAdmin();
  const { data: campaign } = await admin.from("reactivation_campaigns").select("status").eq("id", campaignId).eq("client_id", clientId).maybeSingle();
  if (replace && campaign?.status === "running") { await removeLeadUpload(uploadPath, clientId, campaignId); redirect(errorPath("campaign_running")); }
  const { data: suppressed } = await admin.from("suppression_entries").select("phone_e164").eq("client_id", clientId);
  const blocked = new Set((suppressed ?? []).map((entry) => entry.phone_e164));
  const eligible = [...unique.values()].filter((lead) => lead.phoneE164 && !blocked.has(lead.phoneE164));
  if (!eligible.length) { await removeLeadUpload(uploadPath, clientId, campaignId); redirect(errorPath("no_callable_leads")); }

  const { data: existingContacts } = replace
    ? await admin.from("reactivation_contacts").select("id,phone_e164").eq("campaign_id", campaignId).eq("client_id", clientId)
    : { data: [] as Array<{ id: string; phone_e164: string }> };

  for (let start = 0; start < eligible.length; start += 500) {
    const batch = eligible.slice(start, start + 500).map((lead) => ({
      client_id: clientId,
      campaign_id: campaignId,
      external_id: lead.externalId,
      company: lead.company,
      brand: lead.brand,
      name: lead.name,
      phone_e164: lead.phoneE164,
      email: lead.email,
      source: lead.source,
      lead_age_days: lead.leadAgeDays,
      notes: lead.agentContext || lead.notes,
      import_bucket: lead.bucket,
      import_metadata: lead.metadata
    }));
    const { error } = await admin.from("reactivation_contacts").upsert(batch, { onConflict: "campaign_id,phone_e164", ignoreDuplicates: false });
    if (error) { await removeLeadUpload(uploadPath, clientId, campaignId); redirect(errorPath("import")); }
  }

  if (replace && existingContacts?.length) {
    const incomingPhones = new Set(eligible.map((lead) => lead.phoneE164));
    const staleIds = existingContacts.filter((contact) => !incomingPhones.has(contact.phone_e164)).map((contact) => contact.id);
    for (let start = 0; start < staleIds.length; start += 200) {
      const { error } = await admin.from("reactivation_contacts").delete().eq("client_id", clientId).eq("campaign_id", campaignId).in("id", staleIds.slice(start, start + 200));
      if (error) { await removeLeadUpload(uploadPath, clientId, campaignId); redirect(errorPath("replace")); }
    }
  }

  const { error: readyError } = await admin.from("reactivation_campaigns").update({ status: "ready", eligibility_attested_at: new Date().toISOString(), eligibility_attested_by: attestedBy }).eq("id", campaignId).eq("client_id", clientId);
  if (readyError) { await removeLeadUpload(uploadPath, clientId, campaignId); redirect(errorPath("campaign_save")); }
  await removeLeadUpload(uploadPath, clientId, campaignId);
  const suppressedCount = unique.size - eligible.length;
  const skipped = sheet.totalRows - unique.size;
  const bucketParam = encodeURIComponent(includedBuckets.join(","));
  revalidatePath(returnPath);
  redirect(`${returnPath}?imported=${eligible.length}&skipped=${Math.max(0, skipped)}&suppressed=${Math.max(0, suppressedCount)}&buckets=${bucketParam}${replace ? "&replaced=1" : ""}#leads`);
}

export async function importMappedReactivationLeadsAction(campaignId: string, formData: FormData): Promise<void> {
  const { userId, clientId } = await workspace();
  return importMappedLeadsForClient(campaignId, clientId, userId, "/dashboard/reactivation", formData);
}

export async function importAdminMappedLeadsAction(clientId: string, campaignId: string, returnPath: string, formData: FormData): Promise<void> {
  await requireAdminClient(clientId);
  return importMappedLeadsForClient(campaignId, clientId, null, returnPath, formData);
}

async function reclassifyDateIneligibleContacts(campaignId: string, clientId: string, serviceType: string): Promise<number> {
  if (!isDateSensitiveService(serviceType)) return 0;
  const admin = getSupabaseAdmin();
  const ineligibleIds: string[] = [];
  for (let start = 0; ; start += 1000) {
    const { data, error } = await admin.from("reactivation_contacts").select("id,import_bucket,import_metadata,notes").eq("campaign_id", campaignId).eq("client_id", clientId).order("id").range(start, start + 999);
    if (error) throw error;
    const rows = (data ?? []) as Array<{ id: string; import_bucket: string | null; import_metadata: Record<string, string> | null; notes: string | null }>;
    for (const contact of rows) {
      if (contact.import_bucket !== "exclude" && !assessOpportunityDate({ serviceType, metadata: contact.import_metadata, notes: contact.notes }).eligible) ineligibleIds.push(contact.id);
    }
    if (rows.length < 1000) break;
  }
  for (let start = 0; start < ineligibleIds.length; start += 200) {
    const { error } = await admin.from("reactivation_contacts").update({ import_bucket: "exclude" }).eq("client_id", clientId).eq("campaign_id", campaignId).in("id", ineligibleIds.slice(start, start + 200));
    if (error) throw error;
  }
  return ineligibleIds.length;
}

export async function reclassifyAdminEventLeadsAction(clientId: string, campaignId: string, returnPath: string): Promise<void> {
  await requireAdminClient(clientId);
  const serviceType = await ownedCampaignServiceType(campaignId, clientId);
  if (serviceType === null) redirect(`${returnPath}?error=campaign`);
  const reclassified = await reclassifyDateIneligibleContacts(campaignId, clientId, serviceType);
  revalidatePath(returnPath);
  redirect(`${returnPath}?reclassified=${reclassified}#leads`);
}

async function launchCampaignForClient(campaignId: string, clientId: string, returnPath: string): Promise<void> {
  if (!reactivationTelephonyReady()) redirect(`${returnPath}?error=telephony`);
  const admin = getSupabaseAdmin();
  const { data: campaign } = await admin.from("reactivation_campaigns").select("id,eligibility_attested_at,service_type").eq("id", campaignId).eq("client_id", clientId).maybeSingle();
  if (!campaign?.eligibility_attested_at) redirect(`${returnPath}?error=attestation`);
  await reclassifyDateIneligibleContacts(campaignId, clientId, campaign.service_type);
  const { count } = await admin.from("reactivation_contacts").select("id", { count: "exact", head: true }).eq("campaign_id", campaignId).eq("client_id", clientId).or("import_bucket.is.null,import_bucket.neq.exclude");
  if (!count) redirect(`${returnPath}?error=no_valid_leads`);
  const { error: launchError } = await admin.from("reactivation_campaigns").update({ status: "running", launched_at: new Date().toISOString() }).eq("id", campaignId).eq("client_id", clientId);
  if (launchError) redirect(`${returnPath}?error=campaign_save`);
  after(() => runReactivationBatch(campaignId, clientId, 50));
  revalidatePath(returnPath);
  redirect(`${returnPath}?launched=1`);
}

export async function launchReactivationCampaignAction(campaignId: string): Promise<void> {
  const { clientId } = await workspace();
  return launchCampaignForClient(campaignId, clientId, "/dashboard/reactivation");
}

export async function launchAdminCampaignAction(clientId: string, campaignId: string, returnPath: string): Promise<void> {
  await requireAdminClient(clientId);
  return launchCampaignForClient(campaignId, clientId, returnPath);
}

async function setCampaignStatus(campaignId: string, clientId: string, status: "paused" | "running", returnPath: string): Promise<void> {
  const { error } = await getSupabaseAdmin().from("reactivation_campaigns").update({ status }).eq("id", campaignId).eq("client_id", clientId);
  if (error) redirect(`${returnPath}?error=campaign_save`);
  if (status === "running") {
    after(() => runReactivationBatch(campaignId, clientId, 50));
  }
  revalidatePath(returnPath);
  redirect(returnPath);
}

export async function pauseReactivationCampaignAction(campaignId: string): Promise<void> {
  const { clientId } = await workspace();
  return setCampaignStatus(campaignId, clientId, "paused", "/dashboard/reactivation");
}

export async function resumeReactivationCampaignAction(campaignId: string): Promise<void> {
  const { clientId } = await workspace();
  if (!reactivationTelephonyReady()) redirect("/dashboard/reactivation?error=telephony");
  return setCampaignStatus(campaignId, clientId, "running", "/dashboard/reactivation");
}

export async function pauseAdminCampaignAction(clientId: string, campaignId: string, returnPath: string): Promise<void> {
  await requireAdminClient(clientId);
  return setCampaignStatus(campaignId, clientId, "paused", returnPath);
}

export async function resumeAdminCampaignAction(clientId: string, campaignId: string, returnPath: string): Promise<void> {
  await requireAdminClient(clientId);
  if (!reactivationTelephonyReady()) redirect(`${returnPath}?error=telephony`);
  return setCampaignStatus(campaignId, clientId, "running", returnPath);
}

async function updateLeadForClient(contactId: string, clientId: string, status: "contacted" | "booked" | "not_interested", returnPath: string, formData: FormData): Promise<void> {
  const now = new Date().toISOString();
  const estimatedValue = Number(value(formData, "estimated_value"));
  const update: Record<string, unknown> = { status, owner_contacted_at: now };
  if (status === "booked") {
    update.booked_at = now;
    if (Number.isFinite(estimatedValue) && estimatedValue >= 0) update.estimated_value = estimatedValue;
  }
  const admin = getSupabaseAdmin();
  const { data: contact, error: updateError } = await admin.from("reactivation_contacts").update(update).eq("id", contactId).eq("client_id", clientId).select("campaign_id").maybeSingle();
  if (updateError || !contact) redirect(`${returnPath}?error=lead_update`);
  if (contact && status === "booked") {
    const { error: appointmentError } = await admin.from("reactivation_appointments").upsert({ client_id: clientId, campaign_id: contact.campaign_id, contact_id: contactId, status: "confirmed", notes: value(formData, "appointment_notes") || null }, { onConflict: "contact_id" });
    if (appointmentError) redirect(`${returnPath}?error=appointment_save`);
  }
  revalidatePath(returnPath);
}

export async function updateReactivationLeadAction(contactId: string, status: "contacted" | "booked" | "not_interested", formData: FormData): Promise<void> {
  const { clientId } = await workspace();
  return updateLeadForClient(contactId, clientId, status, "/dashboard/reactivation", formData);
}

export async function updateAdminReactivationLeadAction(clientId: string, contactId: string, returnPath: string, status: "contacted" | "booked" | "not_interested", formData: FormData): Promise<void> {
  await requireAdminClient(clientId);
  return updateLeadForClient(contactId, clientId, status, returnPath, formData);
}

export async function deleteAdminReactivationLeadsAction(clientId: string, returnPath: string, formData: FormData): Promise<void> {
  await requireAdminClient(clientId);
  const ids = [...new Set(formData.getAll("contact_ids").filter((item): item is string => typeof item === "string" && /^[0-9a-f-]{36}$/i.test(item)))].slice(0, 1000);
  if (!ids.length) redirect(`${returnPath}?error=no_leads_selected`);
  const admin = getSupabaseAdmin();
  const { data: selectedContacts } = await admin.from("reactivation_contacts").select("id,campaign_id").eq("client_id", clientId).in("id", ids);
  const ownedIds = (selectedContacts ?? []).map((contact) => contact.id);
  if (!ownedIds.length) redirect(`${returnPath}?error=no_leads_selected`);
  const campaignIds = [...new Set((selectedContacts ?? []).map((contact) => contact.campaign_id))];
  const { data: runningCampaigns } = await admin.from("reactivation_campaigns").select("id").eq("client_id", clientId).eq("status", "running").in("id", campaignIds);
  if (runningCampaigns?.length) redirect(`${returnPath}?error=campaign_running`);

  let deleted = 0;
  for (let start = 0; start < ownedIds.length; start += 200) {
    const { data, error } = await admin.from("reactivation_contacts").delete().eq("client_id", clientId).in("id", ownedIds.slice(start, start + 200)).select("id");
    if (error) redirect(`${returnPath}?error=delete_leads`);
    deleted += data?.length ?? 0;
  }
  revalidatePath(returnPath);
  redirect(`${returnPath}?deleted_leads=${deleted}`);
}

export async function clearAdminReactivationLeadsAction(clientId: string, returnPath: string, formData: FormData): Promise<void> {
  await requireAdminClient(clientId);
  if (value(formData, "clear_confirmation") !== "on") redirect(`${returnPath}?error=clear_confirmation`);

  const admin = getSupabaseAdmin();
  const { data: runningCampaigns } = await admin.from("reactivation_campaigns").select("id").eq("client_id", clientId).eq("status", "running").limit(1);
  if (runningCampaigns?.length) redirect(`${returnPath}?error=campaign_running`);

  const { count, error: countError } = await admin.from("reactivation_contacts").select("id", { count: "exact", head: true }).eq("client_id", clientId);
  if (countError) redirect(`${returnPath}?error=clear_leads`);
  const { error } = await admin.from("reactivation_contacts").delete().eq("client_id", clientId);
  if (error) redirect(`${returnPath}?error=clear_leads`);

  revalidatePath(returnPath);
  redirect(`${returnPath}?cleared_leads=${count ?? 0}`);
}
