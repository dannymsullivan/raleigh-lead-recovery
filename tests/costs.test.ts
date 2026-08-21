import { afterEach, describe, expect, it, vi } from "vitest";
import { buildCostDashboard } from "@/lib/costs";
import type { Call, Client } from "@/lib/types";

function client(id: string, name: string, phoneNumber: string | null): Client {
  return {
    id,
    business_name: name,
    trade: "events",
    owner_name: "Owner",
    owner_phone: "+19195550123",
    owner_email: null,
    pilot_start: "2026-08-01",
    pilot_end: "2026-08-31",
    avg_job_value: 500,
    close_rate: 0.4,
    provisioned_phone_number: phoneNumber,
    created_at: "2026-08-01T00:00:00Z"
  };
}

afterEach(() => vi.unstubAllEnvs());

describe("customer cost allocation", () => {
  it("shows every customer even before they place a call", () => {
    vi.stubEnv("COST_PHONE_NUMBER_MONTHLY", "1.15");
    const dashboard = buildCostDashboard(
      [client("one", "Zim Zoom", "+19195550123"), client("two", "New Customer", null)],
      [],
      new Date("2026-08-20T12:00:00Z")
    );
    expect(dashboard.clients).toHaveLength(2);
    expect(dashboard.clients.find((row) => row.clientId === "one")).toMatchObject({ calls: 0, phoneNumberSpend: 1.15, estimatedSpend: 1.15 });
    expect(dashboard.clients.find((row) => row.clientId === "two")).toMatchObject({ calls: 0, phoneNumberSpend: 0, estimatedSpend: 0 });
  });

  it("combines inbound and reactivation usage under the correct customer", () => {
    const customers = [client("one", "Zim Zoom", null), client("two", "Other", null)];
    const inbound = [{
      client_id: "one",
      duration_seconds: 120,
      sms_sent_at: "2026-08-10T12:05:00Z",
      sms_error: null,
      lead_type: "new_job",
      created_at: "2026-08-10T12:00:00Z"
    }] as Call[];
    const attempts = [{
      client_id: "one",
      retell_call_id: "outbound-one",
      status: "completed",
      outcome: "interested",
      duration_seconds: 180,
      owner_alert_sent_at: "2026-08-11T12:05:00Z",
      error: null,
      created_at: "2026-08-11T12:00:00Z"
    }];
    const dashboard = buildCostDashboard(customers, inbound, new Date("2026-08-20T12:00:00Z"), attempts);
    const zimZoom = dashboard.clients.find((row) => row.clientId === "one");
    expect(dashboard.totals.calls).toBe(2);
    expect(dashboard.totals.minutes).toBe(5);
    expect(zimZoom).toMatchObject({ calls: 2, minutes: 5, ownerTextsSent: 2 });
    expect(zimZoom!.voiceSpend).toBeGreaterThan(0);
    expect(zimZoom!.messagingSpend).toBeGreaterThan(0);
  });
});
