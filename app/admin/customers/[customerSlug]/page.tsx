import { cookies } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Building2, CalendarDays, ChevronDown, Headphones, Pause, Phone, PhoneCall, Play, TestTube2, Upload, Users } from "lucide-react";
import { adminCookie, verifyAdminSessionToken } from "@/lib/admin";
import { getAppOrigin } from "@/lib/app-url";
import { adminInvitationCookie, customerInvitationPath, isCustomerInvitationToken } from "@/lib/customer-invitations";
import { customerCrmPath } from "@/lib/customer-slug";
import { bucketLabel } from "@/lib/lead-import";
import { assessOpportunityDate, isDateSensitiveService } from "@/lib/lead-eligibility";
import { maskPhoneNumber } from "@/lib/phone";
import { customerAgentReady } from "@/lib/customer-agent-config";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import type { Call, Client, CustomerAgent, ReactivationAttempt, ReactivationCampaign, ReactivationContact } from "@/lib/types";
import { recordingPlaybackPath } from "@/lib/vapi-recording";
import { LeadImporter } from "@/app/dashboard/reactivation/lead-importer";
import { ImportReceipt, LeadContext, LeadFilters, LeadPagination, firstParam, leadBuckets, leadPageSize, leadStatuses, pageNumber } from "@/app/dashboard/reactivation/lead-workspace-ui";
import { clearAdminReactivationLeadsAction, createAdminCampaignAction, deleteAdminReactivationLeadsAction, importAdminMappedLeadsAction, launchAdminCampaignAction, pauseAdminCampaignAction, prepareAdminLeadSpreadsheetUploadAction, previewAdminLeadSpreadsheetAction, reclassifyAdminEventLeadsAction, removeAdminExcludedLeadsAction, resumeAdminCampaignAction, updateAdminReactivationLeadAction } from "@/app/dashboard/reactivation/actions";
import { createCustomerInvitationAction } from "@/app/actions";
import { placeTestBusinessCallAction } from "../../test-business/actions";
import { LeadBulkToolbar } from "./lead-bulk-toolbar";
import { ClearLeadList } from "./clear-lead-list";
import { CustomerAccessPanel } from "./customer-access-panel";
import { RemoveExcludedLeads } from "./remove-excluded-leads";
import { AgentManager } from "@/app/dashboard/agents/agent-manager";
import { saveAdminCustomerAgentAction } from "@/app/dashboard/agents/actions";

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
  const search = (await searchParams) ?? {};
  const basePath = customerCrmPath(client);
  let invitationToken = "";
  const invitationCookie = cookieStore.get(adminInvitationCookie)?.value;
  if (invitationCookie) {
    try {
      const decoded = JSON.parse(decodeURIComponent(invitationCookie)) as { clientId?: unknown; token?: unknown };
      if (decoded.clientId === client.id && typeof decoded.token === "string") invitationToken = decoded.token;
    } catch {
      // Ignore malformed or stale flash cookies.
    }
  }
  const invitationUrl = isCustomerInvitationToken(invitationToken) ? `${getAppOrigin()}${customerInvitationPath(invitationToken)}` : null;
  const leadSearch = firstParam(search.lead_search).slice(0, 100);
  const requestedBucket = firstParam(search.lead_bucket);
  const leadBucket = requestedBucket === "all" || leadBuckets.includes(requestedBucket as (typeof leadBuckets)[number]) ? requestedBucket : "eligible";
  const leadStatus = leadStatuses.includes(firstParam(search.lead_status) as (typeof leadStatuses)[number]) ? firstParam(search.lead_status) : "";
  const leadPage = pageNumber(search.lead_page);

  const [{ data: campaignData }, { data: callData }, { data: agentData }] = await Promise.all([
    admin.from("reactivation_campaigns").select("*").eq("client_id", client.id).order("created_at", { ascending: false }),
    admin.from("calls").select("*").eq("client_id", client.id).order("created_at", { ascending: false }).limit(50),
    admin.from("customer_agents").select("*").eq("client_id", client.id).order("created_at")
  ]);
  const campaigns = (campaignData ?? []) as ReactivationCampaign[];
  const agents = (agentData ?? []) as CustomerAgent[];
  const primaryCampaign = campaigns[0] ?? null;
  const primaryAgent = agents.find((agent) => agent.id === primaryCampaign?.agent_id) ?? null;
  const primaryAgentReady = customerAgentReady(primaryAgent);
  const inboundCalls = (callData ?? []) as Call[];
  const { data: pendingInvitationData } = !client.user_id ? await admin.from("customer_workspace_invitations").select("expires_at").eq("client_id", client.id).is("accepted_at", null).is("revoked_at", null).gt("expires_at", new Date().toISOString()).order("created_at", { ascending: false }).limit(1).maybeSingle() : { data: null };

  let contactQuery = admin.from("reactivation_contacts").select("*", { count: "exact" }).eq("client_id", client.id).order("updated_at", { ascending: false });
  if (leadBucket === "eligible") contactQuery = contactQuery.or("import_bucket.is.null,import_bucket.neq.exclude");
  else if (leadBucket !== "all") contactQuery = contactQuery.eq("import_bucket", leadBucket);
  if (leadStatus) contactQuery = contactQuery.eq("status", leadStatus);
  const safeSearch = leadSearch.replace(/[%_,()]/g, "").trim();
  if (safeSearch) contactQuery = /\d/.test(safeSearch) ? contactQuery.ilike("phone_e164", `%${safeSearch.replace(/\D/g, "")}%`) : contactQuery.ilike("name", `%${safeSearch}%`);
  const start = (leadPage - 1) * leadPageSize;
  const results = await Promise.all([
    contactQuery.range(start, start + leadPageSize - 1),
    admin.from("reactivation_contacts").select("id", { count: "exact", head: true }).eq("client_id", client.id),
    admin.from("reactivation_attempts").select("id", { count: "exact", head: true }).eq("client_id", client.id),
    admin.from("reactivation_contacts").select("id", { count: "exact", head: true }).eq("client_id", client.id).in("status", ["interested", "follow_up", "booked", "contacted", "not_interested", "completed_project", "wrong_number", "do_not_call"]),
    admin.from("reactivation_contacts").select("id", { count: "exact", head: true }).eq("client_id", client.id).in("status", ["interested", "follow_up", "booked"]),
    admin.from("reactivation_contacts").select("estimated_value").eq("client_id", client.id).eq("status", "booked"),
    admin.from("reactivation_contacts").select("id", { count: "exact", head: true }).eq("client_id", client.id).or("import_bucket.is.null,import_bucket.neq.exclude"),
    ...leadBuckets.map((bucket) => admin.from("reactivation_contacts").select("id", { count: "exact", head: true }).eq("client_id", client.id).eq("import_bucket", bucket))
  ]);
  const pageResult = results[0];
  const contacts = (pageResult.data ?? []) as ReactivationContact[];
  const filteredTotal = pageResult.count ?? 0;
  const contactTotal = results[1].count ?? 0;
  const attemptTotal = results[2].count ?? 0;
  const reached = results[3].count ?? 0;
  const interested = results[4].count ?? 0;
  const bookedRows = (results[5].data ?? []) as Array<{ estimated_value: number | null }>;
  const eligibleTotal = results[6].count ?? 0;
  const pipeline = bookedRows.reduce((sum, row) => sum + Number(row.estimated_value ?? client.avg_job_value ?? 0), 0);
  const bucketCounts = Object.fromEntries(leadBuckets.map((bucket, index) => [bucket, results[index + 7].count ?? 0]));
  const contactIds = contacts.map((contact) => contact.id);
  const { data: attemptData } = contactIds.length ? await admin.from("reactivation_attempts").select("*").eq("client_id", client.id).in("contact_id", contactIds).order("created_at", { ascending: false }) : { data: [] };
  const attempts = (attemptData ?? []) as ReactivationAttempt[];
  const { data: testContactData } = client.is_test_account ? await admin.from("reactivation_contacts").select("*").eq("client_id", client.id).limit(1).maybeSingle() : { data: null };
  const testContact = testContactData as ReactivationContact | null;
  const notice = crmNotice(search);

  return <main className="product-ui min-h-screen bg-[#f4f1e8] text-black">
    <header className="border-b-2 border-black"><div className="mx-auto flex max-w-[1500px] items-center justify-between px-5 py-5 sm:px-8"><Link className="inline-flex items-center gap-2 text-sm font-black" href="/admin"><ArrowLeft className="h-4 w-4" /> Control room</Link><span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em]">Customer CRM</span></div></header>
    <div className="mx-auto max-w-[1500px] px-5 py-8 sm:px-8 sm:py-11">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div><div className="flex flex-wrap items-center gap-3"><p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-black/45">Customer workspace</p>{client.is_test_account ? <span className="border border-black bg-[#d8ff57] px-2 py-1 font-mono text-[9px] font-bold uppercase">Test account</span> : null}</div><h1 className="mt-2 text-3xl font-black tracking-[-0.045em] sm:text-4xl">{client.business_name}</h1><p className="mt-2 text-sm font-semibold text-black/55">{client.trade} · {client.service_area || "Service area not set"} · {client.owner_name} · {maskPhoneNumber(client.owner_phone)}</p></div><div className="border border-black bg-white px-4 py-3"><p className="font-mono text-[8px] font-bold uppercase text-black/45">Account status</p><p className="mt-1 text-base font-black">{client.account_status || "onboarding"}</p></div></div>
      {notice ? <div className={`mt-7 border-2 border-black p-4 text-sm font-black ${notice.error ? "bg-black text-white" : "bg-[#d8ff57]"}`}>{notice.text}</div> : null}
      {typeof search.imported === "string" ? <ImportReceipt imported={search.imported} skipped={firstParam(search.skipped) || "0"} suppressed={firstParam(search.suppressed) || "0"} buckets={firstParam(search.buckets)} replaced={search.replaced === "1"} /> : null}

      <CustomerAccessPanel active={Boolean(client.user_id)} ownerName={client.owner_name} ownerEmail={client.owner_email} pendingUntil={pendingInvitationData?.expires_at ?? null} invitationUrl={invitationUrl} action={createCustomerInvitationAction.bind(null, client.id, basePath)} />

      <AgentManager action={saveAdminCustomerAgentAction.bind(null, client.id, basePath)} agents={agents} client={client} compact />

      <section className="mt-6 grid border-l border-t border-black sm:grid-cols-2 xl:grid-cols-6"><Metric icon={CalendarDays} label="Campaigns" value={campaigns.length} detail="all segments" /><Metric icon={Users} label="Leads" value={contactTotal} detail="loaded contacts" /><Metric icon={PhoneCall} label="Attempts" value={attemptTotal + inboundCalls.length} detail="all calls" /><Metric icon={Users} label="Reached" value={reached} detail="resolved outcomes" /><Metric icon={Building2} label="Interested" value={interested} detail="active opportunity" accent /><Metric icon={CalendarDays} label="Pipeline" value={`$${pipeline.toLocaleString()}`} detail={`${bookedRows.length.toLocaleString()} booked`} /></section>

      <section className="scroll-mt-6 mt-8" id="lead-import">{primaryCampaign ? contactTotal ? <details className="group border-2 border-black bg-white"><summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 bg-[#d8ff57] px-5 marker:content-none"><span className="inline-flex items-center gap-3"><span className="grid h-10 w-10 place-items-center bg-black text-white"><Upload className="h-4 w-4" /></span><span><span className="block text-base font-black">Upload or replace leads</span><span className="mt-0.5 block font-mono text-[9px] font-bold uppercase text-black/45">{contactTotal.toLocaleString()} currently loaded</span></span></span><ChevronDown className="h-5 w-5 transition-transform duration-150 group-open:rotate-180" /></summary><div className="border-t-2 border-black"><LeadImporter allowReplace compact dateSensitive={isDateSensitiveService(primaryCampaign.service_type)} campaignId={primaryCampaign.id} uploadAction={prepareAdminLeadSpreadsheetUploadAction.bind(null, client.id, primaryCampaign.id)} previewAction={previewAdminLeadSpreadsheetAction.bind(null, client.id, primaryCampaign.id)} importAction={importAdminMappedLeadsAction.bind(null, client.id, primaryCampaign.id, basePath)} /></div></details> : <LeadImporter allowReplace dateSensitive={isDateSensitiveService(primaryCampaign.service_type)} campaignId={primaryCampaign.id} uploadAction={prepareAdminLeadSpreadsheetUploadAction.bind(null, client.id, primaryCampaign.id)} previewAction={previewAdminLeadSpreadsheetAction.bind(null, client.id, primaryCampaign.id)} importAction={importAdminMappedLeadsAction.bind(null, client.id, primaryCampaign.id, basePath)} /> : <CreateCampaign client={client} returnPath={basePath} />}</section>

      {client.is_test_account ? <section className="mt-8 border-2 border-black bg-[#d8ff57] p-6 sm:p-8"><div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end"><div><div className="flex items-center gap-2"><TestTube2 className="h-5 w-5" /><p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em]">End-to-end test lab</p></div><h2 className="mt-3 text-3xl font-black tracking-[-0.05em]">Call through the real customer pipeline.</h2><p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-black/60">Mabel receives this account’s business name, owner, service, lead source, age, and notes. The safety guard only permits the configured owner or alert phone.</p></div>{testContact ? <form action={placeTestBusinessCallAction.bind(null, client.id, basePath, testContact.id)}><button className="h-12 bg-black px-5 text-sm font-black text-white disabled:opacity-40" disabled={!primaryAgentReady} type="submit">Call {maskPhoneNumber(testContact.phone_e164)} now</button></form> : null}</div></section> : null}

      <section className="mt-6">
        <details className="group border border-black bg-white" id="campaign-settings">
          <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 marker:content-none sm:px-5">
            <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-black/45">Campaign settings</p><span className={`h-1.5 w-1.5 rounded-full ${primaryAgentReady ? "bg-[#84a900]" : "bg-[#c33124]"}`} /><span className="font-mono text-[8px] font-bold uppercase text-black/45">{primaryAgentReady ? `${primaryAgent?.name} ready` : "Customer agent setup needed"}</span></div><p className="mt-1 truncate text-base font-black">{primaryCampaign?.name || "No campaign yet"}</p>{primaryCampaign ? <p className="mt-0.5 text-xs font-semibold text-black/45">{primaryCampaign.service_type} · {primaryCampaign.daily_limit}/day · {primaryCampaign.calling_window_start.slice(0, 5)}–{primaryCampaign.calling_window_end.slice(0, 5)} · {eligibleTotal.toLocaleString()} eligible</p> : null}</div>
            <div className="flex flex-none items-center gap-3">{primaryCampaign ? <Status value={primaryCampaign.status} /> : null}<ChevronDown className="h-4 w-4 transition-transform duration-150 group-open:rotate-180" /></div>
          </summary>
          <div className="border-t border-black bg-[#faf9f5]"><div className="border-b border-black px-4 py-3 text-xs font-semibold leading-5 text-black/55 sm:px-5"><strong className="text-black/75">How calling works:</strong> Mabel enforces schedule, pacing, eligibility, and suppression rules here. The assigned customer agent places each approved call through Vapi.</div><div className="divide-y divide-black/15">{campaigns.map((campaign) => { const agent = agents.find((candidate) => candidate.id === campaign.agent_id) ?? null; return <div className="p-4 sm:p-5" key={campaign.id}><div className="flex items-start justify-between gap-4"><div><p className="font-black">{campaign.name}</p><p className="mt-1 text-xs font-semibold text-black/45">{campaign.service_type} · {campaign.daily_limit}/day · {campaign.calling_window_start.slice(0, 5)}–{campaign.calling_window_end.slice(0, 5)} · {agent?.name || "No agent assigned"}</p></div><Status value={campaign.status} /></div><CampaignControls agentReady={customerAgentReady(agent)} campaign={campaign} clientId={client.id} returnPath={basePath} total={eligibleTotal} bucketCounts={bucketCounts} /></div>; })}{!campaigns.length ? <p className="p-5 text-sm font-semibold text-black/45">No campaign yet.</p> : null}</div></div>
        </details>
      </section>

      <section className="scroll-mt-6 mt-4 border border-black bg-white" id="leads"><div className="border-b border-black p-4 sm:p-5"><p className="font-mono text-[10px] font-bold uppercase text-black/45">Lead workspace</p><h2 className="mt-1 text-2xl font-black">Qualified audience</h2><p className="mt-1.5 text-xs font-semibold leading-5 text-black/45">Excluded history stays out of view by default. Search, review, and act on 20 leads at a time.</p>{contactTotal ? <div className="mt-4 flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">{contacts.length ? <LeadBulkToolbar action={deleteAdminReactivationLeadsAction.bind(null, client.id, basePath)} formId="admin-lead-bulk-delete" total={contacts.length} /> : <span />}<div className="flex flex-col gap-2 sm:flex-row"><RemoveExcludedLeads action={removeAdminExcludedLeadsAction.bind(null, client.id, basePath)} total={bucketCounts.exclude ?? 0} /><ClearLeadList action={clearAdminReactivationLeadsAction.bind(null, client.id, basePath)} total={contactTotal} /></div></div> : null}</div><LeadFilters basePath={basePath} search={leadSearch} bucket={leadBucket} status={leadStatus} total={filteredTotal} page={leadPage} shown={contacts.length} /><div className="divide-y divide-black/15">{contacts.map((contact) => <AdminLead contact={contact} attempts={attempts.filter((attempt) => attempt.contact_id === contact.id)} clientId={client.id} returnPath={basePath} serviceType={primaryCampaign?.service_type ?? ""} key={contact.id} />)}{!contacts.length ? <p className="p-8 text-center text-sm font-semibold text-black/45">{contactTotal ? "No leads match these filters." : "No leads loaded yet."}</p> : null}</div><LeadPagination basePath={basePath} search={leadSearch} bucket={leadBucket} status={leadStatus} page={leadPage} total={filteredTotal} /></section>

      {inboundCalls.length ? <section className="mt-10 border-2 border-black bg-white"><div className="border-b-2 border-black p-5"><p className="font-mono text-[10px] font-bold uppercase text-black/45">Missed-call recovery</p><h2 className="mt-1 text-2xl font-black">Inbound call history</h2></div><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-black/5 font-mono text-[9px] uppercase"><tr><th className="p-4">Caller</th><th className="p-4">Issue</th><th className="p-4">Urgency</th><th className="p-4">Status</th><th className="p-4">Created</th></tr></thead><tbody className="divide-y divide-black/15">{inboundCalls.map((call) => <tr key={call.id}><td className="p-4 font-black">{call.caller_name || maskPhoneNumber(call.caller_number || "Unknown")}</td><td className="p-4 font-semibold text-black/60">{call.issue_description || call.summary || "No summary"}</td><td className="p-4"><Status value={call.urgency} /></td><td className="p-4"><Status value={call.lead_status || "new"} /></td><td className="p-4 text-xs font-semibold text-black/45">{formatDate(call.created_at)}</td></tr>)}</tbody></table></div></section> : null}
    </div>
  </main>;
}

function CreateCampaign({ client, returnPath }: { client: Client; returnPath: string }) { return <div className="border border-l-4 border-black border-l-[#d8ff57] bg-white p-4 sm:p-5"><p className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-black/45">First step</p><h2 className="mt-1 text-xl font-black">Create this customer’s recovery campaign.</h2><form action={createAdminCampaignAction.bind(null, client.id, returnPath)} className="mt-4 grid gap-3 sm:grid-cols-[minmax(220px,1fr)_minmax(160px,0.6fr)_auto]"><input className="h-10 border border-black bg-white px-3 text-sm font-semibold" name="name" defaultValue={`${client.business_name} lead recovery`} aria-label="Campaign name" required /><input className="h-10 border border-black bg-white px-3 text-sm font-semibold" name="service_type" defaultValue={client.trade} aria-label="Service type" /><button className="h-10 bg-black px-5 text-xs font-black text-white" type="submit">Create campaign</button></form></div>; }

function CampaignControls({ campaign, clientId, returnPath, total, bucketCounts, agentReady }: { campaign: ReactivationCampaign; clientId: string; returnPath: string; total: number; bucketCounts: Record<string, number>; agentReady: boolean }) {
  if (campaign.status === "running") return <form className="mt-4" action={pauseAdminCampaignAction.bind(null, clientId, campaign.id, returnPath)}><button className="inline-flex h-10 items-center gap-2 border-2 border-black px-3 text-xs font-black" type="submit"><Pause className="h-3.5 w-3.5" /> Pause campaign</button></form>;
  if (campaign.status === "paused") return <form className="mt-4" action={resumeAdminCampaignAction.bind(null, clientId, campaign.id, returnPath)}><button className="inline-flex h-10 items-center gap-2 bg-black px-3 text-xs font-black text-white" type="submit"><Play className="h-3.5 w-3.5" /> Resume campaign</button></form>;
  return <details className="mt-4 border-2 border-black bg-[#f4f1e8]"><summary className="cursor-pointer list-none p-3 text-xs font-black">Review before launch</summary><div className="border-t-2 border-black p-3"><dl className="grid gap-2 text-xs"><div className="flex justify-between gap-3"><dt className="text-black/45">Audience</dt><dd className="font-black">{total.toLocaleString()} eligible leads</dd></div><div className="flex justify-between gap-3"><dt className="text-black/45">Pace</dt><dd className="font-black">{campaign.daily_limit}/day</dd></div><div className="flex justify-between gap-3"><dt className="text-black/45">Window</dt><dd className="font-black">{campaign.calling_window_start.slice(0, 5)}–{campaign.calling_window_end.slice(0, 5)}</dd></div><div className="flex justify-between gap-3"><dt className="text-black/45">Attempts</dt><dd className="font-black">{campaign.max_attempts} max</dd></div></dl><div className="mt-3 flex flex-wrap gap-1">{leadBuckets.filter((bucket) => bucketCounts[bucket]).map((bucket) => <span className="border border-black bg-white px-2 py-1 font-mono text-[8px] font-bold uppercase" key={bucket}>{bucketLabel(bucket)} · {bucketCounts[bucket].toLocaleString()}</span>)}</div>{isDateSensitiveService(campaign.service_type) ? <div className="mt-4 border-2 border-black bg-[#ffd7cc] p-3"><p className="text-xs font-black">Future-event gate is enforced before every call.</p><p className="mt-1 text-[10px] font-semibold leading-4 text-black/55">Past, same-day, missing, or invalid event dates cannot be contacted.</p><form className="mt-3" action={reclassifyAdminEventLeadsAction.bind(null, clientId, campaign.id, returnPath)}><button className="h-9 border-2 border-black bg-white px-3 text-xs font-black" type="submit">Recheck all event dates</button></form></div> : null}{!agentReady ? <p className="mt-4 border-l-4 border-[#c33124] bg-white p-3 text-xs font-black">Set up this customer&apos;s Lead Recovery agent above before launching.</p> : null}<form className="mt-4" action={launchAdminCampaignAction.bind(null, clientId, campaign.id, returnPath)}><label className="flex items-start gap-2 text-[11px] font-bold leading-4"><input className="mt-0.5 accent-black" required type="checkbox" />I reviewed the audience and calling limits.</label><button className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 bg-black px-3 text-xs font-black text-white disabled:opacity-35" disabled={!total || !agentReady} type="submit"><Play className="h-3.5 w-3.5" /> Confirm and launch</button></form></div></details>;
}

function AdminLead({ contact, attempts, clientId, returnPath, serviceType }: { contact: ReactivationContact; attempts: ReactivationAttempt[]; clientId: string; returnPath: string; serviceType: string }) {
  const latest = attempts[0];
  const callable = contact.import_bucket !== "exclude" && assessOpportunityDate({ serviceType, metadata: contact.import_metadata, notes: contact.notes }).eligible;
  return <article className="p-5"><div className="flex flex-col gap-4"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div className="flex min-w-0 items-start gap-3"><input aria-label={`Select ${contact.name}`} className="mt-1 h-4 w-4 flex-none accent-black" form="admin-lead-bulk-delete" name="contact_ids" type="checkbox" value={contact.id} /><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-black">{contact.name}</p><Status value={contact.status} />{contact.import_bucket ? <span className="border border-black/25 px-2 py-1 font-mono text-[8px] font-bold uppercase text-black/55">{bucketLabel(contact.import_bucket)}</span> : null}</div><p className="mt-1 text-xs font-semibold text-black/45">{contact.source || "Imported lead"} · {maskPhoneNumber(contact.phone_e164)} · {contact.attempt_count} attempts</p>{contact.qualification_notes || latest?.summary ? <p className="mt-3 text-sm font-semibold leading-6 text-black/60">{contact.qualification_notes || latest?.summary}</p> : null}<LeadContext contact={contact} serviceType={serviceType} /></div></div>{contact.requested_timing ? <span className="font-mono text-[10px] font-bold uppercase">{contact.requested_timing}</span> : null}</div>{callable ? <div className="flex flex-wrap gap-2"><a className="inline-flex h-10 items-center gap-2 bg-black px-3 text-xs font-black text-white" href={`tel:${contact.phone_e164}`}><Phone className="h-3.5 w-3.5" /> Call</a><form action={updateAdminReactivationLeadAction.bind(null, clientId, contact.id, returnPath, "contacted")}><button className="h-10 border-2 border-black px-3 text-xs font-black" type="submit">Mark contacted</button></form><form action={updateAdminReactivationLeadAction.bind(null, clientId, contact.id, returnPath, "not_interested")}><button className="h-10 border-2 border-black px-3 text-xs font-black" type="submit">Not interested</button></form><details className="relative"><summary className="inline-flex h-10 cursor-pointer list-none items-center bg-[#d8ff57] px-3 text-xs font-black">Book</summary><form action={updateAdminReactivationLeadAction.bind(null, clientId, contact.id, returnPath, "booked")} className="absolute right-0 top-12 z-20 grid w-72 gap-2 border-2 border-black bg-white p-3 shadow-[6px_6px_0_#000]"><input className="h-10 border border-black px-3 text-sm font-semibold" name="estimated_value" type="number" min="0" placeholder="Estimated value" /><input className="h-10 border border-black px-3 text-sm font-semibold" name="appointment_notes" placeholder="Appointment time / notes" /><button className="h-10 bg-black text-sm font-black text-white" type="submit">Confirm booking</button></form></details></div> : <p className="border-2 border-black bg-[#ffd7cc] px-3 py-2 text-xs font-black">Not callable · excluded by eligibility rules</p>}</div>{latest?.transcript || (latest?.recording_url && latest.vapi_call_id) ? <details className="mt-4 border-t border-black/20 pt-4"><summary className="flex cursor-pointer list-none items-center gap-2 text-xs font-black"><Headphones className="h-4 w-4" /> Recording and transcript</summary><div className="mt-4 grid gap-4">{latest.recording_url && latest.vapi_call_id ? <audio className="w-full" controls preload="none" src={recordingPlaybackPath("reactivation-attempts", latest.id)} /> : null}{latest.transcript ? <pre className="max-h-56 overflow-auto whitespace-pre-wrap bg-black/5 p-4 text-xs leading-5">{latest.transcript}</pre> : null}</div></details> : null}</article>;
}

function Metric({ icon: Icon, label, value, detail, accent = false }: { icon: typeof Users; label: string; value: string | number; detail: string; accent?: boolean }) { return <div className={`border-b border-r border-black p-4 ${accent ? "bg-[#d8ff57]" : "bg-white"}`}><div className="flex items-center justify-between"><p className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-black/45">{label}</p><Icon className="h-3.5 w-3.5" /></div><p className="mt-2 text-2xl font-black tracking-[-0.045em]">{typeof value === "number" ? value.toLocaleString() : value}</p><p className="mt-1 text-[11px] font-semibold text-black/40">{detail}</p></div>; }
function Status({ value }: { value: string }) { const accent = ["interested", "booked", "running", "active"].includes(value); return <span className={`inline-flex border border-black px-2 py-1 font-mono text-[9px] font-bold uppercase ${accent ? "bg-[#d8ff57]" : "bg-white"}`}>{value.replaceAll("_", " ")}</span>; }
function formatDate(value: string): string { return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value)); }
function crmNotice(search: Record<string, string | string[] | undefined>): { text: string; error: boolean } | null {
  if (search.created === "1") return { text: "Customer workspace created. Copy their access link, then prepare the first qualified lead list.", error: false };
  if (search.campaign_created === "1") return { text: "Recovery campaign created. Upload and map the customer’s lead list below.", error: false };
  if (search.setup === "1") return { text: "Test business is ready. Its seeded lead uses the full production variable and webhook path.", error: false };
  if (search.called === "1") return { text: "Mabel’s test call was queued with this customer and lead data.", error: false };
  if (search.launched === "1") return { text: "Campaign launched. Mabel will work through eligible leads within the configured limits.", error: false };
  if (typeof search.agent_saved === "string") return { text: "Customer agent saved and synchronized with Vapi.", error: false };
  if (typeof search.reclassified === "string") return { text: `Event-date check complete. ${Number(search.reclassified).toLocaleString()} lead${search.reclassified === "1" ? " was" : "s were"} moved to Exclude because the date was not confirmed in the future.`, error: false };
  if (typeof search.deleted_leads === "string") return { text: `${search.deleted_leads} selected lead${search.deleted_leads === "1" ? "" : "s"} deleted.`, error: false };
  if (typeof search.cleared_leads === "string") return { text: `Lead list cleared. ${Number(search.cleared_leads).toLocaleString()} lead${search.cleared_leads === "1" ? " was" : "s were"} deleted. You can now upload only the approved audience.`, error: false };
  if (typeof search.removed_excluded === "string") return { text: `${Number(search.removed_excluded).toLocaleString()} excluded record${search.removed_excluded === "1" ? " was" : "s were"} removed. Qualified leads remain in the campaign.`, error: false };
  const error = typeof search.error === "string" ? search.error : null;
  if (!error) return null;
  const messages: Record<string, string> = { customer_access: "Customer access could not be created.", customer_access_active: "This customer already has dashboard access.", telephony: "Production Vapi calling is not configured.", agent_not_ready: "Set up this customer’s Lead Recovery agent before launching the campaign.", agent_confirmation: "Confirm that you want to provision a dedicated inbound phone number.", agent_save: "The customer agent settings could not be saved.", agent_provision: "The settings were saved, but Vapi provisioning needs attention.", agent_type: "That agent type is not supported.", attestation: "Confirm the contact eligibility statement before importing or launching.", file: "Choose a CSV or XLSX file smaller than 10 MB.", spreadsheet: "That spreadsheet could not be read.", too_many_rows: "This spreadsheet has more than 25,000 rows. Split it into smaller files so Mabel never imports or replaces a list from a partial analysis.", campaign: "The recovery campaign could not be found.", campaign_name: "Give the recovery campaign a name.", campaign_save: "The campaign change could not be saved.", campaign_running: "Pause the campaign before replacing or deleting leads.", replace_confirmation: "Confirm that the current campaign list should be replaced.", replace: "The new leads imported, but the previous list could not be fully replaced.", no_leads_selected: "Select at least one lead to delete.", delete_leads: "The selected leads could not be deleted.", clear_confirmation: "Confirm that the complete lead list should be deleted.", clear_leads: "The complete lead list could not be deleted.", remove_excluded_confirmation: "Confirm that excluded records should be removed.", remove_excluded: "The excluded records could not be removed.", lead_update: "The lead could not be updated.", appointment_save: "The lead was marked booked, but the appointment details could not be saved.", no_callable_leads: "No callable leads were found. Map both a name and phone column.", bucket_selection: "Choose at least one opportunity bucket to import.", no_valid_leads: "Import at least one eligible lead before launching.", import: "The leads could not be imported.", "test-record": "The protected test customer or lead could not be found.", "test-guard": "The test-call safety guard blocked a phone that is not the owner or alert number.", call: "Vapi could not queue the test call." };
  return { text: messages[error] || "The request could not be completed.", error: true };
}
