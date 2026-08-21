import "server-only";

import { estimateCallValue, isCountableLead } from "./report";
import { getSupabaseAdmin } from "./supabase-server";
import type { Call, Client } from "./types";

type RateConfig = {
  vapiHostingPerMinute: number;
  vapiIncludedMinutes: number;
  modelProviderPerMinute: number;
  twilioLocalInboundPerMinute: number;
  twilioOutboundPerMinute: number;
  twilioSmsBasePerSegment: number;
  twilioSmsCarrierFeePerSegment: number;
  twilioFailedMessageFee: number;
  smsSegmentsPerAlert: number;
  phoneNumberMonthly: number;
  phoneNumberCount: number;
};

export type CostLine = {
  label: string;
  amount: number;
  detail: string;
};

export type ClientCostRow = {
  clientId: string;
  businessName: string;
  calls: number;
  leads: number;
  minutes: number;
  ownerTextsSent: number;
  voiceSpend: number;
  messagingSpend: number;
  phoneNumberSpend: number;
  estimatedSpend: number;
  estimatedPipeline: number;
};

export type CostDashboard = {
  periodStart: string;
  periodEnd: string;
  totals: {
    calls: number;
    leads: number;
    minutes: number;
    ownerTextsSent: number;
    ownerTextsFailed: number;
    estimatedPipeline: number;
    estimatedSpend: number;
    costPerLead: number | null;
  };
  rates: RateConfig;
  lines: CostLine[];
  clients: ClientCostRow[];
};

function envNumber(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw?.trim()) {
    return fallback;
  }

  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
}

function envNumberOptional(name: string): number | null {
  const raw = process.env[name];
  if (!raw?.trim()) {
    return null;
  }

  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function monthStart(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
}

function minutesFromSeconds(seconds: number): number {
  return seconds / 60;
}

function sum<T>(items: T[], selector: (item: T) => number): number {
  return items.reduce((total, item) => total + selector(item), 0);
}

function getPhoneNumberCount(clients: Client[]): number {
  const configured = envNumberOptional("COST_PHONE_NUMBER_COUNT");
  if (configured !== null) {
    return configured;
  }

  const vapiPhoneNumbers = new Set(clients.map((client) => client.vapi_phone_number_id).filter(Boolean));
  const twilioSenderCount = process.env.TWILIO_FROM_NUMBER ? 1 : 0;
  return vapiPhoneNumbers.size + twilioSenderCount;
}

function getRates(clients: Client[]): RateConfig {
  return {
    vapiHostingPerMinute: envNumber("COST_VAPI_HOSTING_PER_MIN", 0.05),
    vapiIncludedMinutes: envNumber("COST_VAPI_INCLUDED_MINUTES", 60),
    modelProviderPerMinute: envNumber("COST_MODEL_PROVIDER_PER_MIN", 0),
    twilioLocalInboundPerMinute: envNumber("COST_TWILIO_LOCAL_INBOUND_PER_MIN", 0.0085),
    twilioOutboundPerMinute: envNumber("COST_TWILIO_OUTBOUND_PER_MIN", 0.014),
    twilioSmsBasePerSegment: envNumber("COST_TWILIO_SMS_BASE_PER_SEGMENT", 0.0083),
    twilioSmsCarrierFeePerSegment: envNumber("COST_TWILIO_SMS_CARRIER_FEE_PER_SEGMENT", 0.0045),
    twilioFailedMessageFee: envNumber("COST_TWILIO_FAILED_MESSAGE_FEE", 0.001),
    smsSegmentsPerAlert: envNumber("COST_SMS_SEGMENTS_PER_ALERT", 2),
    phoneNumberMonthly: envNumber("COST_PHONE_NUMBER_MONTHLY", 1.15),
    phoneNumberCount: getPhoneNumberCount(clients)
  };
}

type ReactivationUsage = {
  client_id: string;
  vapi_call_id: string | null;
  status: string;
  outcome: string | null;
  duration_seconds: number | null;
  owner_alert_sent_at: string | null;
  error: string | null;
  created_at: string;
};

export function buildCostDashboard(clients: Client[], calls: Call[], now = new Date(), reactivationAttempts: ReactivationUsage[] = []): CostDashboard {
  const rates = getRates(clients);
  const periodStart = monthStart(now);
  const periodCalls = calls.filter((call) => new Date(call.created_at) >= periodStart && new Date(call.created_at) <= now);
  const periodAttempts = reactivationAttempts.filter((attempt) => new Date(attempt.created_at) >= periodStart && new Date(attempt.created_at) <= now && Boolean(attempt.vapi_call_id || attempt.duration_seconds));
  const clientById = new Map(clients.map((client) => [client.id, client]));

  const inboundMinutes = minutesFromSeconds(sum(periodCalls, (call) => Math.max(0, call.duration_seconds ?? 0)));
  const outboundMinutes = minutesFromSeconds(sum(periodAttempts, (attempt) => Math.max(0, attempt.duration_seconds ?? 0)));
  const minutes = inboundMinutes + outboundMinutes;
  const ownerTextsSent = periodCalls.filter((call) => call.sms_sent_at).length + periodAttempts.filter((attempt) => attempt.owner_alert_sent_at).length;
  const ownerTextsFailed = periodCalls.filter((call) => !call.sms_sent_at && call.sms_error).length + periodAttempts.filter((attempt) => !attempt.owner_alert_sent_at && attempt.error?.startsWith("Owner alert failed:")).length;
  const leads = periodCalls.filter((call) => isCountableLead(call.lead_type)).length;
  const estimatedPipeline = sum(periodCalls, (call) => {
    const client = clientById.get(call.client_id);
    return client ? estimateCallValue(call, client) : 0;
  });

  const vapiBillableMinutes = Math.max(0, minutes - rates.vapiIncludedMinutes);
  const vapiHosting = vapiBillableMinutes * rates.vapiHostingPerMinute;
  const modelProvider = minutes * rates.modelProviderPerMinute;
  const inboundVoiceTransport = inboundMinutes * rates.twilioLocalInboundPerMinute;
  const outboundVoiceTransport = outboundMinutes * rates.twilioOutboundPerMinute;
  const smsSegments = ownerTextsSent * rates.smsSegmentsPerAlert;
  const smsBase = smsSegments * rates.twilioSmsBasePerSegment;
  const smsCarrierFees = smsSegments * rates.twilioSmsCarrierFeePerSegment;
  const smsFailedFees = ownerTextsFailed * rates.twilioFailedMessageFee;
  const phoneNumbers = rates.phoneNumberCount * rates.phoneNumberMonthly;

  const lines: CostLine[] = [
    {
      label: "Vapi hosting",
      amount: vapiHosting,
      detail: `${vapiBillableMinutes.toFixed(1)} billable min after ${rates.vapiIncludedMinutes} included min`
    },
    {
      label: "Model/STT/TTS allowance",
      amount: modelProvider,
      detail: rates.modelProviderPerMinute > 0 ? `${minutes.toFixed(1)} min at configured provider rate` : "Set COST_MODEL_PROVIDER_PER_MIN when you know the pass-through rate"
    },
    {
      label: "Voice transport estimate",
      amount: inboundVoiceTransport + outboundVoiceTransport,
      detail: `${inboundMinutes.toFixed(1)} inbound min · ${outboundMinutes.toFixed(1)} outbound min`
    },
    {
      label: "Owner SMS base",
      amount: smsBase,
      detail: `${smsSegments} estimated segment${smsSegments === 1 ? "" : "s"} from ${ownerTextsSent} sent alert${ownerTextsSent === 1 ? "" : "s"}`
    },
    {
      label: "Owner SMS carrier fees",
      amount: smsCarrierFees,
      detail: `${smsSegments} estimated segment${smsSegments === 1 ? "" : "s"} using average carrier fee`
    },
    {
      label: "Failed SMS fees",
      amount: smsFailedFees,
      detail: `${ownerTextsFailed} failed owner alert${ownerTextsFailed === 1 ? "" : "s"}`
    },
    {
      label: "Phone numbers",
      amount: phoneNumbers,
      detail: `${rates.phoneNumberCount} active number${rates.phoneNumberCount === 1 ? "" : "s"} at monthly estimate`
    }
  ];

  const estimatedSpend = sum(lines, (line) => line.amount);
  const rowsByClient = new Map<string, ClientCostRow>(clients.map((client) => {
    const phoneNumberSpend = client.vapi_phone_number_id ? rates.phoneNumberMonthly : 0;
    return [client.id, {
      clientId: client.id,
      businessName: client.business_name,
      calls: 0,
      leads: 0,
      minutes: 0,
      ownerTextsSent: 0,
      voiceSpend: 0,
      messagingSpend: 0,
      phoneNumberSpend,
      estimatedSpend: phoneNumberSpend,
      estimatedPipeline: 0
    }];
  }));
  const vapiHostingPerUsedMinute = minutes > 0 ? vapiHosting / minutes : 0;
  for (const call of periodCalls) {
    const client = clientById.get(call.client_id);
    if (!client) {
      continue;
    }

    const row =
      rowsByClient.get(client.id) ??
      {
        clientId: client.id,
        businessName: client.business_name,
        calls: 0,
        leads: 0,
        minutes: 0,
        ownerTextsSent: 0,
        voiceSpend: 0,
        messagingSpend: 0,
        phoneNumberSpend: 0,
        estimatedSpend: 0,
        estimatedPipeline: 0
      };

    const callMinutes = minutesFromSeconds(Math.max(0, call.duration_seconds ?? 0));
    const smsSegmentsForCall = call.sms_sent_at ? rates.smsSegmentsPerAlert : 0;
    const voiceSpend = callMinutes * (vapiHostingPerUsedMinute + rates.modelProviderPerMinute + rates.twilioLocalInboundPerMinute);
    const messagingSpend = smsSegmentsForCall * (rates.twilioSmsBasePerSegment + rates.twilioSmsCarrierFeePerSegment) + (!call.sms_sent_at && call.sms_error ? rates.twilioFailedMessageFee : 0);

    row.calls += 1;
    row.leads += isCountableLead(call.lead_type) ? 1 : 0;
    row.minutes += callMinutes;
    row.ownerTextsSent += call.sms_sent_at ? 1 : 0;
    row.voiceSpend += voiceSpend;
    row.messagingSpend += messagingSpend;
    row.estimatedSpend += voiceSpend + messagingSpend;
    row.estimatedPipeline += estimateCallValue(call, client);

    rowsByClient.set(client.id, row);
  }

  for (const attempt of periodAttempts) {
    const row = rowsByClient.get(attempt.client_id);
    if (!row) continue;
    const attemptMinutes = minutesFromSeconds(Math.max(0, attempt.duration_seconds ?? 0));
    const smsSegmentsForAttempt = attempt.owner_alert_sent_at ? rates.smsSegmentsPerAlert : 0;
    const voiceSpend = attemptMinutes * (vapiHostingPerUsedMinute + rates.modelProviderPerMinute + rates.twilioOutboundPerMinute);
    const messagingSpend = smsSegmentsForAttempt * (rates.twilioSmsBasePerSegment + rates.twilioSmsCarrierFeePerSegment) + (!attempt.owner_alert_sent_at && attempt.error?.startsWith("Owner alert failed:") ? rates.twilioFailedMessageFee : 0);
    row.calls += 1;
    row.minutes += attemptMinutes;
    row.ownerTextsSent += attempt.owner_alert_sent_at ? 1 : 0;
    row.voiceSpend += voiceSpend;
    row.messagingSpend += messagingSpend;
    row.estimatedSpend += voiceSpend + messagingSpend;
  }

  const costPerLead = leads > 0 ? estimatedSpend / leads : null;

  return {
    periodStart: periodStart.toISOString(),
    periodEnd: now.toISOString(),
    totals: {
      calls: periodCalls.length + periodAttempts.length,
      leads,
      minutes,
      ownerTextsSent,
      ownerTextsFailed,
      estimatedPipeline,
      estimatedSpend,
      costPerLead
    },
    rates,
    lines,
    clients: [...rowsByClient.values()].sort((a, b) => b.estimatedSpend - a.estimatedSpend)
  };
}

export async function loadCostDashboard(now = new Date()): Promise<CostDashboard> {
  const supabase = getSupabaseAdmin();
  const start = monthStart(now).toISOString();
  const [{ data: clients, error: clientsError }, { data: calls, error: callsError }, { data: attempts, error: attemptsError }] = await Promise.all([
    supabase.from("clients").select("*"),
    supabase.from("calls").select("*").gte("created_at", start).order("created_at", { ascending: false }),
    supabase.from("reactivation_attempts").select("client_id,vapi_call_id,status,outcome,duration_seconds,owner_alert_sent_at,error,created_at").gte("created_at", start).order("created_at", { ascending: false })
  ]);

  if (clientsError) {
    throw clientsError;
  }
  if (callsError) {
    throw callsError;
  }
  if (attemptsError) {
    throw attemptsError;
  }

  return buildCostDashboard((clients ?? []) as Client[], (calls ?? []) as Call[], now, (attempts ?? []) as ReactivationUsage[]);
}
