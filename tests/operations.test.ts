import { describe, expect, it } from "vitest";
import { buildCustomerSnapshot, buildIntegrationStatuses, buildTrialForecast } from "@/lib/operations";
import type { Client } from "@/lib/types";

function client(overrides: Partial<Client> = {}): Client {
  return {
    id: "client-1",
    business_name: "Triangle HVAC",
    trade: "hvac",
    owner_name: "Sam",
    owner_phone: "+19195550123",
    owner_email: null,
    pilot_start: "2026-08-01",
    pilot_end: "2026-08-20",
    avg_job_value: 900,
    close_rate: 0.4,
    created_at: "2026-08-01T00:00:00Z",
    ...overrides
  };
}

describe("operations dashboard", () => {
  it("models a 14-day test trial and cohort runway", () => {
    const forecast = buildTrialForecast({});

    expect(forecast.assumptions).toMatchObject({ trialDays: 14, callsPerTrial: 20, averageCallMinutes: 2.5, minutesPerTrial: 50 });
    expect(forecast.perTrial.total).toBeCloseTo(6.63333, 4);
    expect(forecast.scenarios[0]).toEqual({ trials: 10, variableCost: expect.any(Number), totalWithBaseline: expect.any(Number) });
    expect(forecast.scenarios[0].totalWithBaseline).toBeCloseTo(111.3333, 3);
  });

  it("summarizes customer lifecycle and provisioning attention", () => {
    const snapshot = buildCustomerSnapshot([
      client({ account_status: "trialing", provisioning_status: "ready", trial_ends_at: "2026-08-13T12:00:00Z" }),
      client({ id: "client-2", account_status: "onboarding", provisioning_status: "error" })
    ], new Date("2026-08-11T12:00:00Z"));

    expect(snapshot).toEqual({ total: 2, onboarding: 1, trialing: 1, active: 0, attention: 1, ready: 1, expiringSoon: 1 });
  });

  it("shows the simplified Retell integration", () => {
    const statuses = buildIntegrationStatuses({
      RETELL_API_KEY: "set",
      NEXT_PUBLIC_APP_URL: "https://example.com",
      VERCEL_ENV: "production"
    }, true, []);

    expect(statuses.find((status) => status.name === "Retell")?.status).toBe("connected");
    expect(statuses.find((status) => status.name === "Supabase")?.status).toBe("connected");
  });

  it("marks Retell unconfigured without an API key", () => {
    const statuses = buildIntegrationStatuses({
      NEXT_PUBLIC_APP_URL: "https://example.com"
    }, true, []);
    expect(statuses.find((status) => status.name === "Retell")?.status).toBe("not_configured");
  });
});
