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
  const vapiConfigured = has(environment, "VAPI_API_KEY") && has(environment, "VAPI_WEBHOOK_SECRET") && (has(environment, "VAPI_PUBLIC_WEBHOOK_URL") || has(environment, "NEXT_PUBLIC_APP_URL"));
  const twilioConfigured = has(environment, "TWILIO_ACCOUNT_SID") && has(environment, "TWILIO_AUTH_TOKEN");
  const verifyConfigured = twilioConfigured && has(environment, "TWILIO_VERIFY_SERVICE_SID");
  const readyClients = clients.filter((client) => client.provisioning_status === "ready").length;

  return [
    {
      name: "Supabase",
      purpose: "Customers, calls, authentication",
      status: databaseConnected ? "connected" : "attention",
      detail: databaseConnected ? `${clients.length} customer workspace${clients.length === 1 ? "" : "s"} reachable` : "Database query failed"
    },
    {
      name: "Vapi",
      purpose: "Mabel voice agent and call capture",
      status: vapiConfigured ? "connected" : "not_configured",
      detail: vapiConfigured ? `${readyClients} customer setup${readyClients === 1 ? "" : "s"} ready` : "API key, webhook secret, or public URL is missing"
    },
    {
      name: "Twilio Verify",
      purpose: "Customer sign-in codes",
      status: verifyConfigured ? "connected" : twilioConfigured ? "attention" : "not_configured",
      detail: verifyConfigured ? "Verify service configured" : twilioConfigured ? "Messaging is configured, but Verify is not; US login texts can be blocked" : "Twilio credentials are missing"
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
  const voiceAi = minutesPerTrial * envNumber(environment, "COST_VAPI_HOSTING_PER_MIN", 0.05);
  const modelAllowance = minutesPerTrial * envNumber(environment, "COST_MODEL_PROVIDER_PER_MIN", 0.04);
  const voiceTransport = minutesPerTrial * envNumber(environment, "COST_TWILIO_LOCAL_INBOUND_PER_MIN", 0.0085);
  const smsSegments = callsPerTrial * envNumber(environment, "COST_SMS_SEGMENTS_PER_ALERT", 2);
  const ownerAlerts = smsSegments * (
    envNumber(environment, "COST_TWILIO_SMS_BASE_PER_SEGMENT", 0.0083) +
    envNumber(environment, "COST_TWILIO_SMS_CARRIER_FEE_PER_SEGMENT", 0.0045)
  );
  const signupVerification = envNumber(environment, "COST_VERIFY_SUCCESS", 0.05) + envNumber(environment, "COST_VERIFY_SMS", 0.0083);
  const phoneNumber = envNumber(environment, "COST_PHONE_NUMBER_MONTHLY", 1.15) * (trialDays / 30);
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
