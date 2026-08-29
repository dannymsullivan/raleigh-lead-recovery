"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminCookie, verifyAdminSessionToken } from "@/lib/admin";
import { outreachStages, type OutreachStage } from "@/lib/outreach";
import { getSupabaseAdmin } from "@/lib/supabase-server";

function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function nullableText(formData: FormData, key: string, maxLength: number): string | null {
  return formString(formData, key).slice(0, maxLength) || null;
}

function nullableDate(formData: FormData, key: string): string | null {
  const value = formString(formData, key);
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

function stageValue(formData: FormData): OutreachStage {
  const value = formString(formData, "stage");
  return outreachStages.includes(value as OutreachStage)
    ? (value as OutreachStage)
    : "not_contacted";
}

async function requireAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  if (!verifyAdminSessionToken(cookieStore.get(adminCookie.name)?.value)) {
    redirect("/admin?error=session");
  }
}

function prospectValues(formData: FormData) {
  return {
    company_name: formString(formData, "company_name").slice(0, 160),
    website: nullableText(formData, "website", 500),
    city: nullableText(formData, "city", 100),
    contact_name: nullableText(formData, "contact_name", 160),
    contact_role: nullableText(formData, "contact_role", 120),
    email: nullableText(formData, "email", 320)?.toLowerCase() ?? null,
    phone: nullableText(formData, "phone", 60),
    stage: stageValue(formData),
    last_contacted_on: nullableDate(formData, "last_contacted_on"),
    next_follow_up_on: nullableDate(formData, "next_follow_up_on"),
    notes: nullableText(formData, "notes", 3000),
  };
}

export async function addOutreachProspectAction(formData: FormData): Promise<void> {
  await requireAdminSession();
  const values = prospectValues(formData);
  if (!values.company_name) redirect("/admin/outreach?error=company#add-prospect");

  const { error } = await getSupabaseAdmin().from("outreach_prospects").insert(values);
  if (error) throw error;

  revalidatePath("/admin/outreach");
  redirect("/admin/outreach?created=1");
}

export async function updateOutreachProspectAction(
  prospectId: string,
  formData: FormData,
): Promise<void> {
  await requireAdminSession();
  const values = prospectValues(formData);
  if (!values.company_name) redirect("/admin/outreach?error=company");

  const { error } = await getSupabaseAdmin()
    .from("outreach_prospects")
    .update(values)
    .eq("id", prospectId);
  if (error) throw error;

  revalidatePath("/admin/outreach");
  redirect("/admin/outreach?updated=1");
}

export async function deleteOutreachProspectAction(prospectId: string): Promise<void> {
  await requireAdminSession();
  const { error } = await getSupabaseAdmin()
    .from("outreach_prospects")
    .delete()
    .eq("id", prospectId);
  if (error) throw error;

  revalidatePath("/admin/outreach");
  redirect("/admin/outreach?deleted=1");
}
