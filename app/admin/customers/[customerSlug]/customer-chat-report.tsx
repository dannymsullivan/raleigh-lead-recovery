import Link from "next/link";
import { ChatReport } from "@/app/components/chat-report";
import { loadChatReport } from "@/lib/chat-report-server";

/** Rendered only after the existing CRM route authorizes the admin and client. */
export async function CustomerChatReport({ clientId, basePath, requestedPage, timezone }: { clientId: string; basePath: string; requestedPage: unknown; timezone?: string }) {
  const { page, unavailable, records, metrics, total } = await loadChatReport(clientId, requestedPage);
  if (unavailable) return <p className="chat-notice mt-6">Customer chat reporting is unavailable. Check the database connection and website-chat migration.</p>;
  return <section className="mt-6"><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><h2 className="text-2xl font-bold">Website chat · Last 30 days</h2><Link className="font-semibold underline" href={`${basePath}/notifications`}>Lead alert destination & delivery status →</Link></div><ChatReport records={records} metrics={metrics} timezone={timezone} pagination={<div className="chat-pagination">{page > 1 ? <Link href={`${basePath}?view=chats&chat_page=${page - 1}`}>← Previous</Link> : null}<span>Page {page} · {total} conversations</span>{total > page * 20 ? <Link href={`${basePath}?view=chats&chat_page=${page + 1}`}>Next →</Link> : null}</div>} /></section>;
}
