import { describe, expect, it } from "vitest";
import { assessOpportunityDate, isDateSensitiveService, opportunityDateFromContext } from "@/lib/lead-eligibility";
import { analyzeLeadRows } from "@/lib/lead-import";

describe("event-date eligibility", () => {
  const now = new Date("2026-08-21T12:00:00Z");

  it("requires a strictly future date for event campaigns", () => {
    expect(isDateSensitiveService("photo booths")).toBe(true);
    expect(assessOpportunityDate({ serviceType: "photo booths", jobDate: "2026-08-22" }, now).status).toBe("future");
    expect(assessOpportunityDate({ serviceType: "photo booths", jobDate: "2026-08-21" }, now).status).toBe("past");
    expect(assessOpportunityDate({ serviceType: "photo booths", jobDate: "2019-06-01" }, now).eligible).toBe(false);
    expect(assessOpportunityDate({ serviceType: "photo booths" }, now).status).toBe("missing");
  });

  it("does not apply the event-date rule to recurring home services", () => {
    expect(assessOpportunityDate({ serviceType: "HVAC tune-ups", jobDate: "2024-06-01" }, now).eligible).toBe(true);
  });

  it("finds dates in flexible spreadsheet metadata or stored context", () => {
    expect(opportunityDateFromContext({ "Event Date": "2027-05-03" })).toBe("2027-05-03");
    expect(opportunityDateFromContext({}, "Requested date: 2027-06-04\nSource: Website")).toBe("2027-06-04");
  });

  it("moves past event leads out of callable buckets during analysis", () => {
    const headers = ["Name", "Phone", "Status", "Job Date"];
    const rows = [["Past Event", "9195550101", "Stale", "2025-06-01"], ["Future Event", "9195550102", "Stale", "2027-06-01"]];
    const analysis = analyzeLeadRows(headers, rows, { full_name: "Name", phone: "Phone", status: "Status", job_date: "Job Date" }, now, "photo booths");
    expect(analysis.rows[0]).toMatchObject({ bucket: "exclude", bucketReason: "Event date has passed (2025-06-01)" });
    expect(analysis.rows[1]).toMatchObject({ bucket: "ready_to_reengage" });
    expect(analysis.callableBucketCounts.ready_to_reengage).toBe(1);
  });
});
