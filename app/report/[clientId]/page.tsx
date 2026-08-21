import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { AlertTriangle, Clock3, PhoneCall, TrendingUp } from "lucide-react";
import { isDemoReport, isVisibleDemoCall, resolveReportClientId } from "@/lib/demo-report";
import { buildReportModel, formatCurrency, formatRelativeTime } from "@/lib/report";
import { loadClientReport } from "@/lib/supabase-server";
import type { ReportCall } from "@/lib/report";
import { adminCookie, verifyAdminSessionToken } from "@/lib/admin";
import { getSupabaseAuth, isSupabaseAuthConfigured } from "@/lib/supabase-auth";
import { recordingPlaybackPath } from "@/lib/recording";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ clientId: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Raleigh Lead Recovery Report",
    robots: {
      index: false,
      follow: false
    }
  };
}

export default async function ReportPage({ params }: PageProps) {
  const { clientId: reportParam } = await params;
  const clientId = resolveReportClientId(reportParam);
  const data = await loadClientReport(clientId);

  if (!data) {
    notFound();
  }

  const isExampleReport = isDemoReport(reportParam, clientId);
  if (!isExampleReport && !(await canViewPrivateReport(data.client.user_id))) {
    notFound();
  }
  const calls = isExampleReport ? data.calls.filter(isVisibleDemoCall) : data.calls;
  const report = buildReportModel(data.client, calls);

  return (
    <main className="min-h-screen bg-[#f6f7f4]">
      <section className="border-b border-neutral-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-6 px-5 py-8 md:grid-cols-[1.2fr_0.8fr] md:items-end">
          <div>
            <p className="mb-3 inline-flex rounded bg-red-100 px-2 py-1 text-sm font-medium text-red-800">
              {isExampleReport ? "Example missed-call report" : "7-day missed call pilot"}
            </p>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-normal text-neutral-950 md:text-5xl">
              {isExampleReport ? `Example report: what ${report.client.business_name} was missing.` : `${report.client.business_name}, here is what you were missing.`}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-neutral-700">
              {isExampleReport
                ? "Sample missed calls from a 7-day audit. Customer details are masked, but the plumbing issues, urgency, and value bands show what the owner would receive."
                : "Calls answered after the line was busy or no one could pick up. Numbers are masked here; full callback details go by owner SMS."}
            </p>
          </div>
          <div className="rounded border border-neutral-200 bg-neutral-950 p-5 text-white shadow-sm">
            <p className="text-sm font-medium text-neutral-300">Estimated job value captured</p>
            <p className="mt-2 text-5xl font-semibold tracking-normal">{formatCurrency(report.estimatedJobValueCaptured)}</p>
            <p className="mt-3 text-sm text-neutral-300">Pipeline value from captured job details, not closed revenue.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-3 px-5 py-6 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={<PhoneCall className="h-5 w-5" />} label="Calls answered" value={String(report.totalCalls)} />
        <Stat icon={<AlertTriangle className="h-5 w-5" />} label="Emergencies caught" value={String(report.emergenciesCaught)} tone="red" />
        <Stat icon={<TrendingUp className="h-5 w-5" />} label="Leads captured" value={String(report.leadsCaptured)} tone="green" />
        <Stat icon={<Clock3 className="h-5 w-5" />} label="Answer speed" value="First ring after forwarding" />
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-10">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-normal">Captured calls</h2>
            <p className="mt-1 text-sm text-neutral-600">Newest first. Addresses are shortened for shareable reporting.</p>
          </div>
        </div>

        {report.calls.length === 0 ? (
          <div className="rounded border border-neutral-200 bg-white p-6 text-neutral-700">
            No calls yet. Run the seed script or complete a Retell call.
          </div>
        ) : (
          <div className="grid gap-3">
            {report.calls.map((call) => (
              <TimelineItem key={call.id} call={call} showRecording={!isExampleReport} />
            ))}
          </div>
        )}
      </section>

      <footer className="border-t border-neutral-200 bg-white">
        <div className="mx-auto max-w-6xl px-5 py-6">
          <p className="text-xl font-semibold tracking-normal">Every one of these would have hit voicemail.</p>
        </div>
      </footer>
    </main>
  );
}

async function canViewPrivateReport(ownerUserId: string | null | undefined): Promise<boolean> {
  const cookieStore = await cookies();
  if (verifyAdminSessionToken(cookieStore.get(adminCookie.name)?.value)) return true;
  if (!ownerUserId || !isSupabaseAuthConfigured()) return false;
  const auth = await getSupabaseAuth();
  const { data: { user } } = await auth.auth.getUser();
  return user?.id === ownerUserId;
}

function Stat({
  icon,
  label,
  value,
  tone = "neutral"
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: "neutral" | "red" | "green";
}) {
  const toneClass =
    tone === "red" ? "bg-red-100 text-red-800" : tone === "green" ? "bg-emerald-100 text-emerald-800" : "bg-neutral-100 text-neutral-800";

  return (
    <div className="rounded border border-neutral-200 bg-white p-4 shadow-sm">
      <div className={`mb-4 flex h-9 w-9 items-center justify-center rounded ${toneClass}`}>{icon}</div>
      <p className="text-sm text-neutral-600">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-normal text-neutral-950">{value}</p>
    </div>
  );
}

function TimelineItem({ call, showRecording }: { call: ReportCall; showRecording: boolean }) {
  const recordingUrl = showRecording && call.recording_url
    ? recordingPlaybackPath("calls", call.id)
    : null;

  return (
    <article className="rounded border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <UrgencyBadge urgency={call.urgency} />
            <span className="text-sm text-neutral-500">{formatRelativeTime(call.created_at)}</span>
            <span className="text-sm text-neutral-500">{call.locationLabel}</span>
          </div>
          <h3 className="text-lg font-semibold tracking-normal">{formatCallerName(call.caller_name)}</h3>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-neutral-700">{call.issue_description ?? call.summary ?? "Plumbing issue captured."}</p>
          <p className="mt-2 text-sm text-neutral-600">Callback: {call.maskedCallbackNumber}</p>
        </div>
        <div className="shrink-0 text-left md:text-right">
          <p className="text-sm text-neutral-500">Value band</p>
          <p className="font-semibold">{formatValueBand(call.estimated_value_band)}</p>
          <p className="text-sm text-neutral-600">{formatCurrency(call.estimatedValue)}</p>
        </div>
      </div>

      {(recordingUrl || call.summary || call.transcript) ? (
        <details className="mt-4 border-t border-neutral-200 pt-3">
          <summary className="text-sm font-medium text-neutral-900">Recording, summary, and transcript</summary>
          {recordingUrl ? (
            <div className="mt-3 rounded bg-neutral-100 p-3">
              <p className="text-sm font-medium text-neutral-900">Call recording</p>
              <audio className="mt-2 w-full" controls preload="none" src={recordingUrl}>
                <a className="font-medium underline" href={recordingUrl}>
                  Open call recording
                </a>
              </audio>
            </div>
          ) : null}
          {call.summary ? <p className="mt-3 text-sm leading-6 text-neutral-700">{call.summary}</p> : null}
          {call.transcript ? <pre className="mt-3 whitespace-pre-wrap rounded bg-neutral-100 p-3 text-sm leading-6 text-neutral-800">{call.transcript}</pre> : null}
        </details>
      ) : null}
    </article>
  );
}

function UrgencyBadge({ urgency }: { urgency: ReportCall["urgency"] }) {
  const className =
    urgency === "emergency"
      ? "bg-red-100 text-red-800"
      : urgency === "urgent"
        ? "bg-amber-100 text-amber-900"
        : urgency === "spam"
          ? "bg-neutral-200 text-neutral-600"
          : urgency === "other"
            ? "bg-blue-100 text-blue-800"
        : "bg-neutral-100 text-neutral-700";

  return <span className={`rounded px-2 py-1 text-xs font-semibold uppercase tracking-normal ${className}`}>{formatUrgency(urgency)}</span>;
}

function formatCallerName(name: string | null): string {
  if (!name || name.trim().toLowerCase() === "unknown") {
    return "Lead details captured";
  }

  return name;
}

function formatValueBand(valueBand: ReportCall["estimated_value_band"]): string {
  switch (valueBand) {
    case "under_300":
      return "Under $300";
    case "300_800":
      return "$300-$800";
    case "800_2000":
      return "$800-$2,000";
    case "over_2000":
      return "Over $2,000";
    case "unknown":
      return "Needs review";
  }
}

function formatUrgency(urgency: ReportCall["urgency"]): string {
  switch (urgency) {
    case "emergency":
      return "Emergency";
    case "urgent":
      return "Urgent";
    case "standard":
      return "Standard";
    case "spam":
      return "Filtered";
    case "other":
      return "Follow-up";
  }
}
