import "server-only";

import { provisionCustomerAgent } from "./customer-agent-provisioning";
import { getSupabaseAdmin } from "./supabase-server";

export async function provisionClientWorkspace(userId: string, options: { forceAssistantUpdate?: boolean } = {}): Promise<void> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin.from("clients").select("id").eq("user_id", userId).maybeSingle();
  if (error) throw error;
  if (!data) return;
  await provisionCustomerAgent(data.id as string, "receptionist", { forceUpdate: options.forceAssistantUpdate });
}
