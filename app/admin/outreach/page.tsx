import type { Metadata } from "next";
import {
  CalendarClock,
  MessageSquareReply,
  Send,
  Target,
  UsersRound,
} from "lucide-react";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminHeader } from "../admin-header";
import { DeleteRecordButton } from "../delete-record-button";
import {
  addOutreachProspectAction,
  bulkAddOutreachProspectsAction,
  bulkDeleteOutreachProspectsAction,
  deleteOutreachProspectAction,
  logOutreachCallAction,
  startOutreachAgentCallAction,
  updateOutreachProspectAction,
} from "./actions";
import { ProspectBulkToolbar } from "./prospect-bulk-toolbar";
import { ProspectSearch } from "./prospect-search";
import { ProspectRow } from "./prospect-row";
import { QuickAddProspect } from "./quick-add-prospect";
import { adminCookie, verifyAdminSessionToken } from "@/lib/admin";
import {
  buildOutreachSummary,
  isOutreachCallOutcome,
  outreachCallOutcomes,
  outreachStageLabels,
  outreachStages,
  type OutreachProspect,
  type OutreachStage,
} from "@/lib/outreach";
import { manualOutreachWindowLabel } from "@/lib/outreach-call";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { outreachCallingConfigured } from "@/lib/outreach-retell";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Outreach | Raleigh Lead Recovery", robots: { index: false, follow: false } };

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

async function loadProspects(): Promise<{
  prospects: OutreachProspect[];
  error: string | null;
}> {
  try {
    const { data, error } = await getSupabaseAdmin()
      .from("outreach_prospects")
      .select("*")
      .order("next_follow_up_on", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false });
    if (error) throw error;
    return { prospects: (data ?? []) as OutreachProspect[], error: null };
  } catch (error) {
    console.error("Admin outreach tracker failed to load", error);
    return {
      prospects: [],
      error:
        error instanceof Error && error.message
          ? error.message
          : "The outreach tracker could not load.",
    };
  }
}

export default async function OutreachPage({ searchParams }: PageProps) {
  const cookieStore = await cookies();
  if (!verifyAdminSessionToken(cookieStore.get(adminCookie.name)?.value)) {
    redirect("/admin?error=session");
  }

  const search = (await searchParams) ?? {};
  const requestedStage = typeof search.stage === "string" ? search.stage : "all";
  const activeStage = outreachStages.includes(requestedStage as OutreachStage)
    ? (requestedStage as OutreachStage)
    : "all";
  const { prospects, error: loadError } = await loadProspects();
  const visibleProspects =
    activeStage === "all"
      ? prospects
      : prospects.filter((prospect) => prospect.stage === activeStage);
  const summary = buildOutreachSummary(prospects);
  const agentConfigured = outreachCallingConfigured();
  const notice = search.created
    ? "Prospect added."
    : search.agent_call_started
      ? "Chloe started the call. The result will appear here after Retell analyzes it."
    : search.duplicate
      ? "That company is already in your call list."
    : search.updated
      ? "Prospect updated."
      : search.deleted
        ? "Prospect removed."
        : typeof search.bulk_added === "string"
          ? `${search.bulk_added} prospect${search.bulk_added === "1" ? "" : "s"} added${Number(search.bulk_skipped) ? ` · ${search.bulk_skipped} skipped as duplicates or blank lines` : ""}.`
          : typeof search.call_logged === "string" && isOutreachCallOutcome(search.call_logged)
          ? `Call logged: ${outreachCallOutcomes[search.call_logged]}.`
          : typeof search.bulk_deleted === "string"
            ? `${search.bulk_deleted} prospect${search.bulk_deleted === "1" ? "" : "s"} removed.`
            : search.error === "company"
              ? "Company name is required."
              : search.error === "website"
                ? "Enter a valid company website, like coolbreezehvac.com."
                : search.error === "bulk"
                  ? "Paste at least one line with a company name."
                  : search.error === "bulk_delete"
                    ? "Select at least one prospect to delete."
                    : search.error === "call_log"
                      ? "The call could not be logged. Try again."
                      : search.error === "eligibility"
                        ? "Confirm that this business call is permitted before dialing."
                        : search.error === "outside_window"
                          ? `AI outreach calls are limited to ${manualOutreachWindowLabel}.`
                          : search.error === "invalid_phone"
                            ? "Add a valid US phone number before dialing."
                            : search.error === "call_in_progress"
                              ? "A call is already in progress for that prospect."
                              : search.error === "do_not_call"
                                ? "That prospect is on the do-not-call list."
                                : search.error === "agent_not_configured"
                                  ? "The Retell outreach agent is not configured yet."
                                  : search.error === "agent_call"
                                    ? "Retell could not start the call. Try again or review the agent configuration."
                      : null;

  return (
    <main className="product-ui min-h-screen bg-[var(--product-canvas)] text-[var(--product-ink)]">
      <AdminHeader active="outreach" />

      <div className="mx-auto max-w-[1320px] px-5 py-7 sm:px-8 sm:py-9">
        {notice ? (
          <div
            className={`mb-5 rounded-xl border px-4 py-3 text-sm font-semibold shadow-sm ${
              search.error ? "border-red-200 bg-red-50 text-red-900" : "border-[var(--product-line)] bg-white"
            }`}
            role="status"
          >
            {notice}
          </div>
        ) : null}

        <section>
          <h2 className="text-2xl font-bold tracking-[-0.035em] text-slate-950 sm:text-3xl">
            Outreach
          </h2>
          <p className="mt-1.5 text-sm text-slate-500">
            Add a company, start a call, and see the next step without managing a second spreadsheet.
          </p>
        </section>

        <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-5" aria-label="Outreach summary">
          <OutreachStat icon={<UsersRound />} label="Prospects" value={summary.total} />
          <OutreachStat icon={<Send />} label="Ready to contact" value={summary.ready} />
          <OutreachStat icon={<CalendarClock />} label="Follow-ups due" value={summary.followUpsDue} accent={summary.followUpsDue > 0} />
          <OutreachStat icon={<MessageSquareReply />} label="Positive replies" value={summary.replies} />
          <OutreachStat icon={<Target />} label="Pilots booked" value={summary.pilots} />
        </section>

        <section className={`mt-4 flex flex-col gap-2 rounded-xl border px-4 py-3.5 shadow-sm sm:flex-row sm:items-center sm:justify-between ${agentConfigured ? "border-emerald-200 bg-emerald-50/70" : "border-amber-200 bg-amber-50"}`}>
          <div>
            <p className="text-sm font-semibold text-slate-900">Chloe · {agentConfigured ? "Ready to qualify" : "Setup required"}</p>
            <p className="mt-0.5 text-xs leading-5 text-slate-600">
              You approve every call. Chloe asks one question at a time and logs the outcome automatically.
            </p>
          </div>
          <span className={`w-fit rounded-full px-2.5 py-1 text-[11px] font-semibold ${agentConfigured ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-900"}`}>
            {agentConfigured ? "Agent online" : "Needs attention"}
          </span>
        </section>

        <div className="mt-3">
          <QuickAddProspect action={addOutreachProspectAction} />

        <details
          className="mt-3 scroll-mt-5 overflow-hidden rounded-xl border border-[var(--product-line)] bg-white shadow-sm"
          id="bulk-add"
          open={search.error === "bulk"}
        >
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 px-4 py-2">
            <span className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-900 text-white">
                <UsersRound className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="text-sm font-semibold">Paste a call list</span>
            </span>
            <span className="text-xs font-medium text-slate-500">Open form</span>
          </summary>
          <form action={bulkAddOutreachProspectsAction} className="border-t border-[var(--product-line)] p-4 sm:p-5">
            <label className="block text-xs font-black">
              One company per line: Company | City | Address | Website | Phone
              <textarea
                className="mt-2 min-h-44 w-full resize-y border px-3 py-2 font-mono text-xs leading-6 outline-none"
                name="bulk_lines"
                placeholder={"Cool Breeze Heating & Air | Raleigh | 123 Main St, Raleigh, NC 27601 | coolbreezenc.com | (919) 555-0100\nComfort Pros HVAC | Cary | 456 Center St, Cary, NC 27511 | comfortproshvac.com"}
                required
              />
            </label>
            <p className="mt-2 text-[11px] font-semibold text-black/45">
              Only the company name is required. Companies already in the tracker are skipped, and everyone lands in the Not contacted stage.
            </p>
            <button className="mt-3 inline-flex min-h-11 items-center justify-center bg-black px-5 text-sm font-black text-white" type="submit">
              Add all to the tracker
            </button>
          </form>
        </details>
        </div>

        <section className="mt-8" aria-labelledby="prospect-list-title">
          <div className="pb-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-xl font-bold tracking-[-0.025em] text-slate-950" id="prospect-list-title">Call list</h2>
                <p className="mt-1 text-sm text-slate-500">Choose a company and take the next action.</p>
              </div>
              <ProspectSearch total={visibleProspects.length} />
            </div>
            <nav className="mt-3 flex gap-1 overflow-x-auto" aria-label="Filter prospects by stage">
              <StageFilter href="/admin/outreach" active={activeStage === "all"}>All</StageFilter>
              {outreachStages.map((stage) => (
                <StageFilter
                  key={stage}
                  href={`/admin/outreach?stage=${stage}`}
                  active={activeStage === stage}
                >
                  {outreachStageLabels[stage]}
                </StageFilter>
              ))}
            </nav>
          </div>

          {loadError ? (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-900">
              Outreach data could not load: {loadError}
            </div>
          ) : visibleProspects.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-[var(--product-line-strong)] bg-white px-5 py-12 text-center">
              <Send className="mx-auto h-6 w-6 text-black/35" aria-hidden="true" />
              <h3 className="mt-4 text-lg font-black">
                {prospects.length === 0 ? "Add the first company to your list." : "No prospects in this stage."}
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm font-semibold leading-6 text-black/50">
                Track the person you emailed, what happened, and the exact day you should follow up.
              </p>
              {prospects.length === 0 ? (
                <a className="mt-5 inline-flex min-h-11 items-center bg-black px-4 text-sm font-black text-white" href="#add-prospect">
                  Add a prospect
                </a>
              ) : null}
            </div>
          ) : (
            <>
              <div className="mt-3">
                <ProspectBulkToolbar
                  action={bulkDeleteOutreachProspectsAction}
                  formId="outreach-bulk-delete"
                  total={visibleProspects.length}
                />
              </div>
              <div className="mt-3 overflow-hidden rounded-2xl border border-[var(--product-line)] bg-white shadow-sm">
                <div className="hidden grid-cols-[minmax(190px,1.25fr)_minmax(155px,.9fr)_125px_125px_120px_220px] gap-3 border-b border-[var(--product-line)] bg-slate-50/80 px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500 lg:grid">
                  <span>Company</span>
                  <span>Contact</span>
                  <span>Last result</span>
                  <span>Next follow-up</span>
                  <span>Stage</span>
                  <span className="text-right">Actions</span>
                </div>
                <div className="divide-y divide-[var(--product-line)]">
                  {visibleProspects.map((prospect) => (
                    <ProspectRow
                      key={prospect.id}
                      prospect={prospect}
                      bulkFormId="outreach-bulk-delete"
                      logCallAction={logOutreachCallAction.bind(null, prospect.id)}
                      agentCallAction={startOutreachAgentCallAction.bind(null, prospect.id)}
                      agentConfigured={agentConfigured}
                      editForm={
                        <>
                          <ProspectForm
                            action={updateOutreachProspectAction.bind(null, prospect.id)}
                            prospect={prospect}
                          />
                          <div className="mt-3 border-t border-[var(--product-line)] pt-3">
                            <DeleteRecordButton
                              action={deleteOutreachProspectAction.bind(null, prospect.id)}
                              label="Remove prospect"
                              confirmMessage={`Remove ${prospect.company_name} from the outreach tracker?`}
                            />
                          </div>
                        </>
                      }
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}

function OutreachStat({
  icon,
  label,
  value,
  accent = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className={`rounded-xl border px-4 py-3.5 shadow-sm ${accent ? "border-amber-200 bg-amber-50" : "border-[var(--product-line)] bg-white"}`}>
      <div className="flex items-center justify-between">
        <p className="text-2xl font-bold tabular-nums tracking-[-0.04em] text-slate-950">{value}</p>
        <span className="text-slate-400 [&>svg]:h-4 [&>svg]:w-4">{icon}</span>
      </div>
      <p className="mt-1 text-xs font-medium text-slate-500">{label}</p>
    </div>
  );
}

function StageFilter({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`inline-flex min-h-9 shrink-0 items-center rounded-full px-3 text-xs font-semibold ${
        active
          ? "bg-slate-900 text-white"
          : "border border-[var(--product-line)] bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
      }`}
    >
      {children}
    </Link>
  );
}

function ProspectForm({
  action,
  prospect,
}: {
  action: (formData: FormData) => void | Promise<void>;
  prospect?: OutreachProspect;
}) {
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Field label="Company" name="company_name" defaultValue={prospect?.company_name} required />
      <Field label="City" name="city" defaultValue={prospect?.city} placeholder="Raleigh" />
      <Field label="Street address" name="address" defaultValue={prospect?.address} placeholder="123 Main St, Raleigh, NC 27601" />
      <Field label="Website" name="website" defaultValue={prospect?.website} placeholder="company.com" />
      <SelectField label="Stage" name="stage" value={prospect?.stage ?? "not_contacted"} />
      <Field label="Contact name" name="contact_name" defaultValue={prospect?.contact_name} />
      <Field label="Role" name="contact_role" defaultValue={prospect?.contact_role} placeholder="Owner" />
      <Field label="Email" name="email" type="email" defaultValue={prospect?.email} />
      <Field label="Phone" name="phone" type="tel" defaultValue={prospect?.phone} />
      <Field label="Last contacted" name="last_contacted_on" type="date" defaultValue={prospect?.last_contacted_on} />
      <Field label="Next follow-up" name="next_follow_up_on" type="date" defaultValue={prospect?.next_follow_up_on} />
      <label className="block text-xs font-black sm:col-span-2">
        Notes
        <textarea
          className="mt-1 min-h-24 w-full resize-y border px-3 py-2 text-sm font-normal leading-5 outline-none"
          name="notes"
          defaultValue={prospect?.notes ?? ""}
          placeholder="Personal angle, last response, or next step"
        />
      </label>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2 lg:col-span-4">
        <button className="inline-flex min-h-11 items-center justify-center bg-black px-5 text-sm font-black text-white" type="submit">
          {prospect ? "Save changes" : "Add prospect"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required = false,
  placeholder,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string | null;
}) {
  return (
    <label className="block text-xs font-black">
      {label}
      <input
        className="mt-1 min-h-11 w-full border px-3 py-2 text-sm font-normal outline-none"
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue ?? ""}
      />
    </label>
  );
}

function SelectField({ label, name, value }: { label: string; name: string; value: OutreachStage }) {
  return (
    <label className="block text-xs font-black">
      {label}
      <select className="mt-1 min-h-11 w-full border px-3 text-sm font-normal" name={name} defaultValue={value}>
        {outreachStages.map((stage) => (
          <option key={stage} value={stage}>{outreachStageLabels[stage]}</option>
        ))}
      </select>
    </label>
  );
}
