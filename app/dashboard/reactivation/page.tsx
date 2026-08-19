import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CalendarCheck, Check, CircleAlert, Database, Headphones, Pause, Phone, PhoneCall, Play, Upload, Users } from "lucide-react";
import { BrandMark } from "@/app/components/brand-mark";
import { getSupabaseAuth, isSupabaseAuthConfigured } from "@/lib/supabase-auth";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { reactivationTelephonyReady } from "@/lib/reactivation-vapi";
import type { Client, ReactivationAttempt, ReactivationCampaign, ReactivationContact } from "@/lib/types";
import { recordingPlaybackPath } from "@/lib/vapi-recording";
import { createReactivationCampaignAction, importReactivationLeadsAction, launchReactivationCampaignAction, pauseReactivationCampaignAction, resumeReactivationCampaignAction, updateReactivationLeadAction } from "./actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Lead Reactivation | Raleigh Lead Recovery", robots: { index: false, follow: false } };
type PageProps = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

export default async function ReactivationDashboardPage({ searchParams }: PageProps) {
  if (!isSupabaseAuthConfigured()) redirect("/login?error=configuration");
  const auth = await getSupabaseAuth();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) redirect("/login");
  const admin = getSupabaseAdmin();
  const { data: clientData } = await admin.from("clients").select("*").eq("user_id", user.id).maybeSingle();
  if (!clientData) redirect("/signup?error=workspace");
  const client = clientData as Client;
  if (!client.onboarding_completed_at) redirect("/onboarding");
  const { data: campaignData } = await admin.from("reactivation_campaigns").select("*").eq("client_id", client.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
  const campaign = campaignData as ReactivationCampaign | null;
  const search = (await searchParams) ?? {};
  const message = dashboardMessage(search);
  const telephonyReady = reactivationTelephonyReady();

  let contacts: ReactivationContact[] = [];
  let attempts: ReactivationAttempt[] = [];
  if (campaign) {
    const [{ data: contactData }, { data: attemptData }] = await Promise.all([
      admin.from("reactivation_contacts").select("*").eq("campaign_id", campaign.id).order("updated_at", { ascending: false }),
      admin.from("reactivation_attempts").select("*").eq("campaign_id", campaign.id).order("created_at", { ascending: false })
    ]);
    contacts = (contactData ?? []) as ReactivationContact[];
    attempts = (attemptData ?? []) as ReactivationAttempt[];
  }
  const interested = contacts.filter((contact) => contact.status === "interested");
  const contacted = contacts.filter((contact) => ["interested", "follow_up", "booked", "contacted", "not_interested", "completed_project", "wrong_number", "do_not_call"].includes(contact.status)).length;
  const booked = contacts.filter((contact) => contact.status === "booked");
  const pipeline = booked.reduce((sum, contact) => sum + Number(contact.estimated_value ?? 0), 0);

  return (
    <main className="min-h-screen bg-[#f4f1e8] text-black">
      <header className="border-b-2 border-black"><div className="mx-auto flex max-w-[1500px] items-center justify-between px-5 py-5 sm:px-8"><BrandMark /><div className="flex items-center gap-4">{client.product_mode === "missed_call_recovery" ? <Link className="hidden text-sm font-black sm:inline" href="/dashboard">Missed calls</Link> : null}<Link className="inline-flex items-center gap-2 border-2 border-black px-3 py-2 text-sm font-black" href="/dashboard/settings">Settings</Link></div></div></header>
      <div className="mx-auto max-w-[1500px] px-5 py-8 sm:px-8 sm:py-11">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"><div><p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-black/45">Lead recovery command center</p><h1 className="mt-3 text-5xl font-black tracking-[-0.06em] sm:text-7xl">Turn the old list back on.</h1><p className="mt-5 max-w-2xl text-base font-semibold leading-7 text-black/55">Import eligible prior inquiries, let Mabel reopen the conversation, and move interested people to your team immediately.</p></div><div className={`border-2 border-black px-4 py-3 text-sm font-black ${telephonyReady ? "bg-[#d8ff57]" : "bg-white"}`}><span className={`mr-2 inline-block h-2.5 w-2.5 rounded-full ${telephonyReady ? "bg-black" : "border-2 border-black"}`} />{telephonyReady ? "Outbound Mabel ready" : "Caller number required"}</div></div>
        {message ? <div className={`mt-8 border-2 border-black p-4 text-sm font-black ${message.error ? "bg-black text-white" : "bg-[#d8ff57]"}`}>{message.text}</div> : null}

        {!campaign ? <CreateCampaign /> : <>
          <section className="mt-9 grid border-l-2 border-t-2 border-black sm:grid-cols-2 xl:grid-cols-5">
            <Metric label="Leads loaded" value={contacts.length} detail="eligible records" icon={Database} />
            <Metric label="Attempts" value={attempts.length} detail="calls created" icon={PhoneCall} />
            <Metric label="Reached" value={contacted} detail="resolved outcomes" icon={Users} />
            <Metric label="Interested now" value={interested.length} detail="needs follow-up" icon={CircleAlert} accent />
            <Metric label="Booked value" value={`$${pipeline.toLocaleString()}`} detail={`${booked.length} booked`} icon={CalendarCheck} />
          </section>

          <section className="mt-8 grid gap-6 xl:grid-cols-[1fr_380px]">
            <div className="border-2 border-black bg-white p-6 sm:p-8"><div className="flex flex-wrap items-start justify-between gap-5"><div><p className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-black/40">Active campaign</p><h2 className="mt-2 text-3xl font-black tracking-[-0.05em]">{campaign.name}</h2><p className="mt-2 text-sm font-semibold text-black/45">{campaign.service_type} · {campaign.calling_window_start.slice(0,5)}–{campaign.calling_window_end.slice(0,5)} · {campaign.max_attempts} attempts max</p></div><Status value={campaign.status} /></div>
              <div className="mt-7 flex flex-wrap gap-3">
                {campaign.status === "ready" || campaign.status === "draft" ? <form action={launchReactivationCampaignAction.bind(null, campaign.id)}><button className="inline-flex h-12 items-center gap-2 bg-black px-5 text-sm font-black text-white disabled:opacity-35" disabled={!telephonyReady || !campaign.eligibility_attested_at}><Play className="h-4 w-4" /> Launch campaign</button></form> : null}
                {campaign.status === "running" ? <form action={pauseReactivationCampaignAction.bind(null, campaign.id)}><button className="inline-flex h-12 items-center gap-2 border-2 border-black px-5 text-sm font-black"><Pause className="h-4 w-4" /> Pause</button></form> : null}
                {campaign.status === "paused" ? <form action={resumeReactivationCampaignAction.bind(null, campaign.id)}><button className="inline-flex h-12 items-center gap-2 bg-black px-5 text-sm font-black text-white"><Play className="h-4 w-4" /> Resume</button></form> : null}
              </div>
              {!telephonyReady ? <p className="mt-5 border-l-4 border-black bg-[#f4f1e8] p-4 text-sm font-semibold leading-6">Campaign launch stays locked until the paid Twilio number is imported into Vapi and added to production.</p> : null}
            </div>
            <ImportPanel campaign={campaign} />
          </section>

          <section className="mt-12"><div className="flex items-end justify-between gap-5"><div><p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-black/45">Priority handoff</p><h2 className="mt-2 text-4xl font-black tracking-[-0.055em]">Interested people first.</h2></div><span className="bg-[#d8ff57] px-3 py-2 font-mono text-[10px] font-bold uppercase">{interested.length} awaiting owner</span></div>
            <div className="mt-6 grid gap-4">{interested.length ? interested.map((contact) => <LeadCard contact={contact} attempts={attempts.filter((attempt) => attempt.contact_id === contact.id)} priority key={contact.id} />) : <div className="border-2 border-dashed border-black/25 p-10 text-center"><Check className="mx-auto h-8 w-8" /><p className="mt-4 font-black">No interested leads are waiting on your team.</p><p className="mt-2 text-sm font-semibold text-black/45">When Mabel finds one, it appears here and the owner gets an immediate text.</p></div>}</div>
          </section>

          <section className="mt-14"><p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-black/45">Complete lead history</p><h2 className="mt-2 text-4xl font-black tracking-[-0.055em]">Every outcome, logged.</h2><div className="mt-6 grid gap-3">{contacts.map((contact) => <LeadCard contact={contact} attempts={attempts.filter((attempt) => attempt.contact_id === contact.id)} key={contact.id} />)}{!contacts.length ? <p className="border-2 border-dashed border-black/25 p-8 text-center font-semibold text-black/45">Upload the first eligible CSV to populate this campaign.</p> : null}</div></section>
        </>}
      </div>
    </main>
  );
}

function CreateCampaign() { return <section className="mt-10 grid border-2 border-black bg-white lg:grid-cols-[0.75fr_1.25fr]"><div className="bg-black p-8 text-white sm:p-12"><Database className="h-8 w-8 text-[#d8ff57]" /><h2 className="mt-16 text-4xl font-black tracking-[-0.055em]">Start with one clean segment.</h2><p className="mt-5 text-sm font-semibold leading-6 text-white/55">A campaign keeps the list, calling rules, attempts, outcomes, and recovered pipeline together.</p></div><form action={createReactivationCampaignAction} className="grid gap-5 p-7 sm:grid-cols-2 sm:p-12"><Field label="Campaign name" name="name" placeholder="Spring database recovery" required /><Field label="Service type" name="service_type" placeholder="HVAC replacement" required /><Field label="Calling starts" name="calling_window_start" type="time" defaultValue="09:00" /><Field label="Calling ends" name="calling_window_end" type="time" defaultValue="18:00" /><Field label="Maximum attempts" name="max_attempts" type="number" defaultValue="2" /><Field label="Daily call limit" name="daily_limit" type="number" defaultValue="25" /><input type="hidden" name="calling_timezone" value="America/New_York" /><button className="mt-2 inline-flex h-13 items-center justify-center gap-2 bg-black px-5 text-sm font-black text-white sm:col-span-2" type="submit">Create campaign <Play className="h-4 w-4" /></button></form></section>; }

function ImportPanel({ campaign }: { campaign: ReactivationCampaign }) { return <form action={importReactivationLeadsAction.bind(null, campaign.id)} className="border-2 border-black bg-[#d8ff57] p-6"><Upload className="h-6 w-6" /><h2 className="mt-5 text-2xl font-black">Import eligible leads</h2><p className="mt-2 text-xs font-semibold leading-5 text-black/55">CSV columns: name, phone, and optional email, source, age_days, notes. Maximum 5,000 rows.</p><input className="mt-5 block w-full border-2 border-black bg-white p-3 text-xs font-bold file:mr-3 file:border-0 file:bg-black file:px-3 file:py-2 file:text-white" name="lead_file" type="file" accept=".csv,text/csv" required /><label className="mt-5 flex items-start gap-3 text-xs font-bold leading-5"><input className="mt-1 h-4 w-4 flex-none accent-black" name="eligibility_attestation" type="checkbox" required />I confirm these people previously inquired or otherwise provided permission to be contacted, and this list has been checked against applicable suppression and opt-out requirements.</label><button className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 bg-black px-4 text-sm font-black text-white" type="submit"><Upload className="h-4 w-4" /> Validate and import</button></form>; }

function LeadCard({ contact, attempts, priority = false }: { contact: ReactivationContact; attempts: ReactivationAttempt[]; priority?: boolean }) { const latest = attempts[0]; return <article className={`border-2 border-black bg-white ${priority ? "shadow-[8px_8px_0_#d8ff57]" : ""}`}><div className="grid gap-5 p-5 sm:grid-cols-[1fr_auto] sm:items-center"><div><div className="flex flex-wrap items-center gap-2"><Status value={contact.status} /><span className="font-mono text-[9px] font-bold uppercase text-black/35">{contact.attempt_count} attempt{contact.attempt_count === 1 ? "" : "s"}{contact.lead_age_days ? ` · ${contact.lead_age_days} days old` : ""}</span></div><h3 className="mt-3 text-xl font-black">{contact.name}</h3><p className="mt-1 text-sm font-semibold text-black/45">{contact.source || "Imported lead"} · {formatPhone(contact.phone_e164)}</p>{contact.qualification_notes || latest?.summary ? <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-black/60">{contact.qualification_notes || latest?.summary}</p> : null}{contact.requested_timing ? <p className="mt-2 text-sm font-black">Best timing: {contact.requested_timing}</p> : null}</div><div className="flex flex-wrap gap-2 sm:justify-end"><a className="inline-flex h-11 items-center gap-2 bg-black px-4 text-sm font-black text-white" href={`tel:${contact.phone_e164}`}><Phone className="h-4 w-4" /> Call now</a><form action={updateReactivationLeadAction.bind(null, contact.id, "contacted")}><button className="h-11 border-2 border-black px-4 text-sm font-black" type="submit">Mark contacted</button></form><details className="relative"><summary className="inline-flex h-11 cursor-pointer list-none items-center border-2 border-black bg-[#d8ff57] px-4 text-sm font-black">Book</summary><form action={updateReactivationLeadAction.bind(null, contact.id, "booked")} className="absolute right-0 top-13 z-20 grid w-72 gap-2 border-2 border-black bg-white p-3 shadow-[6px_6px_0_#000]"><input className="h-10 border border-black px-3 text-sm font-semibold" name="estimated_value" type="number" min="0" placeholder="Estimated value" /><input className="h-10 border border-black px-3 text-sm font-semibold" name="appointment_notes" placeholder="Appointment time / notes" /><button className="h-10 bg-black text-sm font-black text-white" type="submit">Confirm booking</button></form></details></div></div>{latest?.recording_url || latest?.transcript ? <details className="border-t-2 border-black p-5"><summary className="flex cursor-pointer list-none items-center gap-2 text-xs font-black"><Headphones className="h-4 w-4" /> Recording and transcript</summary><div className="mt-4 grid gap-4">{latest.recording_url && latest.vapi_call_id ? <audio className="w-full" controls preload="none" src={recordingPlaybackPath("reactivation-attempts", latest.id)} /> : null}{latest.transcript ? <pre className="max-h-56 overflow-auto whitespace-pre-wrap bg-black/5 p-4 text-xs leading-5">{latest.transcript}</pre> : null}</div></details> : null}</article>; }

function Metric({ label, value, detail, icon: Icon, accent = false }: { label: string; value: string | number; detail: string; icon: typeof Database; accent?: boolean }) { return <div className={`border-b-2 border-r-2 border-black p-5 ${accent ? "bg-[#d8ff57]" : "bg-white"}`}><div className="flex items-center justify-between"><p className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-black/45">{label}</p><Icon className="h-4 w-4" /></div><p className="mt-4 text-3xl font-black tracking-[-0.055em]">{value}</p><p className="mt-2 text-xs font-semibold text-black/40">{detail}</p></div>; }
function Status({ value }: { value: string }) { const accent = value === "interested" || value === "running" || value === "booked"; return <span className={`inline-flex border border-black px-2 py-1 font-mono text-[9px] font-bold uppercase ${accent ? "bg-[#d8ff57]" : "bg-white"}`}>{value.replaceAll("_", " ")}</span>; }
function Field({ label, name, type = "text", placeholder, defaultValue, required = false }: { label: string; name: string; type?: string; placeholder?: string; defaultValue?: string; required?: boolean }) { return <label className="text-sm font-black">{label}<input className="mt-2 h-13 w-full border-2 border-black bg-white px-4 font-semibold outline-none focus:shadow-[4px_4px_0_#000]" name={name} type={type} placeholder={placeholder} defaultValue={defaultValue} required={required} /></label>; }
function formatPhone(value: string): string { const digits = value.replace(/\D/g, "").slice(-10); return digits.length === 10 ? `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}` : value; }
function dashboardMessage(search: Record<string, string | string[] | undefined>): { text: string; error: boolean } | null { const error = typeof search.error === "string" ? search.error : null; const errors: Record<string,string> = { campaign_name: "Add a campaign name.", campaign_save: "The campaign could not be created.", attestation: "Confirm list eligibility before importing or launching.", file: "Choose a CSV smaller than 2 MB.", csv_columns: "The CSV needs name and phone columns.", no_valid_leads: "No valid, callable leads were found.", import: "The lead list could not be imported.", telephony: "Campaign launch is locked until the production caller number is connected." }; if (error) return { text: errors[error] || "Something needs attention. Please try again.", error: true }; if (search.created === "1") return { text: "Campaign created. Import the first eligible lead segment.", error: false }; if (search.launched === "1") return { text: "Campaign launched. Mabel is beginning with a controlled batch.", error: false }; if (typeof search.imported === "string") return { text: `${search.imported} leads imported${typeof search.skipped === "string" ? ` · ${search.skipped} invalid, duplicate, or suppressed rows skipped` : ""}.`, error: false }; return null; }
