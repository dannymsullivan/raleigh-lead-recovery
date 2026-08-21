import { Calculator, Check, CircleAlert, DollarSign, ExternalLink, LogOut, MessageSquareText, PhoneCall, Plus, Settings2, ShieldCheck, TrendingUp, UsersRound } from "lucide-react";
import { cookies } from "next/headers";
import Link from "next/link";
import { addClientAction, deleteClientAction, loginAction, logoutAction, updateClientAction } from "../actions";
import { DeleteRecordButton } from "./delete-record-button";
import { adminCookie, verifyAdminSessionToken } from "@/lib/admin";
import { loadCostDashboard, type CostDashboard } from "@/lib/costs";
import { buildIntegrationStatuses, type IntegrationStatus } from "@/lib/operations";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import type { Client } from "@/lib/types";
import { retryTransientCredentialError } from "@/lib/retry";
import { customerCrmPath } from "@/lib/customer-slug";
import { isClientDeletionLocked } from "@/lib/client-deletion";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function describeLoadError(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  if (error && typeof error === "object") {
    const details = error as { message?: unknown; details?: unknown; hint?: unknown; code?: unknown };
    const parts = [details.message, details.details, details.hint, details.code]
      .filter((value): value is string => typeof value === "string" && value.trim().length > 0);
    if (parts.length > 0) return [...new Set(parts)].join(" · ");
  }
  return fallback;
}

async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  return verifyAdminSessionToken(cookieStore.get(adminCookie.name)?.value);
}

async function loadClients(): Promise<{ clients: Client[]; error: string | null }> {
  try {
    return await retryTransientCredentialError(async () => {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase.from("clients").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return { clients: (data ?? []) as Client[], error: null };
    });
  } catch (error) {
    console.error("Admin customer ledger failed to load", error);
    return {
      clients: [],
      error: describeLoadError(error, "Unknown Supabase error")
    };
  }
}

async function loadCosts(): Promise<{ dashboard: CostDashboard | null; error: string | null }> {
  try {
    return { dashboard: await retryTransientCredentialError(() => loadCostDashboard()), error: null };
  } catch (error) {
    console.error("Admin cost dashboard failed to load", error);
    return {
      dashboard: null,
      error: describeLoadError(error, "Unknown cost dashboard error")
    };
  }
}

export default async function AdminPage({ searchParams }: PageProps) {
  const authenticated = await isAuthenticated();
  const search = (await searchParams) ?? {};
  const error = typeof search.error === "string" ? search.error : null;
  const created = typeof search.created === "string" ? search.created : null;
  const updated = typeof search.updated === "string" ? search.updated : null;
  const deleted = typeof search.deleted === "string" ? search.deleted : null;
  const view = search.view === "settings" ? "settings" : "customers";

  if (!authenticated) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-5 py-10">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded bg-neutral-950 text-white">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-normal">Raleigh Lead Recovery</h1>
            <p className="text-sm text-neutral-600">Internal admin</p>
          </div>
        </div>

        <form action={loginAction} className="rounded border border-neutral-200 bg-white p-5 shadow-sm">
          <label className="block text-sm font-medium text-neutral-800" htmlFor="password">
            Admin password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            className="mt-2 w-full rounded border border-neutral-300 px-3 py-2 outline-none focus:border-neutral-950"
            autoComplete="current-password"
            required
          />
          {error === "login" ? <p className="mt-3 text-sm text-red-700">Password did not match.</p> : null}
          {error === "session" ? <p className="mt-3 text-sm text-red-700">Please sign in again.</p> : null}
          <button className="mt-4 w-full rounded bg-neutral-950 px-4 py-2 font-medium text-white" type="submit">
            Sign in
          </button>
        </form>
      </main>
    );
  }

  const [{ clients, error: loadError }, { dashboard, error: costError }] = await Promise.all([
    loadClients(),
    view === "settings" ? loadCosts() : Promise.resolve({ dashboard: null, error: null })
  ]);
  const integrations = buildIntegrationStatuses(process.env, !loadError, clients);

  return (
    <main className="product-ui min-h-screen bg-[#f4f1e8] text-black">
      <header className="border-b-2 border-black bg-[#f4f1e8]">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-5 sm:px-8">
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-black/45">Founder operations</p>
            <h1 className="mt-1 text-2xl font-black tracking-[-0.04em]">Chloe control room</h1>
          </div>
          <form action={logoutAction}>
            <button className="inline-flex h-10 items-center gap-2 border-2 border-black px-3 text-sm font-extrabold hover:bg-black hover:text-white" type="submit">
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Sign out
            </button>
          </form>
        </div>
        <nav aria-label="Admin sections" className="mx-auto flex max-w-[1440px] gap-1 px-5 sm:px-8">
          <AdminTab href="/admin" active={view === "customers"} icon={<UsersRound className="h-4 w-4" aria-hidden="true" />}>Customers</AdminTab>
          <AdminTab href="/admin?view=settings" active={view === "settings"} icon={<Settings2 className="h-4 w-4" aria-hidden="true" />}>System &amp; costs</AdminTab>
        </nav>
      </header>

      {created || updated || deleted || error?.startsWith("client-") ? (
        <div className="mx-auto max-w-[1440px] px-5 pt-6 sm:px-8">
          <AdminNotice created={created} updated={updated} deleted={deleted} error={error} />
        </div>
      ) : null}

      {view === "settings" ? <div className="mx-auto max-w-[1440px] px-5 pt-8 sm:px-8">
        <SystemOverview integrations={integrations} />
      </div> : null}

      {view === "settings" ? <div className="mx-auto max-w-[1440px] px-5 py-8 sm:px-8">
        <CostDashboardSection dashboard={dashboard} error={costError} />
      </div> : null}

      {view === "customers" ? <div className="mx-auto grid max-w-[1440px] gap-6 px-5 py-8 sm:px-8">
        <section className="min-w-0">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-black/45">Customer ledger</p>
              <h2 className="mt-1 text-2xl font-black tracking-[-0.04em]">Customers</h2>
            </div>
            <div className="flex items-center gap-3"><span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-black/40">{clients.length} total</span><a className="inline-flex min-h-11 items-center gap-2 bg-black px-4 text-sm font-black text-white" href="#add-customer"><Plus className="h-4 w-4" /> Add customer</a></div>
          </div>

          {loadError ? (
            <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-900">{loadError}</div>
          ) : clients.length === 0 ? (
            <div className="rounded border border-neutral-200 bg-white p-5 text-sm text-neutral-600">No clients yet. Add the demo client or run the seed script.</div>
          ) : (
            <div className="overflow-x-auto border-2 border-black bg-white">
              <table className="w-full min-w-[1000px] text-left text-sm">
                <thead className="border-b-2 border-black bg-[#f4f1e8] font-mono text-[9px] uppercase tracking-[0.12em] text-black/50">
                  <tr>
                    <th className="px-4 py-3 font-bold">Business</th>
                    <th className="px-4 py-3 font-bold">Account</th>
                    <th className="px-4 py-3 font-bold">Setup</th>
                    <th className="px-4 py-3 font-bold">Owner</th>
                    <th className="px-4 py-3 font-bold">Trial / pilot</th>
                    <th className="px-4 py-3 font-bold">Report</th>
                    <th className="px-4 py-3 font-bold">Manage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/15">
                  {clients.map((client) => (
                    <tr key={client.id}>
                      <td className="px-4 py-3">
                        <p className="font-black">{client.business_name}</p>
                        <p className="mt-1 text-xs font-semibold text-black/45">{client.trade}{client.is_test_account ? " · TEST" : ""}</p>
                      </td>
                      <td className="px-4 py-3"><StatusPill value={client.account_status ?? "onboarding"} /></td>
                      <td className="px-4 py-3"><StatusPill value={client.provisioning_status ?? "pending"} /></td>
                      <td className="px-4 py-3 font-semibold text-black/65">{client.owner_name}</td>
                      <td className="px-4 py-3 text-xs font-semibold text-black/55">
                        {client.trial_ends_at ? `Ends ${formatShortDate(client.trial_ends_at)}` : `${client.pilot_start} to ${client.pilot_end}`}
                      </td>
                      <td className="px-4 py-3">
                        <Link className="inline-flex items-center gap-1 font-medium text-red-700" href={`/report/${client.id}`}>
                          Open
                          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                        </Link>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          <Link className="inline-flex min-h-10 items-center gap-2 border-2 border-black bg-black px-3 text-xs font-black text-white" href={customerCrmPath(client)}>Open CRM <ExternalLink className="h-3.5 w-3.5" /></Link>
                          <Link className="inline-flex min-h-10 items-center border-2 border-black px-3 text-xs font-black" href={`${customerCrmPath(client)}#lead-import`}>Upload leads</Link>
                          {isClientDeletionLocked(client) ? (
                            <span className="inline-flex min-h-10 items-center border-2 border-black/20 px-3 font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-black/45">Demo protected</span>
                          ) : (
                            <DeleteRecordButton action={deleteClientAction.bind(null, client.id)} label="Delete" confirmMessage={`Delete ${client.business_name} and all of its call history? This cannot be undone.`} />
                          )}
                        </div>
                        <details className="w-[300px]">
                          <summary className="cursor-pointer text-xs font-black underline decoration-2 underline-offset-4">Edit customer</summary>
                          <form action={updateClientAction.bind(null, client.id)} className="mt-4 grid gap-3 border-2 border-black bg-[#f4f1e8] p-4">
                            <Field label="Business" name="business_name" defaultValue={client.business_name} required />
                            <div className="grid grid-cols-2 gap-3"><Field label="Trade" name="trade" defaultValue={client.trade} required /><Field label="Service area" name="service_area" defaultValue={client.service_area ?? ""} /></div>
                            <div className="grid grid-cols-2 gap-3"><Field label="Owner" name="owner_name" defaultValue={client.owner_name} required /><Field label="Phone" name="owner_phone" defaultValue={client.owner_phone} required /></div>
                            <Field label="Email" name="owner_email" type="email" defaultValue={client.owner_email ?? ""} />
                            <div className="grid grid-cols-2 gap-3"><SelectField label="Account" name="account_status" value={client.account_status ?? "onboarding"} options={["onboarding", "trialing", "active", "past_due", "canceled"]} /><SelectField label="Setup" name="provisioning_status" value={client.provisioning_status ?? "pending"} options={["pending", "provisioning", "ready", "needs_configuration", "error"]} /></div>
                            <div className="grid grid-cols-2 gap-3"><Field label="Pilot start" name="pilot_start" type="date" defaultValue={client.pilot_start} required /><Field label="Pilot end" name="pilot_end" type="date" defaultValue={client.pilot_end} required /></div>
                            <div className="grid grid-cols-2 gap-3"><Field label="Avg job value" name="avg_job_value" type="number" defaultValue={String(client.avg_job_value)} /><Field label="Close rate" name="close_rate" type="number" step="0.01" defaultValue={String(client.close_rate)} /></div>
                            <button className="min-h-11 bg-black px-4 text-sm font-black text-white" type="submit">Save customer</button>
                          </form>
                        </details>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <details className="scroll-mt-6 border-2 border-black bg-white" id="add-customer" open={error === "client"}>
          <summary className="flex cursor-pointer list-none items-center justify-between gap-5 px-5 py-5 sm:px-6">
            <span className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center bg-black text-white"><Plus className="h-4 w-4" aria-hidden="true" /></span><span><span className="block font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-black/45">Manual setup</span><span className="mt-1 block text-lg font-black">Add a customer</span></span></span>
            <span className="text-xs font-black text-black/50">Open form</span>
          </summary>
          <div className="border-t-2 border-black p-5 sm:p-6">
            {error === "client" ? <p className="mb-5 border-2 border-black bg-[#d8ff57] p-3 text-sm font-black">Business, trade, owner, and phone are required.</p> : null}
            <form action={addClientAction} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Field label="Business name" name="business_name" required />
              <Field label="Trade" name="trade" placeholder="plumbing" required />
              <Field label="Owner name" name="owner_name" required />
              <Field label="Owner phone" name="owner_phone" placeholder="+19195550123" required />
              <Field label="Owner email" name="owner_email" type="email" />
              <p className="border-l-4 border-black bg-[#f4f1e8] p-3 text-xs font-semibold leading-5 text-black/55 sm:col-span-2 xl:col-span-3">This creates one customer workspace and its first campaign. You’ll get a secure access link to send the owner; their verified login attaches to this workspace.</p>
              <Field label="Pilot start" name="pilot_start" type="date" />
              <Field label="Pilot end" name="pilot_end" type="date" />
              <div className="grid grid-cols-2 gap-3"><Field label="Avg job value" name="avg_job_value" type="number" placeholder="500" /><Field label="Close rate" name="close_rate" type="number" step="0.01" placeholder="0.4" /></div>
              <button className="h-12 bg-black px-5 text-sm font-black text-white sm:col-span-2 xl:col-span-1" type="submit">Create customer workspace</button>
            </form>
          </div>
        </details>
      </div> : null}
    </main>
  );
}

function AdminTab({ href, active, icon, children }: { href: string; active: boolean; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`inline-flex min-h-11 items-center gap-2 border-x-2 border-t-2 px-4 text-sm font-black transition-[background-color,color] duration-150 active:scale-[0.97] ${active ? "border-black bg-black text-white" : "border-transparent text-black/50 hover:border-black/20 hover:bg-black/5 hover:text-black"}`}
    >
      {icon}
      {children}
    </Link>
  );
}

function SystemOverview({ integrations }: { integrations: IntegrationStatus[] }) {
  return (
    <section>
      <div className="max-w-3xl">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-black/45">System &amp; costs</p>
        <h2 className="mt-2 text-3xl font-black tracking-[-0.05em] sm:text-4xl">Usage, spend, and connections.</h2>
        <p className="mt-3 text-sm font-semibold leading-6 text-black/50">Live customer usage with planning estimates—not provider invoices.</p>
      </div>

      <div className="mt-5 overflow-hidden border-2 border-black bg-white">
        <div className="grid sm:grid-cols-2 xl:grid-cols-4">
          {integrations.map((integration) => (
            <div className="flex min-h-16 items-center justify-between gap-3 border-b border-black/15 px-4 py-3 sm:border-r xl:border-b-0" key={integration.name} title={integration.detail}>
              <div className="flex min-w-0 items-center gap-2.5">
                <IntegrationMark status={integration.status} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-black">{integration.name}</p>
                  <p className="truncate text-[11px] font-semibold text-black/45">{integration.detail}</p>
                </div>
              </div>
              <span className={`shrink-0 font-mono text-[8px] font-bold uppercase tracking-[0.1em] ${integration.status === "connected" ? "text-black" : "text-black/45"}`}>
                {integration.status.replace("_", " ")}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function IntegrationMark({ status }: { status: IntegrationStatus["status"] }) {
  if (status === "connected") return <span className="grid h-5 w-5 place-items-center rounded-full bg-black text-white"><Check className="h-3 w-3" /></span>;
  if (status === "attention") return <CircleAlert className="h-5 w-5" aria-hidden="true" />;
  return <span className="h-5 w-5 rounded-full border-2 border-black/35" />;
}


function StatusPill({ value }: { value: string }) {
  const attention = value === "error" || value === "needs_configuration" || value === "past_due";
  const positive = value === "ready" || value === "active" || value === "trialing";
  return (
    <span className={`inline-flex border border-black px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.08em] ${attention ? "bg-black text-white" : positive ? "bg-[#f4f1e8]" : "text-black/50"}`}>
      {value.replaceAll("_", " ")}
    </span>
  );
}

function CostDashboardSection({ dashboard, error }: { dashboard: CostDashboard | null; error: string | null }) {
  if (error) {
    return (
      <section className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-900">
        Cost dashboard could not load: {error}
      </section>
    );
  }

  if (!dashboard) {
    return null;
  }

  return (
    <section className="border-2 border-black bg-white">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div className="px-5 pt-5 sm:px-6 sm:pt-6">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-black/45">Current month</p>
          <h2 className="mt-1 text-2xl font-black tracking-[-0.04em]">Cost by customer</h2>
          <p className="mt-2 text-sm font-semibold text-black/50">
            Estimates from captured calls, owner SMS status, and configurable provider rates. Not a final invoice.
          </p>
        </div>
        <p className="px-5 text-xs font-bold text-black/45 sm:px-6">
          {formatShortDate(dashboard.periodStart)} to {formatShortDate(dashboard.periodEnd)}
        </p>
      </div>

      <div className="mx-5 mt-5 grid border-l border-t border-black/15 sm:mx-6 sm:grid-cols-2 lg:grid-cols-4">
        <CostStat
          icon={<DollarSign className="h-5 w-5" />}
          label="Estimated spend"
          value={formatUsd(dashboard.totals.estimatedSpend)}
          detail={`${dashboard.totals.calls} calls this month`}
        />
        <CostStat
          icon={<PhoneCall className="h-5 w-5" />}
          label="Voice minutes"
          value={formatMinutes(dashboard.totals.minutes)}
          detail={`Estimated at ${formatUsd(dashboard.rates.retellVoicePerMinute)}/minute`}
        />
        <CostStat
          icon={<MessageSquareText className="h-5 w-5" />}
          label="Owner texts"
          value={String(dashboard.totals.ownerTextsSent)}
          detail={`${dashboard.totals.ownerTextsFailed} failed alerts tracked`}
        />
        <CostStat
          icon={<TrendingUp className="h-5 w-5" />}
          label="Cost per lead"
          value={dashboard.totals.costPerLead === null ? "No leads" : formatUsd(dashboard.totals.costPerLead)}
          detail={`${dashboard.totals.leads} countable leads`}
        />
      </div>

      <div className="mt-6 border-t-2 border-black">
          {dashboard.clients.length === 0 ? (
            <p className="px-5 py-6 text-sm font-semibold text-black/50">No customer workspaces yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-left text-sm">
                <thead className="border-b border-black/20 bg-[#f4f1e8] font-mono text-[9px] uppercase tracking-[0.1em] text-black/50">
                  <tr>
                    <th className="px-5 py-3 font-bold">Customer</th>
                    <th className="px-4 py-3 font-bold">Calls</th>
                    <th className="px-4 py-3 font-bold">Minutes</th>
                    <th className="px-4 py-3 font-bold">Texts</th>
                    <th className="px-4 py-3 font-bold">Voice</th>
                    <th className="px-4 py-3 font-bold">Messaging</th>
                    <th className="px-4 py-3 font-bold">Number</th>
                    <th className="px-5 py-3 text-right font-bold">Estimated total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/15">
                  {dashboard.clients.map((client) => (
                    <tr key={client.clientId}>
                      <td className="px-5 py-4 font-black">{client.businessName}</td>
                      <td className="px-4 py-4 tabular-nums text-black/60">{client.calls}</td>
                      <td className="px-4 py-4 tabular-nums text-black/60">{formatMinutes(client.minutes)}</td>
                      <td className="px-4 py-4 tabular-nums text-black/60">{client.ownerTextsSent}</td>
                      <td className="px-4 py-4 tabular-nums text-black/60">{formatUsd(client.voiceSpend)}</td>
                      <td className="px-4 py-4 tabular-nums text-black/60">{formatUsd(client.messagingSpend)}</td>
                      <td className="px-4 py-4 tabular-nums text-black/60">{formatUsd(client.phoneNumberSpend)}</td>
                      <td className="px-5 py-4 text-right text-base font-black tabular-nums">{formatUsd(client.estimatedSpend)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        <details className="border-t-2 border-black px-5 py-4 sm:px-6">
          <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-black"><Calculator className="h-4 w-4" aria-hidden="true" />Provider line items</summary>
          <div className="mt-4 grid border-l border-t border-black/15 sm:grid-cols-2 lg:grid-cols-3">
            {dashboard.lines.map((line) => (
              <div key={line.label} className="border-b border-r border-black/15 p-4">
                <p className="text-sm font-black">{line.label}</p>
                <p className="mt-1 text-xs leading-5 text-black/45">{line.detail}</p>
                <p className="mt-3 text-lg font-black tabular-nums">{formatUsd(line.amount)}</p>
              </div>
            ))}
          </div>
        </details>
      </div>
    </section>
  );
}

function CostStat({
  icon,
  label,
  value,
  detail
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="border-b border-r border-black/15 p-4">
      <div className="flex items-center gap-2 text-black/45">{icon}<p className="text-xs font-bold">{label}</p></div>
      <p className="mt-3 text-2xl font-black tabular-nums tracking-[-0.04em]">{value}</p>
      <p className="mt-1 text-[11px] font-semibold text-black/40">{detail}</p>
    </div>
  );
}

function formatUsd(value: number, maximumFractionDigits = 2): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits
  }).format(value);
}

function formatMinutes(value: number): string {
  return `${value.toFixed(value >= 10 ? 1 : 2)}m`;
}

function formatShortDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric"
  }).format(new Date(value));
}

function AdminNotice({ created, updated, deleted, error }: { created: string | null; updated: string | null; deleted: string | null; error: string | null }) {
  const message = deleted ? "Customer deleted." : updated ? "Customer updated." : created ? "Customer added." : error === "client-connected" ? "That customer still has a Retell number connected. Remove it before deleting the customer." : error === "client-missing" ? "That customer no longer exists." : error === "test-phone" ? "Enter a valid phone number for the protected test business." : "Please complete the required fields.";
  const isError = Boolean(error);
  return <div className={`border-2 border-black px-4 py-3 text-sm font-black ${isError ? "bg-black text-white" : "bg-white"}`}>{message}</div>;
}

function SelectField({ label, name, value, options }: { label: string; name: string; value: string; options: string[] }) {
  return <label className="block text-xs font-black">{label}<select className="mt-1 min-h-10 w-full border-2 border-black bg-white px-2 font-normal" name={name} defaultValue={value}>{options.map((option) => <option key={option} value={option}>{option.replaceAll("_", " ")}</option>)}</select></label>;
}

function Field({
  label,
  name,
  type = "text",
  required = false,
  placeholder,
  step,
  defaultValue
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  step?: string;
  defaultValue?: string;
}) {
  return (
    <label className="block text-sm font-medium text-neutral-800">
      {label}
      <input
        className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 font-normal outline-none focus:border-neutral-950"
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        step={step}
        defaultValue={defaultValue}
      />
    </label>
  );
}
