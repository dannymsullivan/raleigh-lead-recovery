import "server-only";

import { estimateCallValue, isCountableLead } from "./report";
import { getSupabaseAdmin } from "./supabase-server";
import type { Call, Client } from "./types";

type RateConfig = {
  retellVoicePerMinute: number;
  retellSmsPerMessage: number;
  smsMessagesPerAlert: number;
  phoneNumberMonthly: number;
  phoneNumberCount: number;
};

export type CostLine = { label: string; amount: number; detail: string };
export type ClientCostRow = { clientId: string; businessName: string; calls: number; leads: number; minutes: number; ownerTextsSent: number; voiceSpend: number; messagingSpend: number; phoneNumberSpend: number; estimatedSpend: number; estimatedPipeline: number };
export type CostDashboard = {
  periodStart: string;
  periodEnd: string;
  totals: { calls: number; leads: number; minutes: number; ownerTextsSent: number; ownerTextsFailed: number; estimatedPipeline: number; estimatedSpend: number; costPerLead: number | null };
  rates: RateConfig;
  lines: CostLine[];
  clients: ClientCostRow[];
};

type ReactivationUsage = { client_id: string; retell_call_id: string | null; status: string; outcome: string | null; duration_seconds: number | null; owner_alert_sent_at: string | null; error: string | null; created_at: string };

function envNumber(name: string, fallback: number): number {
  const parsed = Number(process.env[name]);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function monthStart(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

function sum<T>(items: T[], value: (item: T) => number): number {
  return items.reduce((total, item) => total + value(item), 0);
}

function getRates(clients: Client[]): RateConfig {
  const configuredCount = Number(process.env.COST_PHONE_NUMBER_COUNT);
  const liveNumbers = new Set(clients.map((client) => client.provisioned_phone_number).filter(Boolean));
  return {
    retellVoicePerMinute: envNumber("COST_RETELL_VOICE_PER_MIN", 0.11),
    retellSmsPerMessage: envNumber("COST_RETELL_SMS_PER_MESSAGE", 0.01),
    smsMessagesPerAlert: envNumber("COST_SMS_MESSAGES_PER_ALERT", 1),
    phoneNumberMonthly: envNumber("COST_PHONE_NUMBER_MONTHLY", 2),
    phoneNumberCount: Number.isFinite(configuredCount) ? configuredCount : liveNumbers.size
  };
}

export function buildCostDashboard(clients: Client[], calls: Call[], now = new Date(), attempts: ReactivationUsage[] = []): CostDashboard {
  const start = monthStart(now);
  const periodCalls = calls.filter((call) => new Date(call.created_at) >= start && new Date(call.created_at) <= now);
  const periodAttempts = attempts.filter((attempt) => new Date(attempt.created_at) >= start && new Date(attempt.created_at) <= now && Boolean(attempt.retell_call_id || attempt.duration_seconds));
  const clientById = new Map(clients.map((client) => [client.id, client]));
  const rates = getRates(clients);
  const inboundMinutes = sum(periodCalls, (call) => Math.max(0, call.duration_seconds ?? 0)) / 60;
  const outboundMinutes = sum(periodAttempts, (attempt) => Math.max(0, attempt.duration_seconds ?? 0)) / 60;
  const minutes = inboundMinutes + outboundMinutes;
  const ownerTextsSent = periodCalls.filter((call) => call.sms_sent_at).length + periodAttempts.filter((attempt) => attempt.owner_alert_sent_at).length;
  const ownerTextsFailed = periodCalls.filter((call) => !call.sms_sent_at && call.sms_error).length + periodAttempts.filter((attempt) => !attempt.owner_alert_sent_at && attempt.error?.startsWith("Owner alert failed:")).length;
  const leads = periodCalls.filter((call) => isCountableLead(call.lead_type)).length;
  const estimatedPipeline = sum(periodCalls, (call) => {
    const client = clientById.get(call.client_id);
    return client ? estimateCallValue(call, client) : 0;
  });
  const voiceSpend = minutes * rates.retellVoicePerMinute;
  const messages = ownerTextsSent * rates.smsMessagesPerAlert;
  const messagingSpend = messages * rates.retellSmsPerMessage;
  const phoneNumberSpend = rates.phoneNumberCount * rates.phoneNumberMonthly;
  const lines: CostLine[] = [
    { label: "Retell voice", amount: voiceSpend, detail: `${minutes.toFixed(1)} total voice minutes` },
    { label: "Retell messages", amount: messagingSpend, detail: `${messages} estimated message${messages === 1 ? "" : "s"}` },
    { label: "Retell phone numbers", amount: phoneNumberSpend, detail: `${rates.phoneNumberCount} active number${rates.phoneNumberCount === 1 ? "" : "s"}` }
  ];
  const estimatedSpend = sum(lines, (line) => line.amount);
  const rows = new Map<string, ClientCostRow>(clients.map((client) => {
    const numberCost = client.provisioned_phone_number ? rates.phoneNumberMonthly : 0;
    return [client.id, { clientId: client.id, businessName: client.business_name, calls: 0, leads: 0, minutes: 0, ownerTextsSent: 0, voiceSpend: 0, messagingSpend: 0, phoneNumberSpend: numberCost, estimatedSpend: numberCost, estimatedPipeline: 0 }];
  }));
  for (const call of periodCalls) {
    const row = rows.get(call.client_id);
    const client = clientById.get(call.client_id);
    if (!row || !client) continue;
    const callMinutes = Math.max(0, call.duration_seconds ?? 0) / 60;
    const messageCost = call.sms_sent_at ? rates.smsMessagesPerAlert * rates.retellSmsPerMessage : 0;
    row.calls += 1;
    row.leads += isCountableLead(call.lead_type) ? 1 : 0;
    row.minutes += callMinutes;
    row.ownerTextsSent += call.sms_sent_at ? 1 : 0;
    row.voiceSpend += callMinutes * rates.retellVoicePerMinute;
    row.messagingSpend += messageCost;
    row.estimatedSpend += callMinutes * rates.retellVoicePerMinute + messageCost;
    row.estimatedPipeline += estimateCallValue(call, client);
  }
  for (const attempt of periodAttempts) {
    const row = rows.get(attempt.client_id);
    if (!row) continue;
    const attemptMinutes = Math.max(0, attempt.duration_seconds ?? 0) / 60;
    const messageCost = attempt.owner_alert_sent_at ? rates.smsMessagesPerAlert * rates.retellSmsPerMessage : 0;
    row.calls += 1;
    row.minutes += attemptMinutes;
    row.ownerTextsSent += attempt.owner_alert_sent_at ? 1 : 0;
    row.voiceSpend += attemptMinutes * rates.retellVoicePerMinute;
    row.messagingSpend += messageCost;
    row.estimatedSpend += attemptMinutes * rates.retellVoicePerMinute + messageCost;
  }
  return {
    periodStart: start.toISOString(), periodEnd: now.toISOString(),
    totals: { calls: periodCalls.length + periodAttempts.length, leads, minutes, ownerTextsSent, ownerTextsFailed, estimatedPipeline, estimatedSpend, costPerLead: leads ? estimatedSpend / leads : null },
    rates, lines, clients: [...rows.values()].sort((a, b) => b.estimatedSpend - a.estimatedSpend)
  };
}

export async function loadCostDashboard(now = new Date()): Promise<CostDashboard> {
  const supabase = getSupabaseAdmin();
  const start = monthStart(now).toISOString();
  const [{ data: clients, error: clientsError }, { data: calls, error: callsError }, { data: attempts, error: attemptsError }] = await Promise.all([
    supabase.from("clients").select("*"),
    supabase.from("calls").select("*").gte("created_at", start).order("created_at", { ascending: false }),
    supabase.from("reactivation_attempts").select("client_id,retell_call_id,status,outcome,duration_seconds,owner_alert_sent_at,error,created_at").gte("created_at", start).order("created_at", { ascending: false })
  ]);
  if (clientsError) throw clientsError;
  if (callsError) throw callsError;
  if (attemptsError) throw attemptsError;
  return buildCostDashboard((clients ?? []) as Client[], (calls ?? []) as Call[], now, (attempts ?? []) as ReactivationUsage[]);
}
