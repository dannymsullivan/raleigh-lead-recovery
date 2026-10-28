import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";
import Retell from "retell-sdk";
import { syncCustomerChat } from "../lib/customer-chat-provisioning";
import { businessProfileKnowledge, effectiveChatKnowledge } from "../lib/chat-knowledge";
import type { KnowledgeEntry } from "../lib/chat";

loadEnvConfig(process.cwd());
async function main() {
  const args = process.argv.slice(2);
  const option = (name: string) => { const index = args.indexOf(name); return index < 0 ? undefined : args[index + 1]; };
  const slug = option("--workspace");
  const monthlyLimit = Number(option("--monthly-attempts"));
  const dailyLimit = Number(option("--daily-attempts"));
  const dryRun = args.includes("--dry-run");
  if (!slug || !/^[a-z0-9-]{1,100}$/.test(slug) || dryRun === args.includes("--activate") || !Number.isInteger(monthlyLimit) || !Number.isInteger(dailyLimit)
    || monthlyLimit < 1 || monthlyLimit > 1_000_000 || dailyLimit < 1 || dailyLimit > Math.min(monthlyLimit, 100_000)) {
    throw new Error("Usage: npx tsx scripts/sync-customer-chat.ts --workspace <slug> --monthly-attempts <number> --daily-attempts <number> <--dry-run|--activate>");
  }
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!process.env.SUPABASE_URL || !key) throw new Error("Missing database configuration");
  const admin = createClient(process.env.SUPABASE_URL, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: client, error } = await admin.from("clients").select("id,business_name,services,service_area,business_hours,timezone").eq("slug", slug).single();
  if (error || !client) throw new Error("The explicit customer workspace was not found");
  if (dryRun) {
    const [settings, entries, config] = await Promise.all([
      admin.from("website_chat_settings").select("enabled,engine,use_business_profile").eq("client_id", client.id).maybeSingle(),
      admin.from("website_knowledge").select("id,title,content,keywords,published").eq("client_id", client.id).eq("published", true).limit(200),
      admin.from("website_chat_agents").select("status,retell_agent_id,retell_knowledge_base_id").eq("client_id", client.id).maybeSingle(),
    ]);
    if (settings.error || entries.error || config.error) throw new Error("Cannot prepare plan; apply the customer chat migration first");
    const knowledge = effectiveChatKnowledge(settings.data?.use_business_profile !== false ? businessProfileKnowledge(client) : [], (entries.data ?? []) as KnowledgeEntry[]);
    console.log(JSON.stringify({ dryRun: true, workspace: slug, currentEngine: settings.data?.engine ?? "local", widgetEnabled: settings.data?.enabled ?? false,
      approvedArticles: knowledge.length, agent: config.data?.retell_agent_id ? "update this customer's dedicated agent" : "create a dedicated customer agent",
      knowledgeBase: config.data?.retell_knowledge_base_id ? "reconcile approved sources inside this customer's dedicated knowledge base" : "create or recover a dedicated customer knowledge base",
      monthlyLimit, dailyLimit, providerRetentionDays: 7, note: "No provider or database changes. Activation leaves the enabled/paused setting unchanged." }));
    return;
  }
  if (!process.env.RETELL_API_KEY || !(process.env.CHAT_SESSION_SECRET || process.env.DEMO_CALL_HASH_SECRET)) throw new Error("Missing server AI configuration");
  const retell = new Retell({ apiKey: process.env.RETELL_API_KEY, timeout: 30_000, maxRetries: 0 });
  const result = await syncCustomerChat(admin, retell, { clientId: client.id, monthlyLimit, dailyLimit });
  console.log(JSON.stringify({ workspace: slug, ...result, note: "Only this workspace is configured. Its enabled/paused setting is unchanged." }));
}
main().catch(error => { console.error(error instanceof Error ? error.message : "Customer sync failed"); process.exitCode = 1; });
