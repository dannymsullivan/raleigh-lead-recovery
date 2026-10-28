import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { adminCookie, verifyAdminSessionToken } from "@/lib/admin";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { customerCrmPath } from "@/lib/customer-slug";
import { ChatLeadNotificationsPanel } from "@/app/components/chat-lead-notifications-panel";
import { retryAdminChatNotification, saveAdminChatNotifications } from "@/app/dashboard/notifications/actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Customer lead alerts | Snappy Leads", robots: { index: false, follow: false } };
export default async function AdminNotificationsPage({ params, searchParams }: { params: Promise<{ customerSlug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  if (!verifyAdminSessionToken((await cookies()).get(adminCookie.name)?.value)) redirect("/admin?error=session");
  const { customerSlug } = await params;
  const column = /^[a-f0-9]{8}-[a-f0-9-]{27}$/i.test(customerSlug) ? "id" : "slug";
  const { data: client, error } = await getSupabaseAdmin().from("clients").select("id,slug,business_name").eq(column, customerSlug).maybeSingle();
  if (error || !client) notFound();
  return <main className="mx-auto max-w-5xl px-5 py-10"><Link className="mb-5 inline-flex underline" href={`${customerCrmPath(client)}?view=chats`}>← {client.business_name} chat dashboard</Link><ChatLeadNotificationsPanel clientId={client.id} search={await searchParams} saveAction={saveAdminChatNotifications.bind(null, client.id)} retryAction={retryAdminChatNotification.bind(null, client.id)} /></main>;
}
