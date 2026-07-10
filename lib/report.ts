import type { Call, Client, LeadType, Urgency, ValueBand } from "./types";

export const valueBandMidpoints: Record<ValueBand, number | "avg_job_value"> = {
  under_300: 150,
  "300_800": 550,
  "800_2000": 1400,
  over_2000: 3000,
  unknown: "avg_job_value"
};

export type ReportCall = Call & {
  maskedCallbackNumber: string;
  locationLabel: string;
  estimatedValue: number;
};

export type ReportModel = {
  client: Client;
  calls: ReportCall[];
  totalCalls: number;
  leadsCaptured: number;
  emergenciesCaught: number;
  countByUrgency: Record<Urgency, number>;
  estimatedJobValueCaptured: number;
};

export function isCountableLead(leadType: LeadType): boolean {
  return leadType !== "spam" && leadType !== "complaint";
}

export function estimateCallValue(call: Pick<Call, "lead_type" | "estimated_value_band">, client: Pick<Client, "avg_job_value">): number {
  if (!isCountableLead(call.lead_type)) {
    return 0;
  }

  const midpoint = valueBandMidpoints[call.estimated_value_band];
  return midpoint === "avg_job_value" ? Number(client.avg_job_value) : midpoint;
}

export function buildReportModel(client: Client, calls: Call[]): ReportModel {
  const countByUrgency = {
    emergency: 0,
    urgent: 0,
    standard: 0,
    spam: 0,
    other: 0
  } satisfies Record<Urgency, number>;

  const reportCalls = calls.map((call) => {
    countByUrgency[call.urgency] += 1;

    return {
      ...call,
      maskedCallbackNumber: maskPhoneNumber(call.callback_number ?? call.caller_number),
      locationLabel: summarizeAddress(call.service_address),
      estimatedValue: estimateCallValue(call, client)
    };
  });

  return {
    client,
    calls: reportCalls,
    totalCalls: calls.length,
    leadsCaptured: calls.filter((call) => call.lead_type !== "spam").length,
    emergenciesCaught: calls.filter((call) => call.urgency === "emergency" && call.lead_type !== "spam").length,
    countByUrgency,
    estimatedJobValueCaptured: reportCalls.reduce((sum, call) => sum + call.estimatedValue, 0)
  };
}

export function maskPhoneNumber(phone: string | null | undefined): string {
  if (!phone) {
    return "Number captured";
  }

  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) {
    return "***";
  }

  const localDigits = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
  const lastFour = localDigits.slice(-4);
  const area = localDigits.length >= 10 ? localDigits.slice(0, 3) : "***";

  return `(${area}) ***-${lastFour}`;
}

export function summarizeAddress(address: string | null | undefined): string {
  if (!address?.trim()) {
    return "Address captured";
  }

  const street = address.split(",")[0]?.trim() ?? address.trim();
  const withoutHouseNumber = street.replace(/^\d+[A-Za-z]?\s+/, "").trim();

  if (!withoutHouseNumber) {
    return "Address captured";
  }

  return `${withoutHouseNumber.slice(0, 48)}${withoutHouseNumber.length > 48 ? "..." : ""}`;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

export function formatRelativeTime(isoDate: string, now = new Date()): string {
  const created = new Date(isoDate);
  const diffMs = now.getTime() - created.getTime();
  const minutes = Math.max(0, Math.round(diffMs / 60000));

  if (minutes < 60) {
    return `${minutes || 1}m ago`;
  }

  const hours = Math.round(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.round(hours / 24);
  return `${days}d ago`;
}
