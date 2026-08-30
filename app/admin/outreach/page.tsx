import type { Metadata } from "next";
import {
  CalendarClock,
  MessageSquareReply,
  Plus,
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
  updateOutreachProspectAction,
} from "./actions";
import { ProspectBulkToolbar } from "./prospect-bulk-toolbar";
import { ProspectRow } from "./prospect-row";
import { adminCookie, verifyAdminSessionToken } from "@/lib/admin";
import {
  buildOutreachSummary,
  outreachStageLabels,
  outreachStages,
  type OutreachProspect,
  type OutreachStage,
} from "@/lib/outreach";
import { getSupabaseAdmin } from "@/lib/supabase-server";

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
  const notice = search.created
    ? "Prospect added."
    : search.updated
      ? "Prospect updated."
      : search.deleted
        ? "Prospect removed."
        : typeof search.bulk_added === "string"
          ? `${search.bulk_added} prospect${search.bulk_added === "1" ? "" : "s"} added${Number(search.bulk_skipped) ? ` · ${search.bulk_skipped} skipped as duplicates or blank lines` : ""}.`
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
                    : null;

  return (
    <main className="product-ui min-h-screen bg-[var(--product-canvas)] text-[var(--product-ink)]">
      <AdminHeader active="outreach" />

      <div className="mx-auto max-w-[1440px] px-5 py-7 sm:px-8 sm:py-9">
        {notice ? (
          <div
            className={`mb-6 border px-4 py-3 text-sm font-black ${
              search.error ? "border-black bg-black text-white" : "border-[var(--product-line-strong)] bg-white"
            }`}
            role="status"
          >
            {notice}
          </div>
        ) : null}

        <section className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-black/45">
              HVAC pilot pipeline
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.05em] sm:text-4xl">
              Outreach that ends in one live test.
            </h2>
            <p className="mt-3 max-w-xl text-sm font-semibold leading-6 text-black/55">
              Keep the list small, send personal emails, and always leave a clear next follow-up.
            </p>
          </div>
          <a
            className="inline-flex min-h-11 items-center justify-center gap-2 self-start bg-black px-4 text-sm font-black text-white sm:self-auto"
            href="#add-prospect"
          >
            <Plus className="h-4 w-4" aria-hidden="true" /> Add prospect
          </a>
        </section>

        <section className="mt-7 grid grid-cols-2 border-l border-t border-[var(--product-line)] bg-white sm:grid-cols-5" aria-label="Outreach summary">
          <OutreachStat icon={<UsersRound />} label="Prospects" value={summary.total} />
          <OutreachStat icon={<Send />} label="Ready to email" value={summary.ready} />
          <OutreachStat icon={<CalendarClock />} label="Follow-ups due" value={summary.followUpsDue} accent={summary.followUpsDue > 0} />
          <OutreachStat icon={<MessageSquareReply />} label="Positive replies" value={summary.replies} />
          <OutreachStat icon={<Target />} label="Pilots booked" value={summary.pilots} />
        </section>

        <details
          className="mt-7 scroll-mt-5 border border-[var(--product-line-strong)] bg-white"
          id="add-prospect"
          open={search.error === "website"}
        >
          <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 sm:px-5">
            <span className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center bg-[var(--product-accent)]">
                <Plus className="h-4 w-4" aria-hidden="true" />
              </span>
              <span>
                <span className="block font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-black/45">New lead</span>
                <span className="mt-0.5 block text-base font-black">Add a company by website</span>
              </span>
            </span>
            <span className="text-xs font-black text-black/45">Open form</span>
          </summary>
          <form action={addOutreachProspectAction} className="grid gap-4 border-t border-[var(--product-line)] p-4 sm:grid-cols-[minmax(220px,1fr)_minmax(260px,1.4fr)_auto] sm:items-end sm:p-5">
            <label className="block text-xs font-black">
              Company website
              <input
                className="mt-1 min-h-11 w-full border px-3 py-2 text-sm font-normal outline-none"
                name="website"
                placeholder="coolbreezehvac.com"
                required
              />
            </label>
            <label className="block text-xs font-black">
              Notes
              <input
                className="mt-1 min-h-11 w-full border px-3 py-2 text-sm font-normal outline-none"
                name="notes"
                placeholder="Personal angle or next step (optional)"
              />
            </label>
            <button className="inline-flex min-h-11 items-center justify-center bg-black px-5 text-sm font-black text-white" type="submit">
              Add prospect
            </button>
            <p className="text-[11px] font-semibold text-black/45 sm:col-span-3">
              The company name is filled in from the domain. Use the pencil on the row to add the contact, phone, email, and follow-up dates.
            </p>
          </form>
        </details>

        <details
          className="mt-3 scroll-mt-5 border border-[var(--product-line-strong)] bg-white"
          id="bulk-add"
          open={search.error === "bulk"}
        >
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 sm:px-5">
            <span className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center bg-black text-white">
                <UsersRound className="h-4 w-4" aria-hidden="true" />
              </span>
              <span>
                <span className="block font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-black/45">Bulk add</span>
                <span className="mt-0.5 block text-base font-black">Paste a call list</span>
              </span>
            </span>
            <span className="text-xs font-black text-black/45">Open form</span>
          </summary>
          <form action={bulkAddOutreachProspectsAction} className="border-t border-[var(--product-line)] p-4 sm:p-5">
            <label className="block text-xs font-black">
              One company per line: Company | City | Website | Phone
              <textarea
                className="mt-2 min-h-44 w-full resize-y border px-3 py-2 font-mono text-xs leading-6 outline-none"
                name="bulk_lines"
                placeholder={"Cool Breeze Heating & Air | Raleigh | coolbreezenc.com | (919) 555-0100\nComfort Pros HVAC | Cary | comfortproshvac.com"}
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

        <section className="mt-8" aria-labelledby="prospect-list-title">
          <div className="flex flex-col gap-4 border-b border-[var(--product-line-strong)] pb-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-black/45">Working list</p>
              <h2 className="mt-1 text-2xl font-black tracking-[-0.04em]" id="prospect-list-title">Prospects</h2>
            </div>
            <nav className="flex gap-1 overflow-x-auto" aria-label="Filter prospects by stage">
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
            <div className="mt-5 border border-red-300 bg-red-50 p-4 text-sm font-semibold text-red-900">
              Outreach data could not load: {loadError}
            </div>
          ) : visibleProspects.length === 0 ? (
            <div className="mt-5 border border-dashed border-[var(--product-line-strong)] bg-white px-5 py-12 text-center">
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
              <div className="mt-4">
                <ProspectBulkToolbar
                  action={bulkDeleteOutreachProspectsAction}
                  formId="outreach-bulk-delete"
                  total={visibleProspects.length}
                />
              </div>
              <div className="mt-3 border border-[var(--product-line-strong)] bg-white">
                <div className="hidden grid-cols-[minmax(190px,1.25fr)_minmax(180px,1fr)_145px_110px_130px_150px] gap-4 border-b border-[var(--product-line)] bg-[var(--product-surface-muted)] px-4 py-3 font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-black/45 lg:grid">
                  <span>Company</span>
                  <span>Contact</span>
                  <span>Stage</span>
                  <span>Last touch</span>
                  <span>Next follow-up</span>
                  <span className="text-right">Actions</span>
                </div>
                <div className="divide-y divide-[var(--product-line)]">
                  {visibleProspects.map((prospect) => (
                    <ProspectRow
                      key={prospect.id}
                      prospect={prospect}
                      bulkFormId="outreach-bulk-delete"
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
    <div className={`border-b border-r border-[var(--product-line)] p-4 ${accent ? "bg-[var(--product-accent)]" : ""}`}>
      <div className="flex items-center gap-2 text-black/45">
        <span className="[&>svg]:h-4 [&>svg]:w-4">{icon}</span>
        <p className="text-[11px] font-bold">{label}</p>
      </div>
      <p className="mt-2 text-2xl font-black tabular-nums tracking-[-0.04em]">{value}</p>
    </div>
  );
}

function StageFilter({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`inline-flex min-h-10 shrink-0 items-center border px-3 text-xs font-black ${
        active
          ? "border-black bg-black text-white"
          : "border-[var(--product-line)] bg-white text-black/55 hover:border-black hover:text-black"
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

