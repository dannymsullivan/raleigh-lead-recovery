import { describe, expect, it } from "vitest";
import { buildOutreachSummary, outreachWebsiteHref, parseOutreachBulkLines } from "@/lib/outreach";

describe("outreach tracker", () => {
  it("summarizes the founder pipeline and due follow-ups", () => {
    expect(
      buildOutreachSummary(
        [
          { stage: "not_contacted", next_follow_up_on: null },
          { stage: "email_sent", next_follow_up_on: "2026-08-28" },
          { stage: "replied", next_follow_up_on: "2026-08-30" },
          { stage: "pilot_booked", next_follow_up_on: "2026-08-20" },
        ],
        "2026-08-29",
      ),
    ).toEqual({ total: 4, ready: 1, replies: 2, pilots: 1, followUpsDue: 1 });
  });

  it("turns a bare domain into a safe outbound link", () => {
    expect(outreachWebsiteHref("example.com")).toBe("https://example.com");
    expect(outreachWebsiteHref("https://example.com")).toBe("https://example.com");
  });

  it("parses pasted bulk lines into prospects with optional fields", () => {
    const { rows, skipped } = parseOutreachBulkLines(
      "Cool Breeze HVAC | Raleigh | coolbreeze.com | (919) 555-0100\nComfort Pros\n\nCool Breeze HVAC | Durham\n| Cary",
    );
    expect(rows).toEqual([
      { company_name: "Cool Breeze HVAC", city: "Raleigh", website: "coolbreeze.com", phone: "(919) 555-0100" },
      { company_name: "Comfort Pros", city: null, website: null, phone: null },
    ]);
    expect(skipped).toBe(2);
  });

  it("accepts tab-separated bulk lines from spreadsheets", () => {
    const { rows } = parseOutreachBulkLines("Airflow Experts\tApex\tairflowexperts.com");
    expect(rows).toEqual([
      { company_name: "Airflow Experts", city: "Apex", website: "airflowexperts.com", phone: null },
    ]);
  });
});
