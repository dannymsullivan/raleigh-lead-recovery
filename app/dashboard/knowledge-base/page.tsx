import type { Metadata } from "next";
import Link from "next/link";
import { requireCustomerWorkspace } from "@/lib/customer-workspace";
import { ChatKnowledgeManager } from "@/app/components/chat-knowledge-manager";
import { DashboardShell } from "../dashboard-shell";
import { saveKnowledge, toggleChat } from "./actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Knowledge base | Raleigh Lead Recovery", robots: { index: false, follow: false } };

export default async function KnowledgePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const client = await requireCustomerWorkspace();
  const search = await searchParams;
  return <DashboardShell active="knowledge" client={client}>
    <div className="chat-dashboard-heading"><div><p className="rlr-kicker">Your chatbot’s knowledge</p><h1>Your business. Your answers.</h1><p>The business profile you already maintain supplies common facts. Add custom answers here and keep incomplete entries as drafts.</p></div><Link className="rlr-button rlr-button-secondary" href="/dashboard/chats">Chat analytics →</Link></div>
    <ChatKnowledgeManager client={client} search={search} saveAction={saveKnowledge} toggleAction={toggleChat} />
  </DashboardShell>;
}
