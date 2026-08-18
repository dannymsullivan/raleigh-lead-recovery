import { describe, expect, it } from "vitest";
import { demoCampaign, demoCampaignProgress, demoLeads, formatDemoCurrency } from "../lib/demo-reactivation";

describe("demo reactivation campaign", () => {
  it("reports progress from attempted records", () => {
    expect(demoCampaignProgress()).toBe(65);
  });

  it("contains only masked sample phone numbers", () => {
    expect(demoLeads.every((lead) => lead.phone.includes("•••"))).toBe(true);
    expect(demoLeads.every((lead) => !/\d{3}-\d{4}/.test(lead.phone))).toBe(true);
  });

  it("keeps funnel totals internally ordered", () => {
    expect(demoCampaign.attempted).toBeLessThanOrEqual(demoCampaign.listSize);
    expect(demoCampaign.connected).toBeLessThanOrEqual(demoCampaign.attempted);
    expect(demoCampaign.interested).toBeLessThanOrEqual(demoCampaign.connected);
    expect(demoCampaign.booked).toBeLessThanOrEqual(demoCampaign.interested);
  });

  it("formats illustrative pipeline as whole-dollar currency", () => {
    expect(formatDemoCurrency(216000)).toBe("$216,000");
  });
});
