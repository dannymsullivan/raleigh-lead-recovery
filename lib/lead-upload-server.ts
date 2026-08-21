import "server-only";

import { randomUUID } from "node:crypto";
import { getSupabaseAdmin } from "./supabase-server";

const leadImportBucket = "lead-imports";
const maxLeadUploadBytes = 10_000_000;

export type LeadUploadTicket = {
  ok: boolean;
  error?: string;
  path?: string;
  signedUrl?: string;
};

export function validateLeadUploadDescriptor(fileName: string, fileSize: number): string | null {
  if (!fileName || !Number.isFinite(fileSize) || fileSize <= 0 || fileSize > maxLeadUploadBytes) {
    return "Choose a CSV or XLSX file smaller than 10 MB.";
  }
  if (!/\.(csv|xlsx)$/i.test(fileName)) return "Upload a CSV or XLSX file.";
  return null;
}

function safeFileName(fileName: string): string {
  const extension = fileName.toLowerCase().endsWith(".xlsx") ? ".xlsx" : ".csv";
  const stem = fileName.slice(0, -extension.length).replace(/[^a-z0-9_-]+/gi, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "leads";
  return `${stem}${extension}`;
}

export function ownsLeadUploadPath(path: string, clientId: string, campaignId: string): boolean {
  return path.startsWith(`${clientId}/${campaignId}/`) && !path.includes("..") && !path.includes("\\");
}

async function ensureLeadImportBucket(): Promise<void> {
  const admin = getSupabaseAdmin();
  const { data: buckets, error: listError } = await admin.storage.listBuckets();
  if (listError) throw listError;
  if (buckets?.some((bucket) => bucket.name === leadImportBucket)) return;
  const { error } = await admin.storage.createBucket(leadImportBucket, {
    public: false,
    fileSizeLimit: maxLeadUploadBytes
  });
  if (error && !/already exists/i.test(error.message)) throw error;
}

export async function createLeadUploadTicket(clientId: string, campaignId: string, fileName: string, fileSize: number): Promise<LeadUploadTicket> {
  const validationError = validateLeadUploadDescriptor(fileName, fileSize);
  if (validationError) return { ok: false, error: validationError };
  try {
    await ensureLeadImportBucket();
    const path = `${clientId}/${campaignId}/${randomUUID()}-${safeFileName(fileName)}`;
    const { data, error } = await getSupabaseAdmin().storage.from(leadImportBucket).createSignedUploadUrl(path);
    if (error || !data?.signedUrl) throw error ?? new Error("No upload URL was returned.");
    return { ok: true, path, signedUrl: data.signedUrl };
  } catch {
    return { ok: false, error: "The secure upload could not be prepared. Please try again." };
  }
}

export async function readLeadUpload(path: string, fileName: string, clientId: string, campaignId: string): Promise<File> {
  const validationError = validateLeadUploadDescriptor(fileName, 1);
  if (validationError || !ownsLeadUploadPath(path, clientId, campaignId)) throw new Error("Invalid lead upload reference.");
  const { data, error } = await getSupabaseAdmin().storage.from(leadImportBucket).download(path);
  if (error || !data) throw error ?? new Error("The uploaded spreadsheet could not be downloaded.");
  return new File([await data.arrayBuffer()], fileName, { type: data.type });
}

export async function removeLeadUpload(path: string, clientId: string, campaignId: string): Promise<void> {
  if (!ownsLeadUploadPath(path, clientId, campaignId)) return;
  await getSupabaseAdmin().storage.from(leadImportBucket).remove([path]);
}
