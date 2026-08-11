import { Activity, Calculator, Check, CircleAlert, DollarSign, ExternalLink, Inbox, LogOut, Mail, MessageSquareText, PhoneCall, Plus, Server, ShieldCheck, TrendingUp } from "lucide-react";
import { cookies } from "next/headers";
import Link from "next/link";
import { addClientAction, loginAction, logoutAction } from "../actions";
import { adminCookie, verifyAdminSessionToken } from "@/lib/admin";
import { loadCostDashboard, type CostDashboard } from "@/lib/costs";
import { buildCustomerSnapshot, buildIntegrationStatuses, buildTrialForecast, type CustomerSnapshot, type IntegrationStatus, type TrialForecast } from "@/lib/operations";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import type { Client, PilotRequest } from "@/lib/types";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  return verifyAdminSessionToken(cookieStore.get(adminCookie.name)?.value);
}

async function loadClients(): Promise<{ clients: Client[]; error: string | null }> {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from("clients").select("*").order("created_at", { ascending: false });

    if (error) {
      return { clients: [], error: error.message };
    }

    return { clients: (data ?? []) as Client[], error: null };
  } catch (error) {
    return {
      clients: [],
      error: error instanceof Error ? error.message : "Unknown Supabase error"
    };
  }
}

async function loadPilotRequests(): Promise<{ requests: PilotRequest[]; error: string | null }> {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from("pilot_requests").select("*").order("created_at", { ascending: false }).limit(12);

    if (error) {
      return { requests: [], error: error.message };
    }

    return { requests: (data ?? []) as PilotRequest[], error: null };
  } catch (error) {
    return {
      requests: [],
      error: error instanceof Error ? error.message : "Unknown Supabase error"
    };
  }
}

async function loadCosts(): Promise<{ dashboard: CostDashboard | null; error: string | null }> {
  try {
    return { dashboard: await loadCostDashboard(), error: null };
  } catch (error) {
    return {
      dashboard: null,
      error: error instanceof Error ? error.message : "Unknown cost dashboard error"
    };
  }
}

export default async function AdminPage({ searchParams }: PageProps) {
  const authenticated = await isAuthenticated();
  const search = (await searchParams) ?? {};
  const error = typeof search.error === "string" ? search.error : null;
  const created = search.created === "1";

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

  const [{ clients, error: loadError }, { requests, error: requestsError }, { dashboard, error: costError }] = await Promise.all([
    loadClients(),
    loadPilotRequests(),
    loadCosts()
  ]);
  const customerSnapshot = buildCustomerSnapshot(clients);
  const integrations = buildIntegrationStatuses(process.env, !loadError, clients);
  const trialForecast = buildTrialForecast();

  return (
    <main className="min-h-screen bg-[#f4f1e8] text-black">
      <header className="border-b-2 border-black bg-[#f4f1e8]">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-5 sm:px-8">
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-black/45">Founder operations</p>
            <h1 className="mt-1 text-2xl font-black tracking-[-0.04em]">Mabel control room</h1>
          </div>
          <form action={logoutAction}>
            <button className="inline-flex h-10 items-center gap-2 border-2 border-black px-3 text-sm font-extrabold hover:bg-black hover:text-white" type="submit">
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Sign out
            </button>
          </form>
        </div>
      </header>

      <div className="mx-auto max-w-[1440px] px-5 pt-8 sm:px-8">
        <OperationsOverview customers={customerSnapshot} integrations={integrations} forecast={trialForecast} />
      </div>

      <div className="mx-auto max-w-[1440px] px-5 pt-8 sm:px-8">
        <CostDashboardSection dashboard={dashboard} error={costError} />
      </div>

      <div className="mx-auto max-w-[1440px] px-5 pt-8 sm:px-8">
        <AuditRequestsSection requests={requests} error={requestsError} />
      </div>

      <div className="mx-auto grid max-w-[1440px] gap-6 px-5 py-8 sm:px-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="min-w-0">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-black/45">Customer ledger</p>
              <h2 className="mt-1 text-2xl font-black tracking-[-0.04em]">Customers</h2>
            </div>
            {created ? <span className="rounded bg-emerald-100 px-2 py-1 text-sm text-emerald-900">Client added</span> : null}
          </div>

          {loadError ? (
            <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-900">{loadError}</div>
          ) : clients.length === 0 ? (
            <div className="rounded border border-neutral-200 bg-white p-5 text-sm text-neutral-600">No clients yet. Add the demo client or run the seed script.</div>
          ) : (
            <div className="overflow-x-auto border-2 border-black bg-white">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="border-b-2 border-black bg-[#f4f1e8] font-mono text-[9px] uppercase tracking-[0.12em] text-black/50">
                  <tr>
                    <th className="px-4 py-3 font-bold">Business</th>
                    <th className="px-4 py-3 font-bold">Account</th>
                    <th className="px-4 py-3 font-bold">Setup</th>
                    <th className="px-4 py-3 font-bold">Owner</th>
                    <th className="px-4 py-3 font-bold">Trial / pilot</th>
                    <th className="px-4 py-3 font-bold">Report</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/15">
                  {clients.map((client) => (
                    <tr key={client.id}>
                      <td className="px-4 py-3">
                        <p className="font-black">{client.business_name}</p>
                        <p className="mt-1 text-xs font-semibold text-black/45">{client.trade}</p>
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Plus className="h-5 w-5 text-red-700" aria-hidden="true" />
            <h2 className="text-lg font-semibold">Add client</h2>
          </div>

          {error === "client" ? <p className="mb-4 text-sm text-red-700">Business, trade, owner, and phone are required.</p> : null}

          <form action={addClientAction} className="grid gap-3">
            <Field label="Business name" name="business_name" required />
            <Field label="Trade" name="trade" placeholder="plumbing" required />
            <Field label="Owner name" name="owner_name" required />
            <Field label="Owner phone" name="owner_phone" placeholder="+19195550123" required />
            <Field label="Owner email" name="owner_email" type="email" />
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Pilot start" name="pilot_start" type="date" />
              <Field label="Pilot end" name="pilot_end" type="date" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Avg job value" name="avg_job_value" type="number" placeholder="500" />
              <Field label="Close rate" name="close_rate" type="number" step="0.01" placeholder="0.4" />
            </div>
            <Field label="Vapi assistant ID" name="vapi_assistant_id" />
            <Field label="Vapi phone number ID" name="vapi_phone_number_id" />
            <button className="mt-2 rounded bg-neutral-950 px-4 py-2 font-medium text-white" type="submit">
              Add client
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}

function OperationsOverview({
  customers,
  integrations,
  forecast
}: {
  customers: CustomerSnapshot;
  integrations: IntegrationStatus[];
  forecast: TrialForecast;
}) {
  return (
    <section>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-black/45">Today&apos;s operating picture</p>
          <h2 className="mt-3 text-4xl font-black tracking-[-0.055em] sm:text-5xl">Know the runway before you fill it.</h2>
          <p className="mt-4 max-w-2xl text-sm font-semibold leading-6 text-black/55">
            Customer counts are live. Provider spend is estimated from captured usage and the rates below, so it is a planning ledger—not an invoice.
          </p>
        </div>
        <div className="border-2 border-black bg-black px-5 py-4 text-white lg:text-right">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-white/50">Conservative cost / activated trial</p>
          <p className="mt-2 text-4xl font-black tabular-nums tracking-[-0.06em]">{formatUsd(forecast.perTrial.total)}</p>
          <p className="mt-1 text-xs font-bold text-white/55">{forecast.assumptions.callsPerTrial} calls · {formatMinutes(forecast.assumptions.minutesPerTrial)} · {forecast.assumptions.trialDays} days</p>
        </div>
      </div>

      <div className="mt-8 grid border-l-2 border-t-2 border-black sm:grid-cols-2 xl:grid-cols-6">
        <OperationsMetric label="Customers" value={String(customers.total)} detail="all workspaces" />
        <OperationsMetric label="Onboarding" value={String(customers.onboarding)} detail="not live yet" />
        <OperationsMetric label="Free trials" value={String(customers.trialing)} detail="currently running" />
        <OperationsMetric label="Active" value={String(customers.active)} detail="paying status" />
        <OperationsMetric label="Mabel ready" value={String(customers.ready)} detail="provisioned" />
        <OperationsMetric label="Needs attention" value={String(customers.attention)} detail={customers.expiringSoon ? `${customers.expiringSoon} trial ending soon` : "setup errors"} alert={customers.attention > 0} />
      </div>

      <div className="mt-6 grid min-w-0 grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <section className="min-w-0 border-2 border-black bg-white">
          <div className="flex items-center justify-between border-b-2 border-black px-5 py-4">
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-black/45">System map</p>
              <h3 className="mt-1 text-xl font-black tracking-[-0.035em]">Connected tools</h3>
            </div>
            <Server className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="divide-y-2 divide-black">
            {integrations.map((integration) => (
              <div className="grid gap-3 px-5 py-4 sm:grid-cols-[1fr_auto] sm:items-center" key={integration.name}>
                <div>
                  <div className="flex items-center gap-2">
                    <IntegrationMark status={integration.status} />
                    <p className="font-black">{integration.name}</p>
                  </div>
                  <p className="mt-1 text-xs font-bold text-black/45">{integration.purpose}</p>
                  <p className="mt-2 text-sm font-semibold leading-5 text-black/65">{integration.detail}</p>
                </div>
                <span className={`w-fit border border-black px-2 py-1 font-mono text-[9px] font-bold uppercase ${integration.status === "connected" ? "bg-black text-white" : integration.status === "attention" ? "bg-[#f4f1e8]" : "text-black/45"}`}>
                  {integration.status.replace("_", " ")}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="min-w-0 border-2 border-black bg-white">
          <div className="border-b-2 border-black px-5 py-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-black/45">Trial runway</p>
                <h3 className="mt-1 text-xl font-black tracking-[-0.035em]">What free HVAC trials cost</h3>
              </div>
              <Activity className="h-5 w-5" aria-hidden="true" />
            </div>
            <p className="mt-3 text-xs font-semibold leading-5 text-black/50">
              Includes {formatUsd(forecast.assumptions.fixedMonthlyBaseline, 0)}/month for production Vercel + Supabase, plus one verification, a prorated phone number, voice AI, model allowance, transport, and owner alerts.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="border-b border-black/20 bg-[#f4f1e8] font-mono text-[9px] uppercase tracking-[0.12em] text-black/50">
                <tr>
                  <th className="px-5 py-3 font-bold">Trials</th>
                  <th className="px-5 py-3 font-bold">Usage cost</th>
                  <th className="px-5 py-3 font-bold">+ platform baseline</th>
                  <th className="px-5 py-3 font-bold">Per trial</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/15">
                {forecast.scenarios.map((scenario) => (
                  <tr key={scenario.trials}>
                    <td className="px-5 py-4 text-xl font-black tabular-nums">{scenario.trials}</td>
                    <td className="px-5 py-4 font-bold tabular-nums">{formatUsd(scenario.variableCost)}</td>
                    <td className="px-5 py-4 font-black tabular-nums">{formatUsd(scenario.totalWithBaseline)}</td>
                    <td className="px-5 py-4 text-black/55 tabular-nums">{formatUsd(scenario.totalWithBaseline / scenario.trials)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <details className="border-t-2 border-black px-5 py-4">
            <summary className="text-sm font-black">Per-trial cost recipe</summary>
            <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-xs sm:grid-cols-3">
              <CostRecipe label="Vapi" value={forecast.perTrial.voiceAi} />
              <CostRecipe label="Model/STT/TTS" value={forecast.perTrial.modelAllowance} />
              <CostRecipe label="Voice transport" value={forecast.perTrial.voiceTransport} />
              <CostRecipe label="Owner alerts" value={forecast.perTrial.ownerAlerts} />
              <CostRecipe label="Signup code" value={forecast.perTrial.signupVerification} />
              <CostRecipe label="Phone number" value={forecast.perTrial.phoneNumber} />
            </dl>
          </details>
        </section>
      </div>
    </section>
  );
}

function OperationsMetric({ label, value, detail, alert = false }: { label: string; value: string; detail: string; alert?: boolean }) {
  return (
    <div className={`border-b-2 border-r-2 border-black p-5 ${alert ? "bg-black text-white" : "bg-white"}`}>
      <p className={`font-mono text-[9px] font-bold uppercase tracking-[0.14em] ${alert ? "text-white/50" : "text-black/45"}`}>{label}</p>
      <p className="mt-4 text-3xl font-black tabular-nums tracking-[-0.055em]">{value}</p>
      <p className={`mt-2 text-xs font-semibold ${alert ? "text-white/45" : "text-black/40"}`}>{detail}</p>
    </div>
  );
}

function IntegrationMark({ status }: { status: IntegrationStatus["status"] }) {
  if (status === "connected") return <span className="grid h-5 w-5 place-items-center rounded-full bg-black text-white"><Check className="h-3 w-3" /></span>;
  if (status === "attention") return <CircleAlert className="h-5 w-5" aria-hidden="true" />;
  return <span className="h-5 w-5 rounded-full border-2 border-black/35" />;
}

function CostRecipe({ label, value }: { label: string; value: number }) {
  return <div><dt className="font-bold text-black/45">{label}</dt><dd className="mt-1 text-base font-black tabular-nums">{formatUsd(value)}</dd></div>;
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

function AuditRequestsSection({ requests, error }: { requests: PilotRequest[]; error: string | null }) {
  if (error) {
    return (
      <section className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-900">
        Audit requests could not load: {error}
      </section>
    );
  }

  return (
    <section className="rounded border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-red-700">Landing page</p>
          <h2 className="text-2xl font-semibold tracking-normal">Audit requests</h2>
          <p className="mt-1 text-sm text-neutral-600">Newest free-audit form submissions from the public site.</p>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded bg-neutral-100 px-3 py-2 text-sm font-medium text-neutral-700">
          <Inbox className="h-4 w-4" aria-hidden="true" />
          {requests.length} recent
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="mt-5 rounded border border-dashed border-neutral-300 bg-neutral-50 p-5 text-sm text-neutral-600">
          No audit requests yet.
        </div>
      ) : (
        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          {requests.map((request) => (
            <article key={request.id} className="rounded border border-neutral-200 bg-neutral-50 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-lg font-semibold tracking-normal text-neutral-950">{request.business_name}</h3>
                  <p className="mt-1 text-sm text-neutral-600">
                    {request.owner_name} - {request.service_area}
                  </p>
                </div>
                <p className="shrink-0 text-sm text-neutral-500">{formatDateTime(request.created_at)}</p>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <a className="inline-flex items-center gap-1 rounded border border-neutral-300 bg-white px-2.5 py-1.5 text-sm font-medium" href={`tel:${request.owner_phone}`}>
                  <PhoneCall className="h-3.5 w-3.5" aria-hidden="true" />
                  {request.owner_phone}
                </a>
                <a className="inline-flex items-center gap-1 rounded border border-neutral-300 bg-white px-2.5 py-1.5 text-sm font-medium" href={`sms:${request.owner_phone}`}>
                  <MessageSquareText className="h-3.5 w-3.5" aria-hidden="true" />
                  Text
                </a>
                {request.owner_email ? (
                  <a className="inline-flex items-center gap-1 rounded border border-neutral-300 bg-white px-2.5 py-1.5 text-sm font-medium" href={`mailto:${request.owner_email}`}>
                    <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                    Email
                  </a>
                ) : null}
              </div>

              {request.notes ? <p className="mt-4 text-sm leading-6 text-neutral-700">{request.notes}</p> : null}

              <dl className="mt-4 grid gap-2 text-xs text-neutral-500 sm:grid-cols-2">
                <div>
                  <dt className="font-medium text-neutral-700">Source</dt>
                  <dd>{request.source}</dd>
                </div>
                {request.website ? (
                  <div>
                    <dt className="font-medium text-neutral-700">Website</dt>
                    <dd className="truncate">{request.website}</dd>
                  </div>
                ) : null}
              </dl>
            </article>
          ))}
        </div>
      )}
    </section>
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
    <section className="rounded border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-medium text-red-700">Current month</p>
          <h2 className="text-2xl font-semibold tracking-normal">Cost dashboard</h2>
          <p className="mt-1 text-sm text-neutral-600">
            Estimates from captured calls, owner SMS status, and configurable provider rates. Not a final invoice.
          </p>
        </div>
        <p className="text-sm text-neutral-500">
          {formatShortDate(dashboard.periodStart)} to {formatShortDate(dashboard.periodEnd)}
        </p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
          detail={`${dashboard.rates.vapiIncludedMinutes} Vapi min assumed included`}
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

      <div className="mt-5 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded border border-neutral-200">
          <div className="flex items-center gap-2 border-b border-neutral-200 bg-neutral-50 px-4 py-3">
            <Calculator className="h-4 w-4 text-red-700" aria-hidden="true" />
            <h3 className="font-semibold">Line items</h3>
          </div>
          <div className="divide-y divide-neutral-200">
            {dashboard.lines.map((line) => (
              <div key={line.label} className="grid gap-1 px-4 py-3 sm:grid-cols-[1fr_auto] sm:items-center">
                <div>
                  <p className="text-sm font-medium text-neutral-950">{line.label}</p>
                  <p className="text-xs leading-5 text-neutral-500">{line.detail}</p>
                </div>
                <p className="font-semibold text-neutral-950">{formatUsd(line.amount)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded border border-neutral-200">
          <div className="border-b border-neutral-200 bg-neutral-50 px-4 py-3">
            <h3 className="font-semibold">By client</h3>
          </div>
          {dashboard.clients.length === 0 ? (
            <p className="px-4 py-5 text-sm text-neutral-600">No calls captured this month yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-left text-sm">
                <thead className="text-neutral-600">
                  <tr>
                    <th className="px-4 py-3 font-medium">Client</th>
                    <th className="px-4 py-3 font-medium">Calls</th>
                    <th className="px-4 py-3 font-medium">Min</th>
                    <th className="px-4 py-3 font-medium">Texts</th>
                    <th className="px-4 py-3 font-medium">Spend</th>
                    <th className="px-4 py-3 font-medium">Pipeline</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {dashboard.clients.map((client) => (
                    <tr key={client.clientId}>
                      <td className="px-4 py-3 font-medium text-neutral-950">{client.businessName}</td>
                      <td className="px-4 py-3 text-neutral-700">{client.calls}</td>
                      <td className="px-4 py-3 text-neutral-700">{formatMinutes(client.minutes)}</td>
                      <td className="px-4 py-3 text-neutral-700">{client.ownerTextsSent}</td>
                      <td className="px-4 py-3 font-medium">{formatUsd(client.estimatedSpend)}</td>
                      <td className="px-4 py-3 text-neutral-700">{formatUsd(client.estimatedPipeline, 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
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
    <div className="rounded border border-neutral-200 bg-neutral-50 p-4">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded bg-neutral-950 text-white">{icon}</div>
      <p className="text-sm text-neutral-600">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-normal text-neutral-950">{value}</p>
      <p className="mt-1 text-xs text-neutral-500">{detail}</p>
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

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

function Field({
  label,
  name,
  type = "text",
  required = false,
  placeholder,
  step
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  step?: string;
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
      />
    </label>
  );
}
