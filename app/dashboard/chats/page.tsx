import type { Metadata } from "next";
import Link from "next/link";
import { requireCustomerWorkspace } from "@/lib/customer-workspace";
import { loadChatReport } from "@/lib/chat-report-server";
import { DashboardShell } from "../dashboard-shell";
import { updateChatLead } from "./actions";
import { ChatReport } from "@/app/components/chat-report";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Chat analytics | Raleigh Lead Recovery", robots: { index: false, follow: false } };

export default async function ChatsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const client = await requireCustomerWorkspace();
  const search = await searchParams;
  const { page, unavailable, records, metrics, total } = await loadChatReport(client.id, search.page);
  return <DashboardShell active="chats" client={client}>
    <div className="chat-dashboard-heading"><div><p className="rlr-kicker">Website chat · Last 30 days</p><h1>See the conversation. Follow the lead.</h1><p>See where each chat started and which website or campaign brought the visitor, when available. Mark booked jobs and add their value as you follow up.</p></div><Link className="rlr-button rlr-button-primary" href="/dashboard/knowledge-base">Manage chatbot</Link></div>
    {unavailable ? <div className="chat-notice" role="alert">We couldn’t load your conversations. Try refreshing, or contact Danny for help.</div> : <>
      {search.error ? <p className="chat-notice" role="alert">We couldn’t save that lead. Check the values and try again.</p> : null}
      {search.saved ? <p className="chat-notice" role="status">Lead outcome saved.</p> : null}
      <ChatReport records={records} metrics={metrics} action={updateChatLead} timezone={client.timezone || "America/New_York"} pagination={<div className="chat-pagination">{page > 1 ? <Link href={`/dashboard/chats?page=${page - 1}`}>← Previous</Link> : null}<span>Page {page} · {total} conversations</span>{total > page * 20 ? <Link href={`/dashboard/chats?page=${page + 1}`}>Next →</Link> : null}</div>} />
    </>}
  </DashboardShell>;
}
