"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { adminCookie, verifyAdminSessionToken } from "@/lib/admin";
import { ensureDefaultCustomerAgent, provisionCustomerAgent } from "@/lib/customer-agent-provisioning";
import { getSupabaseAuth, isSupabaseAuthConfigured } from "@/lib/supabase-auth";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import type { CustomerAgentType } from "@/lib/types";

function value(formData: FormData, key: string, max = 4000): string | null {
  const entry = formData.get(key);
  if (typeof entry !== "string") return null;
  return entry.trim().slice(0, max) || null;
}

function validType(type: string): type is CustomerAgentType {
  return type === "receptionist" || type === "lead_reactivation";
}

async function customerClientId(): Promise<string> {
  if (!isSupabaseAuthConfigured()) redirect("/login?error=configuration");
  const auth = await getSupabaseAuth();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) redirect("/login");
  const { data } = await getSupabaseAdmin().from("clients").select("id").eq("user_id", user.id).maybeSingle();
  if (!data) redirect("/signup?error=workspace");
  return data.id as string;
}

async function requireAdminClient(clientId: string): Promise<void> {
  const cookieStore = await cookies();
  if (!verifyAdminSessionToken(cookieStore.get(adminCookie.name)?.value)) redirect("/admin?error=session");
  const { data } = await getSupabaseAdmin().from("clients").select("id").eq("id", clientId).maybeSingle();
  if (!data) redirect("/admin?error=client-missing");
}

async function saveAndProvision(clientId: string, type: string, returnPath: string, formData: FormData): Promise<void> {
  if (!validType(type)) redirect(`${returnPath}?error=agent_type#agents`);
  const agent = await ensureDefaultCustomerAgent(clientId, type);
  if (type === "receptionist" && agent.status !== "ready" && formData.get("enable_confirmation") !== "on") {
    redirect(`${returnPath}?error=agent_confirmation#agents`);
  }
  const admin = getSupabaseAdmin();
  const { error } = await admin.from("customer_agents").update({
    name: value(formData, "name", 160) || agent.name,
    first_message: value(formData, "first_message", 1000),
    offer_details: type === "lead_reactivation" ? value(formData, "offer_details", 2000) : null,
    handoff_rules: value(formData, "handoff_rules", 2000),
    custom_instructions: value(formData, "custom_instructions", 4000),
    voice_id: value(formData, "voice_id", 80) || "Savannah"
  }).eq("id", agent.id).eq("client_id", clientId);
  if (error) redirect(`${returnPath}?error=agent_save#agents`);
  try {
    await provisionCustomerAgent(clientId, type, { forceUpdate: true });
  } catch {
    redirect(`${returnPath}?error=agent_provision#agents`);
  }
  revalidatePath(returnPath);
  redirect(`${returnPath}?agent_saved=${type}#agents`);
}

export async function saveCustomerAgentAction(type: string, formData: FormData): Promise<void> {
  return saveAndProvision(await customerClientId(), type, "/dashboard/agents", formData);
}

export async function saveAdminCustomerAgentAction(clientId: string, returnPath: string, type: string, formData: FormData): Promise<void> {
  await requireAdminClient(clientId);
  return saveAndProvision(clientId, type, returnPath, formData);
}
