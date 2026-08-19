import type { SupabaseClient } from "@supabase/supabase-js";
import type { Client } from "./types";

export function customerSlug(value: string): string {
  const normalized = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized || "customer";
}

export function customerCrmPath(client: Pick<Client, "id" | "slug">): string {
  return `/admin/customers/${client.slug || client.id}`;
}

export async function uniqueCustomerSlug(
  admin: SupabaseClient,
  businessName: string,
  excludeClientId?: string
): Promise<string> {
  const base = customerSlug(businessName);
  for (let suffix = 1; suffix <= 1000; suffix += 1) {
    const candidate = suffix === 1 ? base : `${base}-${suffix}`;
    let query = admin.from("clients").select("id").eq("slug", candidate);
    if (excludeClientId) query = query.neq("id", excludeClientId);
    const { data, error } = await query.limit(1).maybeSingle();
    if (error) throw error;
    if (!data) return candidate;
  }
  throw new Error("Unable to allocate a unique customer slug.");
}
