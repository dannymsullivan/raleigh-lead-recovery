import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight, Bot, Check, ChevronRight, Clock3, Headphones, LogOut, PhoneCall, RotateCcw, Settings2, Sparkles } from "lucide-react";
import { logoutCustomerAction } from "../auth-actions";
import { BrandMark } from "../components/brand-mark";
import { getSupabaseAuth, isSupabaseAuthConfigured } from "@/lib/supabase-auth";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { contactHref } from "@/lib/contact";
import { buildReportModel, formatCurrency, formatRelativeTime } from "@/lib/report";
import type { Call, Client, CustomerAgent } from "@/lib/types";
import { markForwardingCompleteAction, retryProvisioningAction, saveCallNotesAction, updateLeadStatusAction } from "./actions";
import { ProvisioningPoll } from "./provisioning-poll";
import { recordingPlaybackPath } from "@/lib/vapi-recording";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Dashboard | Raleigh Lead Recovery", robots: { index: false, follow: false } };
type PageProps = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

export default async function DashboardPage({ searchParams }: PageProps) {
  if (!isSupabaseAuthConfigured()) redirect("/login?error=configuration");
  const auth = await getSupabaseAuth();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) redirect("/login");

  const admin = getSupabaseAdmin();
  const { data: clientData } = await admin.from("clients").select("*").eq("user_id", user.id).maybeSingle();
  if (!clientData) redirect("/signup?error=workspace");
  const client = clientData as Client;
  if (!client.onboarding_completed_at) redirect("/onboarding");
  const [{ data: callData }, { data: receptionistData }] = await Promise.all([
    admin.from("calls").select("*").eq("client_id", client.id).order("created_at", { ascending: false }).limit(50),
    admin.from("customer_agents").select("*").eq("client_id", client.id).eq("agent_type", "receptionist").eq("is_default", true).maybeSingle()
  ]);
  const calls = (callData ?? []) as Call[];
  const receptionist = receptionistData as CustomerAgent | null;
  const report = buildReportModel(client, calls);
  const search = (await searchParams) ?? {};
  const welcome = search.welcome === "1";
  const newLeads = calls.filter((call) => (call.lead_status ?? "new") === "new" && call.lead_type !== "spam").length;
  const contacted = calls.filter((call) => call.lead_status === "contacted").length;
  const booked = calls.filter((call) => call.lead_status === "booked");
  const bookedRevenue = booked.reduce((sum, call) => sum + Number(call.booked_value ?? 0), 0);
  const daysLeft = trialDaysLeft(client.trial_ends_at ?? client.pilot_end);
  const provisioningActive = receptionist?.status === "provisioning";

  return (
    <main className="product-ui min-h-screen bg-[#f4f1e8] text-black">
      <ProvisioningPoll active={provisioningActive} />
      <header className="border-b-2 border-black bg-[#f4f1e8]">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-5 sm:px-8">
          <BrandMark />
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block"><p className="text-sm font-black">{client.business_name}</p><p className="font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-black/40">{client.account_status ?? "trialing"} · {daysLeft} days left</p></div>
            <form action={logoutCustomerAction}><button className="inline-flex h-10 items-center gap-2 border-2 border-black px-3 text-sm font-extrabold hover:bg-black hover:text-white" type="submit"><LogOut className="h-4 w-4" /><span className="hidden sm:inline">Sign out</span></button></form>
          </div>
        </div>
      </header>

      <nav className="flex overflow-x-auto border-b-2 border-black bg-white px-3 lg:hidden" aria-label="Dashboard navigation">
        <Link className="flex h-12 flex-none items-center gap-2 border-b-4 border-black px-3 text-xs font-black" href="/dashboard"><PhoneCall className="h-4 w-4" /> Lead board</Link>
        <Link className="flex h-12 flex-none items-center gap-2 px-3 text-xs font-black text-black/55" href="/dashboard/reactivation"><Sparkles className="h-4 w-4" /> Reactivation</Link>
        <Link className="flex h-12 flex-none items-center gap-2 px-3 text-xs font-black text-black/55" href="/dashboard/agents"><Bot className="h-4 w-4" /> Agents</Link>
        <Link className="flex h-12 flex-none items-center gap-2 px-3 text-xs font-black text-black/55" href={`/report/${client.id}`}><ArrowUpRight className="h-4 w-4" /> Report</Link>
        <Link className="flex h-12 flex-none items-center gap-2 px-3 text-xs font-black text-black/55" href="/dashboard/settings"><Settings2 className="h-4 w-4" /> Settings</Link>
      </nav>

      <div className="mx-auto grid max-w-[1440px] lg:grid-cols-[230px_1fr]">
        <aside className="hidden min-h-[calc(100vh-82px)] border-r-2 border-black p-5 lg:flex lg:flex-col">
          <nav className="grid gap-1 text-sm font-extrabold">
            <Link className="flex items-center gap-3 px-3 py-3 hover:bg-black/5" href="/dashboard/reactivation"><Sparkles className="h-4 w-4" /> Lead reactivation</Link>
            <Link className="flex items-center gap-3 px-3 py-3 hover:bg-black/5" href="/dashboard/agents"><Bot className="h-4 w-4" /> Agents</Link>
            <Link className="flex items-center gap-3 bg-black px-3 py-3 text-white" href="/dashboard"><PhoneCall className="h-4 w-4" /> Lead board</Link>
            <Link className="flex items-center gap-3 px-3 py-3 hover:bg-black/5" href={`/report/${client.id}`}><ArrowUpRight className="h-4 w-4" /> Full report</Link>
            <Link className="flex items-center gap-3 px-3 py-3 hover:bg-black/5" href="/dashboard/settings"><Settings2 className="h-4 w-4" /> Mabel settings</Link>
          </nav>
          <div className="mt-auto border-2 border-black bg-white p-4"><p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-black/45">Need a hand?</p><p className="mt-3 text-sm font-extrabold">Setup is human. Support is too.</p><a className="mt-4 inline-flex items-center gap-2 text-xs font-extrabold underline decoration-2 underline-offset-4" href={contactHref}>Email support <ChevronRight className="h-3 w-3" /></a></div>
        </aside>

        <section className="min-w-0 px-5 py-8 sm:px-8 sm:py-10">
          {welcome ? <div className="mb-7 border-2 border-black bg-black p-5 text-white"><p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-white/50">Your trial is live</p><p className="mt-2 text-xl font-black">We’re building Mabel and getting your number ready now.</p></div> : null}

          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div><p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-black/45">Owner command center</p><h1 className="mt-2 text-3xl font-black tracking-[-0.045em] sm:text-4xl">Good {daypart()}. Here’s the board.</h1></div>
            <MabelStatus status={receptionist?.status ?? "draft"} />
          </div>

          <div className="mt-6 grid grid-cols-2 border-l border-t border-black xl:grid-cols-5">
            <Metric label="New leads" value={String(newLeads)} detail="need a callback" />
            <Metric label="Contacted" value={String(contacted)} detail="follow-up started" />
            <Metric label="Booked" value={String(booked.length)} detail="marked won" />
            <Metric label="Booked value" value={formatCurrency(bookedRevenue)} detail="owner confirmed" />
            <Metric label="Pipeline caught" value={formatCurrency(report.estimatedJobValueCaptured)} detail="estimated" mobileWide />
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-[1fr_320px]">
            <section className="border-2 border-black bg-white">
              <div className="flex flex-col gap-4 border-b-2 border-black p-5 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-xl font-black tracking-[-0.03em]">Lead inbox</h2><p className="mt-1 text-xs font-semibold text-black/45">Call back, add context, and mark the outcome.</p></div><div className="flex gap-2 font-mono text-[9px] font-bold uppercase"><span className="bg-black px-2 py-1 text-white">{newLeads} new</span><span className="border border-black px-2 py-1">{calls.length} total</span></div></div>
              {report.calls.length ? <div className="divide-y-2 divide-black">{report.calls.map((call) => <LeadCard call={call} key={call.id} />)}</div> : <EmptyCalls />}
            </section>

            <aside className="grid content-start gap-6">
              <ActivationCard agent={receptionist} client={client} />
              <div className="border-2 border-black p-5"><div className="flex items-center gap-3"><Clock3 className="h-5 w-5" /><h2 className="font-black">{daysLeft} days left in your trial</h2></div><div className="mt-4 h-2 bg-black/10"><div className="h-full bg-black" style={{ width: `${Math.max(0, Math.min(100, (daysLeft / 14) * 100))}%` }} /></div><p className="mt-3 text-sm leading-6 text-black/55">Trial ends {formatShortDate(client.trial_ends_at ?? client.pilot_end)}. No card on file.</p></div>
              <div className="border-2 border-black bg-white p-5"><p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-black/45">This trial</p><div className="mt-5 grid grid-cols-2 gap-4"><SmallStat label="Calls" value={String(report.totalCalls)} /><SmallStat label="Emergencies" value={String(report.emergenciesCaught)} /><SmallStat label="Answer rate" value={report.totalCalls ? "100%" : "—"} /><SmallStat label="Spam filtered" value={String(calls.filter((call) => call.lead_type === "spam").length)} /></div></div>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}

function LeadCard({ call }: { call: ReturnType<typeof buildReportModel>["calls"][number] }) {
  const status = call.lead_status ?? "new";
  return (
    <article className="p-5 transition-colors hover:bg-[#f4f1e8]">
      <div className="grid gap-5 sm:grid-cols-[1fr_auto]">
        <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><StatusBadge status={status} /><span className={`border border-black px-2 py-1 font-mono text-[9px] font-bold uppercase ${call.urgency === "emergency" ? "bg-black text-white" : "bg-white"}`}>{call.urgency}</span><span className="text-xs font-bold text-black/45">{formatRelativeTime(call.created_at)}</span></div><h3 className="mt-3 text-xl font-black">{call.caller_name || "New caller"}</h3><p className="mt-1 text-sm font-black">{call.callback_number || call.caller_number || "Callback number captured"}</p><p className="mt-2 max-w-2xl text-sm leading-6 text-black/60">{call.issue_description || call.summary || "Call details captured and ready for review."}</p>{call.service_address ? <p className="mt-2 text-xs font-bold text-black/45">{call.service_address}</p> : null}</div>
        <div className="sm:text-right"><p className="font-mono text-[9px] font-bold uppercase text-black/40">Est. opportunity</p><p className="mt-1 text-lg font-black">{formatCurrency(call.estimatedValue)}</p>{call.booked_value ? <p className="mt-1 text-xs font-black">Booked: {formatCurrency(Number(call.booked_value))}</p> : null}</div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {status === "new" ? <form action={updateLeadStatusAction.bind(null, call.id, "contacted")}><button className="h-9 bg-black px-3 text-xs font-black text-white" type="submit">Mark contacted</button></form> : null}
        {status !== "booked" ? <details className="relative"><summary className="list-none"><span className="inline-flex h-9 cursor-pointer items-center border-2 border-black bg-white px-3 text-xs font-black">Mark booked</span></summary><form action={updateLeadStatusAction.bind(null, call.id, "booked")} className="absolute left-0 top-11 z-20 flex w-56 border-2 border-black bg-white p-2 shadow-[5px_5px_0_#000]"><input className="min-w-0 flex-1 border border-black px-2 text-xs font-bold" name="booked_value" type="number" min="0" placeholder="Job value" /><button className="bg-black px-3 text-xs font-black text-white" type="submit">Save</button></form></details> : null}
        {status !== "lost" ? <form action={updateLeadStatusAction.bind(null, call.id, "lost")}><button className="h-9 border-2 border-black bg-white px-3 text-xs font-black" type="submit">Lost</button></form> : null}
        {status !== "spam" ? <form action={updateLeadStatusAction.bind(null, call.id, "spam")}><button className="h-9 px-2 text-xs font-black text-black/45" type="submit">Spam</button></form> : null}
      </div>

      <details className="mt-4 border-t border-black/15 pt-3"><summary className="flex cursor-pointer list-none items-center gap-2 text-xs font-black"><Headphones className="h-3.5 w-3.5" /> Recording, transcript & notes</summary><div className="mt-4 grid gap-4">
        {call.recording_url ? <audio className="w-full" controls preload="none" src={recordingPlaybackPath("calls", call.id)} /> : null}
        {call.transcript ? <pre className="max-h-52 overflow-auto whitespace-pre-wrap bg-black/5 p-3 text-xs leading-5">{call.transcript}</pre> : null}
        <form action={saveCallNotesAction.bind(null, call.id)} className="flex gap-2"><input className="min-w-0 flex-1 border-2 border-black bg-white px-3 text-sm font-semibold" name="owner_notes" defaultValue={call.owner_notes ?? ""} placeholder="Add a note for your team…" /><button className="bg-black px-4 text-xs font-black text-white" type="submit">Save note</button></form>
      </div></details>
    </article>
  );
}

function ActivationCard({ client, agent }: { client: Client; agent: CustomerAgent | null }) {
  const status = agent?.status ?? "draft";
  const ready = status === "ready";
  const number = agent?.provisioned_phone_number ?? client.provisioned_phone_number;
  if (status === "draft" || status === "disabled") return <div className="border border-black bg-white p-5"><p className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-black/45">24/7 receptionist</p><h2 className="mt-2 text-xl font-black tracking-[-0.03em]">Inbound coverage is not enabled.</h2><p className="mt-2 text-sm font-semibold leading-6 text-black/50">Set up a dedicated agent and phone number when this business is ready for around-the-clock call capture.</p><Link className="mt-4 inline-flex h-10 items-center bg-black px-4 text-xs font-black text-white" href="/dashboard/agents">Configure receptionist</Link></div>;
  return (
    <div className="border-2 border-black bg-black p-6 text-white">
      <Sparkles className="h-6 w-6" /><p className="mt-7 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-white/45">Go-live checklist</p><h2 className="mt-3 text-2xl font-black tracking-[-0.04em]">{ready ? "Your Mabel number is ready." : status === "error" || status === "needs_configuration" ? "Provisioning needs attention." : "Building your call setup…"}</h2>
      {number ? <a className="mt-5 block text-3xl font-black tracking-[-0.04em]" href={`tel:${number}`}>{formatPhone(number)}</a> : null}
      <ol className="mt-6 grid gap-4 text-sm font-bold text-white/70"><ChecklistItem done={Boolean(agent?.vapi_assistant_id)} label="Mabel configured" /><ChecklistItem done={Boolean(agent?.vapi_phone_number_id)} label="Number assigned" /><ChecklistItem done={Boolean(client.forwarding_completed_at)} label="Missed-call forwarding on" /><ChecklistItem done={Boolean(client.test_call_completed_at)} label="Test call received" /></ol>
      {ready && !client.forwarding_completed_at ? <form action={markForwardingCompleteAction}><button className="mt-7 w-full bg-white px-4 py-3 text-sm font-black text-black" type="submit">I turned forwarding on</button></form> : null}
      {ready && client.forwarding_completed_at && !client.test_call_completed_at && number ? <a className="mt-7 inline-flex w-full items-center justify-center gap-2 bg-white px-4 py-3 text-sm font-black text-black" href={`tel:${number}`}><PhoneCall className="h-4 w-4" /> Make the test call</a> : null}
      {(status === "error" || status === "needs_configuration") ? <><p className="mt-4 text-xs leading-5 text-white/55">{agent?.provisioning_error || client.provisioning_error}</p><form action={retryProvisioningAction}><button className="mt-5 inline-flex w-full items-center justify-center gap-2 bg-white px-4 py-3 text-sm font-black text-black" type="submit"><RotateCcw className="h-4 w-4" /> Retry provisioning</button></form></> : null}
      {ready && client.test_call_completed_at ? <p className="mt-6 flex items-center gap-2 border-t border-white/20 pt-5 text-sm font-black"><Check className="h-4 w-4" /> Live and catching calls</p> : null}
    </div>
  );
}

function ChecklistItem({ done, label }: { done: boolean; label: string }) { return <li className="flex items-center gap-3"><span className={`grid h-5 w-5 place-items-center rounded-full border ${done ? "bg-white text-black" : "border-white/35"}`}>{done ? <Check className="h-3 w-3" /> : null}</span>{label}</li>; }
function MabelStatus({ status }: { status: CustomerAgent["status"] }) { const ready = status === "ready"; return <div className="flex items-center gap-2 text-sm font-extrabold"><span className={`h-2.5 w-2.5 rounded-full ${ready ? "animate-pulse bg-black" : "border-2 border-black"}`} />{ready ? "Receptionist ready" : status === "error" || status === "needs_configuration" ? "Setup needs attention" : status === "draft" || status === "disabled" ? "Receptionist not enabled" : "Setting Mabel up"}</div>; }
function StatusBadge({ status }: { status: string }) { const labels: Record<string, string> = { new: "New lead", contacted: "Contacted", booked: "Booked", lost: "Lost", spam: "Spam" }; return <span className={`border border-black px-2 py-1 font-mono text-[9px] font-bold uppercase ${status === "booked" ? "bg-black text-white" : "bg-white"}`}>{labels[status] ?? status}</span>; }
function EmptyCalls() { return <div className="grid min-h-72 place-items-center p-8 text-center"><div className="max-w-sm"><PhoneCall className="mx-auto h-10 w-10" strokeWidth={1.5} /><h3 className="mt-5 text-2xl font-black tracking-[-0.04em]">The board is ready.</h3><p className="mt-3 text-sm leading-6 text-black/55">Your first test call will appear here with a summary, urgency, callback details, and recording.</p></div></div>; }
function Metric({ label, value, detail, mobileWide = false }: { label: string; value: string; detail: string; mobileWide?: boolean }) { return <div className={`border-b border-r border-black bg-white p-3.5 sm:p-4 ${mobileWide ? "col-span-2 xl:col-span-1" : ""}`}><p className="font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-black/45">{label}</p><p className="mt-2 text-xl font-black tracking-[-0.045em] sm:text-2xl">{value}</p><p className="mt-1 text-[11px] font-semibold text-black/40">{detail}</p></div>; }
function SmallStat({ label, value }: { label: string; value: string }) { return <div><p className="text-2xl font-black">{value}</p><p className="mt-1 text-[10px] font-bold uppercase text-black/40">{label}</p></div>; }
function daypart(): string { const hour = new Date().getHours(); return hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening"; }
function trialDaysLeft(value: string): number { const date = value.includes("T") ? new Date(value) : new Date(`${value}T23:59:59`); return Math.max(0, Math.ceil((date.getTime() - Date.now()) / 86_400_000)); }
function formatShortDate(value: string): string { const date = value.includes("T") ? new Date(value) : new Date(`${value}T12:00:00`); return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date); }
function formatPhone(value: string): string { const digits = value.replace(/\D/g, "").slice(-10); return digits.length === 10 ? `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}` : value; }
