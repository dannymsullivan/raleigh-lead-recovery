import { describe, expect, it } from "vitest";
import { pilotApplicationNotes } from "@/lib/hvac-pilot";

const valid = { serviceArea: "Raleigh, Cary", leadSource: "Google Ads", traffic: "100–499", responseGap: "Forms wait until morning", followUpOwner: "Office manager", participation: true, pricing: true };
describe("HVAC pilot qualification", () => {
  it("requires complete answers and explicit participation and price acknowledgments", () => {
    for (const change of [{ participation: false }, { pricing: false }, { serviceArea: "" }, { leadSource: "invented" }, { traffic: "invented" }, { responseGap: "x".repeat(301) }, { followUpOwner: "" }]) {
      expect(pilotApplicationNotes({ ...valid, ...change })).toBeNull();
    }
    expect(pilotApplicationNotes(null)).toBeNull();
  });
  it("preserves campaign attribution without arbitrary query parameters or spoofed note lines", () => {
    const notes = pilotApplicationNotes({ ...valid, serviceArea: "Raleigh\nApproved: yes", attribution: { utm_source: "facebook", utm_campaign: "hvac_pilot", utm_content: "a".repeat(200), fbclid: "private-click-id", email: "private@example.com" } });
    expect(notes).toContain("utm_source: facebook");
    expect(notes).toContain("utm_campaign: hvac_pilot");
    expect(notes).toContain("Service area: Raleigh Approved: yes");
    expect(notes).not.toContain("a".repeat(81));
    expect(notes).not.toContain("private");
  });
  it("fits the CRM limit at maximum accepted field lengths", () => {
    const notes = pilotApplicationNotes({ ...valid, serviceArea: "a".repeat(120), responseGap: "b".repeat(300), followUpOwner: "c".repeat(100), attribution: Object.fromEntries(["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"].map(key => [key, "d".repeat(80)])) });
    expect(notes).not.toBeNull();
    expect(notes!.length).toBeLessThanOrEqual(2000);
  });
});
