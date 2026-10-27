import type { Metadata } from "next";
import Link from "next/link";
import { requireCustomerWorkspace } from "@/lib/customer-workspace";
import { ChatKnowledgeManager } from "@/app/components/chat-knowledge-manager";
import { DashboardShell } from "../dashboard-shell";
import { saveKnowledge, toggleChat } from "./actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Knowledge base | Snappy Leads", robots: { index: false, follow: false } };

export default async function KnowledgePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const client = await requireCustomerWorkspace();
  const search = await searchParams;
  return <DashboardShell active="knowledge" client={client}>
    <div className="chat-dashboard-heading"><div><p className="rlr-kicker">Your chatbot’s knowledge</p><h1>Your business. Your answers.</h1><p>Your business profile supplies your services, hours, and service area. Add answers to other customer questions here. Publish an answer when it’s ready for visitors to see.</p></div><Link className="rlr-button rlr-button-secondary" href="/dashboard/chats">Chat analytics →</Link></div>
    <ChatKnowledgeManager client={client} search={search} saveAction={saveKnowledge} toggleAction={toggleChat} />
  </DashboardShell>;
}
