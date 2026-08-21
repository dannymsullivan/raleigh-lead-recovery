import type { Client } from "./types";

type Environment = Record<string, string | undefined>;

export type CustomerSnapshot = {
  total: number;
  onboarding: number;
  trialing: number;
  active: number;
  attention: number;
  ready: number;
  expiringSoon: number;
};

export type IntegrationStatus = {
  name: string;
  purpose: string;
  status: "connected" | "attention" | "not_configured";
  detail: string;
};

export type TrialForecast = {
  assumptions: {
    trialDays: number;
    callsPerTrial: number;
    averageCallMinutes: number;
    minutesPerTrial: number;
    fixedMonthlyBaseline: number;
  };
  perTrial: {
    voiceAi: number;
    modelAllowance: number;
    voiceTransport: number;
    ownerAlerts: number;
    signupVerification: number;
    phoneNumber: number;
    total: number;
  };
  scenarios: Array<{ trials: number; variableCost: number; totalWithBaseline: number }>;
};

function envNumber(environment: Environment, name: string, fallback: number): number {
  const raw = environment[name]?.trim();
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function has(environment: Environment, name: string): boolean {
  return Boolean(environment[name]?.trim());
}

export function buildCustomerSnapshot(clients: Client[], now = new Date()): CustomerSnapshot {
  const soon = new Date(now);
  soon.setUTCDate(soon.getUTCDate() + 3);

  return {
    total: clients.length,
    onboarding: clients.filter((client) => client.account_status === "onboarding").length,
    trialing: clients.filter((client) => client.account_status === "trialing").length,
    active: clients.filter((client) => client.account_status === "active").length,
    attention: clients.filter((client) => client.provisioning_status === "error" || client.provisioning_status === "needs_configuration").length,
    ready: clients.filter((client) => client.provisioning_status === "ready").length,
    expiringSoon: clients.filter((client) => {
      if (client.account_status !== "trialing" || !client.trial_ends_at) return false;
      const end = new Date(client.trial_ends_at);
      return end >= now && end <= soon;
    }).length
  };
}

export function buildIntegrationStatuses(environment: Environment, databaseConnected: boolean, clients: Client[]): IntegrationStatus[] {
  const retellConfigured = has(environment, "RETELL_API_KEY") && has(environment, "NEXT_PUBLIC_APP_URL");
  const retellMessaging = has(environment, "RETELL_SMS_AGENT_ID") && has(environment, "RETELL_SMS_FROM_NUMBER");
  const readyClients = clients.filter((client) => client.provisioning_status === "ready").length;

  return [
    {
      name: "Supabase",
      purpose: "Customers, calls, authentication",
      status: databaseConnected ? "connected" : "attention",
      detail: databaseConnected ? `${clients.length} customer workspace${clients.length === 1 ? "" : "s"} reachable` : "Database query failed"
    },
    {
      name: "Retell",
      purpose: "Voice agents, phone numbers, and call capture",
      status: retellConfigured ? "connected" : "not_configured",
      detail: retellConfigured ? databaseConnected ? `${readyClients} customer setup${readyClients === 1 ? "" : "s"} ready${retellMessaging ? " · messaging configured" : ""}` : "Configured; customer readiness unavailable until the database reconnects" : "API key or public app URL is missing"
    },
    {
      name: "Vercel",
      purpose: "Application hosting and deployments",
      status: environment.VERCEL_ENV === "production" ? "connected" : has(environment, "NEXT_PUBLIC_APP_URL") ? "connected" : "attention",
      detail: environment.VERCEL_GIT_COMMIT_SHA ? `Production commit ${environment.VERCEL_GIT_COMMIT_SHA.slice(0, 7)}` : "App URL configured; plan cost is estimated"
    }
  ];
}

export function buildTrialForecast(environment: Environment = process.env): TrialForecast {
  const trialDays = envNumber(environment, "COST_TRIAL_DAYS", 14);
  const callsPerTrial = envNumber(environment, "COST_TRIAL_CALLS", 20);
  const averageCallMinutes = envNumber(environment, "COST_TRIAL_AVG_CALL_MIN", 2.5);
  const minutesPerTrial = callsPerTrial * averageCallMinutes;
  const voiceAi = minutesPerTrial * envNumber(environment, "COST_RETELL_VOICE_PER_MIN", 0.11);
  const modelAllowance = 0;
  const voiceTransport = 0;
  const ownerAlerts = callsPerTrial * envNumber(environment, "COST_SMS_MESSAGES_PER_ALERT", 1) * envNumber(environment, "COST_RETELL_SMS_PER_MESSAGE", 0.01);
  const signupVerification = 0;
  const phoneNumber = envNumber(environment, "COST_PHONE_NUMBER_MONTHLY", 2) * (trialDays / 30);
  const fixedMonthlyBaseline = envNumber(environment, "COST_VERCEL_MONTHLY", 20) + envNumber(environment, "COST_SUPABASE_MONTHLY", 25);
  const total = voiceAi + modelAllowance + voiceTransport + ownerAlerts + signupVerification + phoneNumber;

  return {
    assumptions: { trialDays, callsPerTrial, averageCallMinutes, minutesPerTrial, fixedMonthlyBaseline },
    perTrial: { voiceAi, modelAllowance, voiceTransport, ownerAlerts, signupVerification, phoneNumber, total },
    scenarios: [10, 25, 50, 100].map((trials) => ({
      trials,
      variableCost: trials * total,
      totalWithBaseline: fixedMonthlyBaseline + trials * total
    }))
  };
}
