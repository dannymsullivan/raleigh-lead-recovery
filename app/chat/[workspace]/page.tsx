import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { WebsiteChat } from "@/app/components/website-chat";
import { getSupabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Website assistant", robots: { index: false, follow: false }, referrer: "no-referrer" };

export default async function ChatPage({ params }: { params: Promise<{ workspace: string }> }) {
  const { workspace } = await params;
  if (!/^[a-z0-9-]{1,100}$/.test(workspace)) notFound();
  let client;
  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin.from("clients").select("id,business_name").eq("slug", workspace).maybeSingle();
    if (error) throw error;
    if (data) {
      const { data: settings, error: settingsError } = await admin.from("website_chat_settings").select("enabled").eq("client_id", data.id).maybeSingle();
      if (settingsError) throw settingsError;
      if (settings?.enabled) client = data;
    }
  } catch { return <main className="chat-embed"><p>Chat is temporarily unavailable. Please contact the business directly.</p></main>; }
  if (!client) notFound();
  return <main className="chat-embed"><WebsiteChat workspace={workspace} businessName={client.business_name} /></main>;
}
