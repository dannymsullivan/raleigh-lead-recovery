import { describe, expect, it } from "vitest";
import {
  buildOutreachSummary,
  companyNameFromWebsite,
  normalizeOutreachWebsite,
  outreachCallUpdate,
  outreachWebsiteHref,
  parseOutreachBulkLines,
} from "@/lib/outreach";

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
      "Cool Breeze HVAC | Raleigh | 123 Main St, Raleigh, NC 27601 | coolbreeze.com | (919) 555-0100\nComfort Pros\n\nCool Breeze HVAC | Durham\n| Cary",
    );
    expect(rows).toEqual([
      { company_name: "Cool Breeze HVAC", city: "Raleigh", address: "123 Main St, Raleigh, NC 27601", website: "coolbreeze.com", phone: "(919) 555-0100" },
      { company_name: "Comfort Pros", city: null, address: null, website: null, phone: null },
    ]);
    expect(skipped).toBe(2);
  });

  it("derives a company name from a website URL for quick add", () => {
    expect(companyNameFromWebsite("https://www.cool-breeze-hvac.com/contact")).toBe("Cool Breeze HVAC");
    expect(companyNameFromWebsite("santaair.com")).toBe("Santa Air");
    expect(companyNameFromWebsite("modernmechanicalhvac.com")).toBe("Modern Mechanical HVAC");
    expect(companyNameFromWebsite("newcombandcompany.com")).toBe("Newcomb and Company");
    expect(companyNameFromWebsite("not a url")).toBeNull();
    expect(companyNameFromWebsite("")).toBeNull();
  });

  it("normalizes a pasted website before saving it", () => {
    expect(normalizeOutreachWebsite("https://www.Cool-Breeze-HVAC.com/contact")).toBe("cool-breeze-hvac.com");
    expect(normalizeOutreachWebsite("not a url")).toBeNull();
  });

  it("turns a one-tap call result into the next follow-up", () => {
    expect(outreachCallUpdate("real_person", "2026-08-31")).toEqual({
      last_call_outcome: "real_person",
      last_contacted_on: "2026-08-31",
      next_follow_up_on: "2026-09-01",
    });
    expect(outreachCallUpdate("no_answer", "2026-08-31").next_follow_up_on).toBe("2026-09-02");
    expect(outreachCallUpdate("wrong_number", "2026-08-31").next_follow_up_on).toBeNull();
  });

  it("accepts tab-separated bulk lines from spreadsheets", () => {
    const { rows } = parseOutreachBulkLines("Airflow Experts\tApex\t100 Main St, Apex, NC 27502\tairflowexperts.com");
    expect(rows).toEqual([
      { company_name: "Airflow Experts", city: "Apex", address: "100 Main St, Apex, NC 27502", website: "airflowexperts.com", phone: null },
    ]);
  });

  it("keeps the previous four-column bulk format compatible", () => {
    const { rows } = parseOutreachBulkLines("Airflow Experts | Apex | airflowexperts.com | (919) 555-0100");
    expect(rows).toEqual([
      { company_name: "Airflow Experts", city: "Apex", address: null, website: "airflowexperts.com", phone: "(919) 555-0100" },
    ]);
  });
});
