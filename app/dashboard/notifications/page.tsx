import type { Metadata } from "next";
import Link from "next/link";
import { requireCustomerWorkspace } from "@/lib/customer-workspace";
import { ChatLeadNotificationsPanel } from "@/app/components/chat-lead-notifications-panel";
import { DashboardShell } from "../dashboard-shell";
import { retryChatNotification, saveChatNotifications } from "./actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Lead alerts | Snappy Leads", robots: { index: false, follow: false } };
export default async function NotificationsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const client = await requireCustomerWorkspace();
  return <DashboardShell active="settings" client={client}><Link href="/dashboard/settings" className="mb-5 inline-flex underline">← Business settings</Link><ChatLeadNotificationsPanel clientId={client.id} search={await searchParams} saveAction={saveChatNotifications} retryAction={retryChatNotification} /></DashboardShell>;
}
