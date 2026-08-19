import { cookies } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Building2, CalendarDays, Headphones, PhoneCall, TestTube2, Users } from "lucide-react";
import { adminCookie, verifyAdminSessionToken } from "@/lib/admin";
import { maskPhoneNumber } from "@/lib/phone";
import { reactivationTelephonyReady } from "@/lib/reactivation-vapi";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import type { Call, Client, ReactivationAttempt, ReactivationCampaign, ReactivationContact } from "@/lib/types";
import { recordingPlaybackPath } from "@/lib/vapi-recording";
import { placeTestBusinessCallAction } from "../../test-business/actions";
import { customerCrmPath } from "@/lib/customer-slug";

export const dynamic = "force-dynamic";
type PageProps = { params: Promise<{ customerSlug: string }>; searchParams?: Promise<Record<string, string | string[] | undefined>> };

export default async function CustomerCrmPage({ params, searchParams }: PageProps) {
  const cookieStore = await cookies();
  if (!verifyAdminSessionToken(cookieStore.get(adminCookie.name)?.value)) redirect("/admin?error=session");
  const { customerSlug } = await params;
  const admin = getSupabaseAdmin();
  const lookupColumn = /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(customerSlug) ? "id" : "slug";
  const { data: clientData } = await admin.from("clients").select("*").eq(lookupColumn, customerSlug).maybeSingle();
  if (!clientData) notFound();
  const client = clientData as Client;
  const clientId = client.id;
  const [{ data: campaignData }, { data: contactData }, { data: attemptData }, { data: callData }] = await Promise.all([
    admin.from("reactivation_campaigns").select("*").eq("client_id", clientId).order("created_at", { ascending: false }),
    admin.from("reactivation_contacts").select("*").eq("client_id", clientId).order("updated_at", { ascending: false }),
    admin.from("reactivation_attempts").select("*").eq("client_id", clientId).order("created_at", { ascending: false }),
    admin.from("calls").select("*").eq("client_id", clientId).order("created_at", { ascending: false }).limit(50)
  ]);
  const campaigns = (campaignData ?? []) as ReactivationCampaign[];
  const contacts = (contactData ?? []) as ReactivationContact[];
  const attempts = (attemptData ?? []) as ReactivationAttempt[];
  const inboundCalls = (callData ?? []) as Call[];
  const reached = contacts.filter((contact) => !["queued", "calling", "no_answer", "failed"].includes(contact.status)).length;
  const interested = contacts.filter((contact) => ["interested", "follow_up", "booked"].includes(contact.status)).length;
  const booked = contacts.filter((contact) => contact.status === "booked");
  const pipeline = booked.reduce((total, contact) => total + Number(contact.estimated_value ?? client.avg_job_value ?? 0), 0);
  const search = (await searchParams) ?? {};
  const notice = crmNotice(search);
  const testContact = client.is_test_account ? contacts[0] : null;

  return <main className="min-h-screen bg-[#f4f1e8] text-black">
    <header className="border-b-2 border-black"><div className="mx-auto flex max-w-[1500px] items-center justify-between px-5 py-5 sm:px-8"><Link className="inline-flex items-center gap-2 text-sm font-black" href="/admin"><ArrowLeft className="h-4 w-4" /> Control room</Link><span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em]">Customer CRM</span></div></header>
    <div className="mx-auto max-w-[1500px] px-5 py-8 sm:px-8 sm:py-11">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"><div><div className="flex flex-wrap items-center gap-3"><p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-black/45">Customer workspace</p>{client.is_test_account ? <span className="border border-black bg-[#d8ff57] px-2 py-1 font-mono text-[9px] font-bold uppercase">Test account</span> : null}</div><h1 className="mt-3 text-5xl font-black tracking-[-0.06em] sm:text-7xl">{client.business_name}</h1><p className="mt-4 text-sm font-semibold text-black/55">{client.trade} · {client.service_area || "Service area not set"} · {client.owner_name} · {maskPhoneNumber(client.owner_phone)}</p></div><div className="border-2 border-black bg-white px-5 py-4"><p className="font-mono text-[9px] font-bold uppercase text-black/45">Account status</p><p className="mt-2 text-xl font-black">{client.account_status || "onboarding"}</p></div></div>
      {notice ? <div className={`mt-7 border-2 border-black p-4 text-sm font-black ${notice.error ? "bg-black text-white" : "bg-[#d8ff57]"}`}>{notice.text}</div> : null}

      <section className="mt-9 grid border-l-2 border-t-2 border-black sm:grid-cols-2 xl:grid-cols-6">
        <Metric icon={CalendarDays} label="Campaigns" value={campaigns.length} detail="all segments" />
        <Metric icon={Users} label="Leads" value={contacts.length} detail="loaded contacts" />
        <Metric icon={PhoneCall} label="Attempts" value={attempts.length + inboundCalls.length} detail="all calls" />
        <Metric icon={Users} label="Reached" value={reached} detail="resolved outcomes" />
        <Metric icon={Building2} label="Interested" value={interested} detail="active opportunity" accent />
        <Metric icon={CalendarDays} label="Pipeline" value={`$${pipeline.toLocaleString()}`} detail={`${booked.length} booked`} />
      </section>

      {client.is_test_account ? <section className="mt-8 border-2 border-black bg-[#d8ff57] p-6 sm:p-8"><div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end"><div><div className="flex items-center gap-2"><TestTube2 className="h-5 w-5" /><p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em]">End-to-end test lab</p></div><h2 className="mt-3 text-3xl font-black tracking-[-0.05em]">Call through the real customer pipeline.</h2><p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-black/60">Mabel receives this account’s business name, owner, service, lead source, age, and notes. The safety guard only permits the configured owner or alert phone.</p></div>{testContact ? <form action={placeTestBusinessCallAction.bind(null, client.id, customerCrmPath(client), testContact.id)}><button className="h-12 bg-black px-5 text-sm font-black text-white disabled:opacity-40" disabled={!reactivationTelephonyReady()} type="submit">Call {maskPhoneNumber(testContact.phone_e164)} now</button></form> : null}</div></section> : null}

      <section className="mt-10 grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="border-2 border-black bg-white"><div className="border-b-2 border-black p-5"><p className="font-mono text-[10px] font-bold uppercase text-black/45">Campaigns</p><h2 className="mt-1 text-2xl font-black">Recovery programs</h2></div><div className="divide-y-2 divide-black">{campaigns.map((campaign) => <div className="p-5" key={campaign.id}><div className="flex items-start justify-between gap-4"><div><p className="font-black">{campaign.name}</p><p className="mt-1 text-xs font-semibold text-black/45">{campaign.service_type} · {campaign.max_attempts} attempts max</p></div><Status value={campaign.status} /></div></div>)}{!campaigns.length ? <p className="p-5 text-sm font-semibold text-black/45">No campaigns yet.</p> : null}</div></div>
        <div className="border-2 border-black bg-white"><div className="border-b-2 border-black p-5"><p className="font-mono text-[10px] font-bold uppercase text-black/45">Lead pipeline</p><h2 className="mt-1 text-2xl font-black">Every contact and outcome</h2></div><div className="divide-y-2 divide-black">{contacts.map((contact) => { const latest = attempts.find((attempt) => attempt.contact_id === contact.id); return <article className="p-5" key={contact.id}><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><p className="font-black">{contact.name}</p><Status value={contact.status} /></div><p className="mt-1 text-xs font-semibold text-black/45">{contact.source || "Imported lead"} · {maskPhoneNumber(contact.phone_e164)} · {contact.attempt_count} attempts</p>{contact.qualification_notes || latest?.summary ? <p className="mt-3 text-sm font-semibold leading-6 text-black/60">{contact.qualification_notes || latest?.summary}</p> : null}</div>{contact.requested_timing ? <span className="font-mono text-[10px] font-bold uppercase">{contact.requested_timing}</span> : null}</div>{latest?.transcript || (latest?.recording_url && latest.vapi_call_id) ? <details className="mt-4 border-t border-black/20 pt-4"><summary className="flex cursor-pointer list-none items-center gap-2 text-xs font-black"><Headphones className="h-4 w-4" /> Recording and transcript</summary><div className="mt-4 grid gap-4">{latest.recording_url && latest.vapi_call_id ? <audio className="w-full" controls preload="none" src={recordingPlaybackPath("reactivation-attempts", latest.id)} /> : null}{latest.transcript ? <pre className="max-h-56 overflow-auto whitespace-pre-wrap bg-black/5 p-4 text-xs leading-5">{latest.transcript}</pre> : null}</div></details> : null}</article>; })}{!contacts.length ? <p className="p-5 text-sm font-semibold text-black/45">No leads loaded yet.</p> : null}</div></div>
      </section>

      {inboundCalls.length ? <section className="mt-10 border-2 border-black bg-white"><div className="border-b-2 border-black p-5"><p className="font-mono text-[10px] font-bold uppercase text-black/45">Missed-call recovery</p><h2 className="mt-1 text-2xl font-black">Inbound call history</h2></div><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-black/5 font-mono text-[9px] uppercase"><tr><th className="p-4">Caller</th><th className="p-4">Issue</th><th className="p-4">Urgency</th><th className="p-4">Status</th><th className="p-4">Created</th></tr></thead><tbody className="divide-y divide-black/15">{inboundCalls.map((call) => <tr key={call.id}><td className="p-4 font-black">{call.caller_name || maskPhoneNumber(call.caller_number || "Unknown")}</td><td className="p-4 font-semibold text-black/60">{call.issue_description || call.summary || "No summary"}</td><td className="p-4"><Status value={call.urgency} /></td><td className="p-4"><Status value={call.lead_status || "new"} /></td><td className="p-4 text-xs font-semibold text-black/45">{formatDate(call.created_at)}</td></tr>)}</tbody></table></div></section> : null}
    </div>
  </main>;
}

function Metric({ icon: Icon, label, value, detail, accent = false }: { icon: typeof Users; label: string; value: string | number; detail: string; accent?: boolean }) { return <div className={`border-b-2 border-r-2 border-black p-5 ${accent ? "bg-[#d8ff57]" : "bg-white"}`}><div className="flex items-center justify-between"><p className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-black/45">{label}</p><Icon className="h-4 w-4" /></div><p className="mt-4 text-3xl font-black tracking-[-0.055em]">{value}</p><p className="mt-2 text-xs font-semibold text-black/40">{detail}</p></div>; }
function Status({ value }: { value: string }) { const accent = ["interested", "booked", "running", "active"].includes(value); return <span className={`inline-flex border border-black px-2 py-1 font-mono text-[9px] font-bold uppercase ${accent ? "bg-[#d8ff57]" : "bg-white"}`}>{value.replaceAll("_", " ")}</span>; }
function formatDate(value: string): string { return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value)); }
function crmNotice(search: Record<string, string | string[] | undefined>): { text: string; error: boolean } | null { if (search.setup === "1") return { text: "Test business is ready. Its seeded lead uses the full production variable and webhook path.", error: false }; if (search.called === "1") return { text: "Mabel’s test call was queued with this customer and lead data.", error: false }; const error = typeof search.error === "string" ? search.error : null; if (!error) return null; const messages: Record<string, string> = { telephony: "Production Vapi calling is not configured.", "test-record": "The protected test customer or lead could not be found.", "test-guard": "The test-call safety guard blocked a phone that is not the owner or alert number.", call: "Vapi could not queue the test call." }; return { text: messages[error] || "The request could not be completed.", error: true }; }
