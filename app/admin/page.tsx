import { Calculator, DollarSign, ExternalLink, LogOut, MessageSquareText, PhoneCall, Plus, ShieldCheck, TrendingUp } from "lucide-react";
import { cookies } from "next/headers";
import Link from "next/link";
import { addClientAction, loginAction, logoutAction } from "../actions";
import { adminCookie, verifyAdminSessionToken } from "@/lib/admin";
import { loadCostDashboard, type CostDashboard } from "@/lib/costs";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import type { Client } from "@/lib/types";

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

  const [{ clients, error: loadError }, { dashboard, error: costError }] = await Promise.all([loadClients(), loadCosts()]);

  return (
    <main className="min-h-screen">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <div>
            <p className="text-sm font-medium text-red-700">Pilot admin</p>
            <h1 className="text-2xl font-semibold tracking-normal">Raleigh Lead Recovery</h1>
          </div>
          <form action={logoutAction}>
            <button className="inline-flex items-center gap-2 rounded border border-neutral-300 px-3 py-2 text-sm font-medium" type="submit">
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Sign out
            </button>
          </form>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 pt-6">
        <CostDashboardSection dashboard={dashboard} error={costError} />
      </div>

      <div className="mx-auto grid max-w-6xl gap-6 px-5 py-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Clients</h2>
            {created ? <span className="rounded bg-emerald-100 px-2 py-1 text-sm text-emerald-900">Client added</span> : null}
          </div>

          {loadError ? (
            <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-900">{loadError}</div>
          ) : clients.length === 0 ? (
            <div className="rounded border border-neutral-200 bg-white p-5 text-sm text-neutral-600">No clients yet. Add the demo client or run the seed script.</div>
          ) : (
            <div className="overflow-hidden rounded border border-neutral-200 bg-white">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead className="bg-neutral-100 text-neutral-700">
                  <tr>
                    <th className="px-4 py-3 font-medium">Business</th>
                    <th className="px-4 py-3 font-medium">Trade</th>
                    <th className="px-4 py-3 font-medium">Owner</th>
                    <th className="px-4 py-3 font-medium">Pilot</th>
                    <th className="px-4 py-3 font-medium">Report</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {clients.map((client) => (
                    <tr key={client.id}>
                      <td className="px-4 py-3 font-medium">{client.business_name}</td>
                      <td className="px-4 py-3 text-neutral-700">{client.trade}</td>
                      <td className="px-4 py-3 text-neutral-700">{client.owner_name}</td>
                      <td className="px-4 py-3 text-neutral-700">
                        {client.pilot_start} to {client.pilot_end}
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
