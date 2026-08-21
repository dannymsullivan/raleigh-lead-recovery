import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CalendarCheck, CircleAlert, Database, Headphones, Pause, Phone, PhoneCall, Play, Users } from "lucide-react";
import { BrandMark } from "@/app/components/brand-mark";
import { getSupabaseAuth, isSupabaseAuthConfigured } from "@/lib/supabase-auth";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { customerAgentReady } from "@/lib/customer-agent-config";
import { bucketLabel } from "@/lib/lead-import";
import { assessOpportunityDate, isDateSensitiveService } from "@/lib/lead-eligibility";
import type { Client, CustomerAgent, ReactivationAttempt, ReactivationCampaign, ReactivationContact } from "@/lib/types";
import { recordingPlaybackPath } from "@/lib/vapi-recording";
import { createReactivationCampaignAction, launchReactivationCampaignAction, pauseReactivationCampaignAction, resumeReactivationCampaignAction, updateReactivationLeadAction } from "./actions";
import { LeadImporter } from "./lead-importer";
import { ImportReceipt, LeadContext, LeadFilters, LeadPagination, firstParam, leadBuckets, leadPageSize, leadStatuses, pageNumber } from "./lead-workspace-ui";

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
  const { data: agentData } = campaign?.agent_id ? await admin.from("customer_agents").select("*").eq("id", campaign.agent_id).eq("client_id", client.id).maybeSingle() : { data: null };
  const campaignAgent = agentData as CustomerAgent | null;
  const search = (await searchParams) ?? {};
  const message = dashboardMessage(search);
  const telephonyReady = customerAgentReady(campaignAgent);
  const leadSearch = firstParam(search.lead_search).slice(0, 100);
  const requestedBucket = firstParam(search.lead_bucket);
  const leadBucket = requestedBucket === "all" || leadBuckets.includes(requestedBucket as (typeof leadBuckets)[number]) ? requestedBucket : "eligible";
  const leadStatus = leadStatuses.includes(firstParam(search.lead_status) as (typeof leadStatuses)[number]) ? firstParam(search.lead_status) : "";
  const leadPage = pageNumber(search.lead_page);

  let contacts: ReactivationContact[] = [];
  let attempts: ReactivationAttempt[] = [];
  let contactTotal = 0;
  let filteredContactTotal = 0;
  let attemptTotal = 0;
  let contacted = 0;
  let interestedTotal = 0;
  let bookedTotal = 0;
  let eligibleTotal = 0;
  let pipeline = 0;
  if (campaign) {
    let contactQuery = admin.from("reactivation_contacts").select("*", { count: "exact" }).eq("campaign_id", campaign.id).order("updated_at", { ascending: false });
    if (leadBucket === "eligible") contactQuery = contactQuery.or("import_bucket.is.null,import_bucket.neq.exclude");
    else if (leadBucket !== "all") contactQuery = contactQuery.eq("import_bucket", leadBucket);
    if (leadStatus) contactQuery = contactQuery.eq("status", leadStatus);
    const safeSearch = leadSearch.replace(/[%_,()]/g, "").trim();
    if (safeSearch) contactQuery = /\d/.test(safeSearch) ? contactQuery.ilike("phone_e164", `%${safeSearch.replace(/\D/g, "")}%`) : contactQuery.ilike("name", `%${safeSearch}%`);
    const start = (leadPage - 1) * leadPageSize;
    const [pageResult, totalResult, attemptResult, contactedResult, interestedResult, bookedResult, eligibleResult] = await Promise.all([
      contactQuery.range(start, start + leadPageSize - 1),
      admin.from("reactivation_contacts").select("id", { count: "exact", head: true }).eq("campaign_id", campaign.id),
      admin.from("reactivation_attempts").select("id", { count: "exact", head: true }).eq("campaign_id", campaign.id),
      admin.from("reactivation_contacts").select("id", { count: "exact", head: true }).eq("campaign_id", campaign.id).in("status", ["interested", "follow_up", "booked", "contacted", "not_interested", "completed_project", "wrong_number", "do_not_call"]),
      admin.from("reactivation_contacts").select("id", { count: "exact", head: true }).eq("campaign_id", campaign.id).in("status", ["interested", "follow_up", "booked"]),
      admin.from("reactivation_contacts").select("estimated_value").eq("campaign_id", campaign.id).eq("status", "booked"),
      admin.from("reactivation_contacts").select("id", { count: "exact", head: true }).eq("campaign_id", campaign.id).or("import_bucket.is.null,import_bucket.neq.exclude")
    ]);
    contacts = (pageResult.data ?? []) as ReactivationContact[];
    filteredContactTotal = pageResult.count ?? 0;
    contactTotal = totalResult.count ?? 0;
    attemptTotal = attemptResult.count ?? 0;
    contacted = contactedResult.count ?? 0;
    interestedTotal = interestedResult.count ?? 0;
    const bookedRows = (bookedResult.data ?? []) as Array<{ estimated_value: number | null }>;
    bookedTotal = bookedRows.length;
    eligibleTotal = eligibleResult.count ?? 0;
    pipeline = bookedRows.reduce((sum, contact) => sum + Number(contact.estimated_value ?? 0), 0);
    const ids = contacts.map((contact) => contact.id);
    if (ids.length) {
      const { data: attemptData } = await admin.from("reactivation_attempts").select("*").in("contact_id", ids).order("created_at", { ascending: false });
      attempts = (attemptData ?? []) as ReactivationAttempt[];
    }
  }

  return (
    <main className="product-ui min-h-screen bg-[#f4f1e8] text-black">
      <header className="border-b-2 border-black"><div className="mx-auto flex max-w-[1500px] items-center justify-between px-5 py-5 sm:px-8"><BrandMark /><div className="flex items-center gap-4"><Link className="hidden text-sm font-black sm:inline" href="/dashboard">Call inbox</Link><Link className="text-sm font-black" href="/dashboard/agents">Agents</Link><Link className="inline-flex items-center gap-2 border-2 border-black px-3 py-2 text-sm font-black" href="/dashboard/settings">Business</Link></div></div></header>
      <div className="mx-auto max-w-[1500px] px-5 py-8 sm:px-8 sm:py-11">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div><p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-black/45">Lead recovery command center</p><h1 className="mt-2 text-3xl font-black tracking-[-0.045em] sm:text-4xl">Turn the old list back on.</h1><p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-black/55">Import eligible prior inquiries, let Mabel reopen the conversation, and move interested people to your team immediately.</p></div><Link className={`inline-flex items-center self-start border border-black px-3 py-2 text-xs font-black lg:self-auto ${telephonyReady ? "bg-[#d8ff57]" : "bg-white"}`} href="/dashboard/agents"><span className={`mr-2 inline-block h-2 w-2 rounded-full ${telephonyReady ? "bg-black" : "border border-black"}`} />{telephonyReady ? `${campaignAgent?.name} ready` : "Set up Lead Recovery agent"}</Link></div>
        {message ? <div className={`mt-8 border-2 border-black p-4 text-sm font-black ${message.error ? "bg-black text-white" : "bg-[#d8ff57]"}`}>{message.text}</div> : null}
        {typeof search.imported === "string" ? <ImportReceipt imported={search.imported} skipped={firstParam(search.skipped) || "0"} suppressed={firstParam(search.suppressed) || "0"} buckets={firstParam(search.buckets)} replaced={search.replaced === "1"} /> : null}

        {!campaign ? <CreateCampaign /> : <>
          <section className="mt-6 grid grid-cols-2 border-l border-t border-black xl:grid-cols-5">
            <Metric label="Leads loaded" value={contactTotal} detail="eligible records" icon={Database} />
            <Metric label="Attempts" value={attemptTotal} detail="calls created" icon={PhoneCall} />
            <Metric label="Reached" value={contacted} detail="resolved outcomes" icon={Users} />
            <Metric label="Interested now" value={interestedTotal} detail="needs follow-up" icon={CircleAlert} accent />
            <Metric label="Booked value" value={`$${pipeline.toLocaleString()}`} detail={`${bookedTotal} booked`} icon={CalendarCheck} mobileWide />
          </section>

          <section className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(480px,1.1fr)]">
            <div className="border-2 border-black bg-white p-6 sm:p-8"><div className="flex flex-wrap items-start justify-between gap-5"><div><p className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-black/40">Active campaign</p><h2 className="mt-2 text-3xl font-black tracking-[-0.05em]">{campaign.name}</h2><p className="mt-2 text-sm font-semibold text-black/45">{campaign.service_type} · {campaign.calling_window_start.slice(0,5)}–{campaign.calling_window_end.slice(0,5)} · {campaign.max_attempts} attempts max</p></div><Status value={campaign.status} /></div>
              <div className="mt-7 flex flex-wrap gap-3">
                {campaign.status === "ready" || campaign.status === "draft" ? <details className="w-full border-2 border-black bg-[#f4f1e8]"><summary className="cursor-pointer list-none p-4 text-sm font-black">Review before launch</summary><div className="border-t-2 border-black p-4"><div className="grid grid-cols-2 gap-3 text-xs"><p><span className="block text-black/40">Audience</span><strong>{eligibleTotal.toLocaleString()} eligible leads</strong></p><p><span className="block text-black/40">Pace</span><strong>{campaign.daily_limit}/day</strong></p><p><span className="block text-black/40">Calling window</span><strong>{campaign.calling_window_start.slice(0,5)}–{campaign.calling_window_end.slice(0,5)}</strong></p><p><span className="block text-black/40">Attempts</span><strong>{campaign.max_attempts} max</strong></p></div>{isDateSensitiveService(campaign.service_type) ? <p className="mt-4 border-2 border-black bg-[#ffd7cc] p-3 text-xs font-black">Only leads with an event date after today can be contacted. The date is rechecked immediately before every call.</p> : null}<form className="mt-4" action={launchReactivationCampaignAction.bind(null, campaign.id)}><label className="flex items-start gap-2 text-xs font-bold"><input className="mt-0.5 accent-black" required type="checkbox" />I reviewed the audience and calling limits.</label><button className="mt-3 inline-flex h-12 w-full items-center justify-center gap-2 bg-black px-5 text-sm font-black text-white disabled:opacity-35" disabled={!telephonyReady || !campaign.eligibility_attested_at || !eligibleTotal}><Play className="h-4 w-4" /> Confirm and launch</button></form></div></details> : null}
                {campaign.status === "running" ? <form action={pauseReactivationCampaignAction.bind(null, campaign.id)}><button className="inline-flex h-12 items-center gap-2 border-2 border-black px-5 text-sm font-black"><Pause className="h-4 w-4" /> Pause</button></form> : null}
                {campaign.status === "paused" ? <form action={resumeReactivationCampaignAction.bind(null, campaign.id)}><button className="inline-flex h-12 items-center gap-2 bg-black px-5 text-sm font-black text-white"><Play className="h-4 w-4" /> Resume</button></form> : null}
              </div>
              {!telephonyReady ? <p className="mt-5 border-l-4 border-black bg-[#f4f1e8] p-4 text-sm font-semibold leading-6">Campaign launch stays locked until this customer&apos;s Lead Recovery agent is configured. <Link className="underline" href="/dashboard/agents">Set up the agent</Link>.</p> : null}
            </div>
            {contactTotal ? <details className="border-2 border-black bg-white"><summary className="cursor-pointer list-none p-5 text-sm font-black">Add more leads <span className="ml-2 font-mono text-[9px] uppercase text-black/40">{contactTotal.toLocaleString()} currently loaded</span></summary><div className="border-t-2 border-black"><LeadImporter compact dateSensitive={isDateSensitiveService(campaign.service_type)} campaignId={campaign.id} /></div></details> : <LeadImporter dateSensitive={isDateSensitiveService(campaign.service_type)} campaignId={campaign.id} />}
          </section>

          <section className="scroll-mt-6 mt-8 border border-black bg-white" id="leads"><div className="border-b border-black p-4 sm:p-5"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-black/45">Lead workspace</p><h2 className="mt-1 text-xl font-black tracking-[-0.035em] sm:text-2xl">Every lead, easy to find.</h2><p className="mt-1.5 text-xs font-semibold text-black/45">Interested leads stay highlighted, and the full audience remains searchable without loading thousands of cards.</p></div><span className="bg-[#d8ff57] px-2.5 py-1.5 font-mono text-[9px] font-bold uppercase">{interestedTotal.toLocaleString()} interested</span></div></div><LeadFilters basePath="/dashboard/reactivation" search={leadSearch} bucket={leadBucket} status={leadStatus} total={filteredContactTotal} page={leadPage} shown={contacts.length} /><div className="divide-y divide-black/15">{contacts.map((contact) => <LeadCard contact={contact} attempts={attempts.filter((attempt) => attempt.contact_id === contact.id)} serviceType={campaign.service_type} priority={contact.status === "interested"} key={contact.id} />)}{!contacts.length ? <p className="p-8 text-center text-sm font-semibold text-black/45">{contactTotal ? "No leads match these filters." : "Upload the first eligible spreadsheet to populate this campaign."}</p> : null}</div><LeadPagination basePath="/dashboard/reactivation" search={leadSearch} bucket={leadBucket} status={leadStatus} page={leadPage} total={filteredContactTotal} /></section>
        </>}
      </div>
    </main>
  );
}

function CreateCampaign() { return <section className="mt-8 border border-l-4 border-black border-l-[#d8ff57] bg-white"><div className="flex items-start gap-3 border-b border-black p-5"><span className="grid h-9 w-9 flex-none place-items-center bg-[#d8ff57]"><Database className="h-4 w-4" /></span><div><h2 className="text-xl font-black tracking-[-0.03em]">Start with one clean segment.</h2><p className="mt-1 text-xs font-semibold leading-5 text-black/50">Keep the list, calling rules, outcomes, and recovered pipeline together.</p></div></div><form action={createReactivationCampaignAction} className="grid gap-4 p-5 sm:grid-cols-2"><Field label="Campaign name" name="name" placeholder="Spring database recovery" required /><Field label="Service type" name="service_type" placeholder="HVAC replacement" required /><Field label="Calling starts" name="calling_window_start" type="time" defaultValue="09:00" /><Field label="Calling ends" name="calling_window_end" type="time" defaultValue="18:00" /><Field label="Maximum attempts" name="max_attempts" type="number" defaultValue="2" /><Field label="Daily call limit" name="daily_limit" type="number" defaultValue="25" /><input type="hidden" name="calling_timezone" value="America/New_York" /><button className="mt-1 inline-flex h-11 items-center justify-center gap-2 bg-black px-5 text-sm font-black text-white sm:col-span-2" type="submit">Create campaign <Play className="h-4 w-4" /></button></form></section>; }

function LeadCard({ contact, attempts, serviceType, priority = false }: { contact: ReactivationContact; attempts: ReactivationAttempt[]; serviceType: string; priority?: boolean }) { const latest = attempts[0]; const callable = contact.import_bucket !== "exclude" && assessOpportunityDate({ serviceType, metadata: contact.import_metadata, notes: contact.notes }).eligible; return <article className={`bg-white ${priority ? "border-l-8 border-[#d8ff57]" : ""}`}><div className="grid gap-5 p-5 sm:grid-cols-[1fr_auto] sm:items-center"><div><div className="flex flex-wrap items-center gap-2"><Status value={contact.status} />{contact.import_bucket ? <span className="border border-black/25 px-2 py-1 font-mono text-[8px] font-bold uppercase text-black/55">{bucketLabel(contact.import_bucket)}</span> : null}<span className="font-mono text-[9px] font-bold uppercase text-black/35">{contact.attempt_count} attempt{contact.attempt_count === 1 ? "" : "s"}{contact.lead_age_days ? ` · ${contact.lead_age_days} days old` : ""}</span></div><h3 className="mt-3 text-xl font-black">{contact.name}</h3><p className="mt-1 text-sm font-semibold text-black/45">{contact.source || "Imported lead"} · {formatPhone(contact.phone_e164)}</p>{contact.qualification_notes || latest?.summary ? <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-black/60">{contact.qualification_notes || latest?.summary}</p> : null}<LeadContext contact={contact} serviceType={serviceType} />{contact.requested_timing ? <p className="mt-2 text-sm font-black">Best timing: {contact.requested_timing}</p> : null}</div>{callable ? <div className="flex flex-wrap gap-2 sm:justify-end"><a className="inline-flex h-11 items-center gap-2 bg-black px-4 text-sm font-black text-white" href={`tel:${contact.phone_e164}`}><Phone className="h-4 w-4" /> Call now</a><form action={updateReactivationLeadAction.bind(null, contact.id, "contacted")}><button className="h-11 border-2 border-black px-4 text-sm font-black" type="submit">Mark contacted</button></form><details className="relative"><summary className="inline-flex h-11 cursor-pointer list-none items-center border-2 border-black bg-[#d8ff57] px-4 text-sm font-black">Book</summary><form action={updateReactivationLeadAction.bind(null, contact.id, "booked")} className="absolute right-0 top-13 z-20 grid w-72 gap-2 border-2 border-black bg-white p-3 shadow-[6px_6px_0_#000]"><input className="h-10 border border-black px-3 text-sm font-semibold" name="estimated_value" type="number" min="0" placeholder="Estimated value" /><input className="h-10 border border-black px-3 text-sm font-semibold" name="appointment_notes" placeholder="Appointment time / notes" /><button className="h-10 bg-black text-sm font-black text-white" type="submit">Confirm booking</button></form></details></div> : <p className="border-2 border-black bg-[#ffd7cc] px-3 py-2 text-xs font-black">Not callable · excluded by eligibility rules</p>}</div>{latest?.recording_url || latest?.transcript ? <details className="border-t-2 border-black p-5"><summary className="flex cursor-pointer list-none items-center gap-2 text-xs font-black"><Headphones className="h-4 w-4" /> Recording and transcript</summary><div className="mt-4 grid gap-4">{latest.recording_url && latest.vapi_call_id ? <audio className="w-full" controls preload="none" src={recordingPlaybackPath("reactivation-attempts", latest.id)} /> : null}{latest.transcript ? <pre className="max-h-56 overflow-auto whitespace-pre-wrap bg-black/5 p-4 text-xs leading-5">{latest.transcript}</pre> : null}</div></details> : null}</article>; }

function Metric({ label, value, detail, icon: Icon, accent = false, mobileWide = false }: { label: string; value: string | number; detail: string; icon: typeof Database; accent?: boolean; mobileWide?: boolean }) { return <div className={`border-b border-r border-black p-3.5 sm:p-4 ${mobileWide ? "col-span-2 xl:col-span-1" : ""} ${accent ? "bg-[#d8ff57]" : "bg-white"}`}><div className="flex items-center justify-between"><p className="font-mono text-[8px] font-bold uppercase tracking-[0.12em] text-black/45 sm:text-[9px] sm:tracking-[0.14em]">{label}</p><Icon className="h-3.5 w-3.5" /></div><p className="mt-2 text-xl font-black tracking-[-0.045em] sm:text-2xl">{value}</p><p className="mt-1 text-[11px] font-semibold text-black/40">{detail}</p></div>; }
function Status({ value }: { value: string }) { const accent = value === "interested" || value === "running" || value === "booked"; return <span className={`inline-flex border border-black px-2 py-1 font-mono text-[9px] font-bold uppercase ${accent ? "bg-[#d8ff57]" : "bg-white"}`}>{value.replaceAll("_", " ")}</span>; }
function Field({ label, name, type = "text", placeholder, defaultValue, required = false }: { label: string; name: string; type?: string; placeholder?: string; defaultValue?: string; required?: boolean }) { return <label className="text-sm font-black">{label}<input className="mt-2 h-13 w-full border-2 border-black bg-white px-4 font-semibold outline-none focus:shadow-[4px_4px_0_#000]" name={name} type={type} placeholder={placeholder} defaultValue={defaultValue} required={required} /></label>; }
function formatPhone(value: string): string { const digits = value.replace(/\D/g, "").slice(-10); return digits.length === 10 ? `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}` : value; }
function dashboardMessage(search: Record<string, string | string[] | undefined>): { text: string; error: boolean } | null { const error = typeof search.error === "string" ? search.error : null; const errors: Record<string,string> = { campaign_name: "Add a campaign name.", campaign_save: "The campaign could not be created.", attestation: "Confirm list eligibility before importing or launching.", file: "Choose a CSV or XLSX file smaller than 10 MB.", spreadsheet: "That spreadsheet could not be read. Try exporting it as CSV or XLSX.", csv_columns: "The CSV needs name and phone columns.", no_valid_leads: "No valid, callable leads were found.", no_callable_leads: "This file can be analyzed, but Mabel needs a contact name and phone number before importing it for calls.", bucket_selection: "Choose at least one opportunity bucket to import.", import: "The lead list could not be imported.", telephony: "Campaign launch is locked until the production caller number is connected.", agent_not_ready: "Set up this customer’s Lead Recovery agent before launching the campaign." }; if (error) return { text: errors[error] || "Something needs attention. Please try again.", error: true }; if (search.invited === "1") return { text: "Access confirmed. This is the customer dashboard your administrator prepared for you—campaigns, leads, and results are already connected.", error: false }; if (search.welcome === "1") return { text: "Your workspace is ready. Load the lead spreadsheet you already have—Mabel will organize it before anything is contacted.", error: false }; if (search.created === "1") return { text: "Campaign created. Load the first eligible lead segment.", error: false }; if (search.launched === "1") return { text: "Campaign launched. Mabel is beginning with a controlled batch.", error: false }; return null; }
