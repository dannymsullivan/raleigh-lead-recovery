import { describe, expect, it } from "vitest";
import { buildReportModel, estimateCallValue, maskPhoneNumber, summarizeAddress } from "@/lib/report";
import type { Call, Client } from "@/lib/types";

const client: Client = {
  id: "client-1",
  business_name: "Oak City Plumbing",
  trade: "plumbing",
  owner_name: "Marcus",
  owner_phone: "+19195550123",
  owner_email: null,
  pilot_start: "2026-07-01",
  pilot_end: "2026-07-08",
  avg_job_value: 650,
  close_rate: 0.5,
  vapi_assistant_id: "asst_1",
  vapi_phone_number_id: "pn_1",
  created_at: "2026-07-01T00:00:00.000Z"
};

function baseCall(overrides: Partial<Call>): Call {
  return {
    id: "call-1",
    client_id: client.id,
    vapi_call_id: "vapi-1",
    caller_number: "+19195554821",
    caller_name: "Tanya",
    callback_number: "+19195554821",
    service_address: "123 Oak Valley Dr, Raleigh, NC",
    issue_description: "Burst pipe",
    urgency: "emergency",
    lead_type: "new_job",
    estimated_value_band: "800_2000",
    requested_timing: "Now",
    callback_promised_by: "15 minutes",
    summary: "A burst pipe call.",
    transcript: null,
    recording_url: null,
    duration_seconds: 120,
    raw_payload: {},
    sms_sent_at: null,
    created_at: "2026-07-08T12:00:00.000Z",
    updated_at: "2026-07-08T12:00:00.000Z",
    ...overrides
  };
}

describe("report value math", () => {
  it("uses band midpoints without multiplying by close rate", () => {
    expect(estimateCallValue(baseCall({ estimated_value_band: "800_2000" }), client)).toBe(1400);
  });

  it("uses average job value for unknown bands", () => {
    expect(estimateCallValue(baseCall({ estimated_value_band: "unknown" }), client)).toBe(650);
  });

  it("excludes spam and complaint leads from captured value", () => {
    expect(estimateCallValue(baseCall({ lead_type: "spam", estimated_value_band: "over_2000" }), client)).toBe(0);
    expect(estimateCallValue(baseCall({ lead_type: "complaint", estimated_value_band: "over_2000" }), client)).toBe(0);
  });

  it("builds aggregate stats from the call list", () => {
    const report = buildReportModel(client, [
      baseCall({ id: "1", vapi_call_id: "1", urgency: "emergency", lead_type: "new_job", estimated_value_band: "over_2000" }),
      baseCall({ id: "2", vapi_call_id: "2", urgency: "urgent", lead_type: "existing_customer", estimated_value_band: "under_300" }),
      baseCall({ id: "3", vapi_call_id: "3", urgency: "standard", lead_type: "complaint", estimated_value_band: "over_2000" }),
      baseCall({ id: "4", vapi_call_id: "4", urgency: "spam", lead_type: "spam", estimated_value_band: "over_2000" })
    ]);

    expect(report.totalCalls).toBe(4);
    expect(report.leadsCaptured).toBe(3);
    expect(report.emergenciesCaught).toBe(1);
    expect(report.estimatedJobValueCaptured).toBe(3150);
  });
});

describe("report PII masking", () => {
  it("masks callback numbers but keeps the useful last four digits", () => {
    expect(maskPhoneNumber("+1 (919) 555-4821")).toBe("(919) ***-4821");
  });

  it("removes house numbers from service addresses", () => {
    expect(summarizeAddress("123 Oak Valley Dr, Raleigh, NC")).toBe("Oak Valley Dr");
  });
});
