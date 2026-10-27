import "server-only";
import { redirect } from "next/navigation";
import { getSupabaseAuth, isSupabaseAuthConfigured } from "./supabase-auth";
import { getSupabaseAdmin } from "./supabase-server";
import type { Client } from "./types";
import { cookies } from "next/headers";
import { adminCookie, verifyAdminSessionToken } from "./admin";

export async function requireCustomerWorkspace(): Promise<Client> {
  if (!isSupabaseAuthConfigured()) redirect("/login?error=configuration");
  const auth = await getSupabaseAuth();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) redirect("/login");
  const { data, error } = await getSupabaseAdmin().from("clients").select("*").eq("user_id", user.id).maybeSingle();
  if (error) throw new Error("Unable to load your workspace. Please try again.");
  if (!data) redirect("/signup?error=workspace");
  return data as Client;
}

export async function requireAdminWorkspace(clientId: string): Promise<Client> {
  const cookieStore = await cookies();
  if (!verifyAdminSessionToken(cookieStore.get(adminCookie.name)?.value)) redirect("/admin?error=session");
  const { data, error } = await getSupabaseAdmin().from("clients").select("*").eq("id", clientId).maybeSingle();
  if (error || !data) redirect("/admin?error=client-missing");
  return data as Client;
}
