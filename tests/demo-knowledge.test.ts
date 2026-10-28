import { describe, expect, it } from "vitest";
import { demoBusinessName, demoKnowledge, demoKnowledgeCategories, demoScenarios } from "@/lib/demo-knowledge";

const article = (id: string) => {
  const entry = demoKnowledge.find((item) => item.id === id);
  if (!entry) throw new Error(`Missing required demo article: ${id}`);
  return entry.content;
};

describe("the public demo knowledge library", () => {
  it("keeps every article usable by the knowledge editor and discoverable in one category", () => {
    const ids = demoKnowledge.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(demoKnowledge.length).toBeGreaterThanOrEqual(32);
    for (const entry of demoKnowledge) {
      expect(entry.title.trim()).not.toBe("");
      expect(entry.keywords.trim()).not.toBe("");
      expect(entry.content.length).toBeLessThanOrEqual(3000);
      expect(entry.content.length).toBeGreaterThan(500);
      expect(entry.published).not.toBe(false);
    }
    const categorizedIds = demoKnowledgeCategories.flatMap((category) => category.ids);
    expect(new Set(categorizedIds).size).toBe(categorizedIds.length);
    expect([...categorizedIds].sort()).toEqual([...ids].sort());
  });

  it("grounds coverage, hours, and the demo's limits in explicit policies", () => {
    expect(demoBusinessName).toBe("Oak City Heating & Air");
    expect(article("overview")).toMatch(/fictional/);
    for (const city of ["Raleigh", "Cary", "Apex", "Morrisville", "Garner", "Wake Forest"]) {
      expect(article("area")).toContain(city);
    }
    expect(article("area")).toContain("Durham is outside");
    expect(article("hours")).toContain("Monday–Friday, 8 AM–5 PM Eastern Time");
    expect(article("hours")).toContain("24/7");
    expect(article("appointments")).toContain("no live scheduling or dispatch integration");
  });

  it("makes diagnostic fees and membership exclusions unambiguous for combined answers", () => {
    expect(article("diagnostic")).toContain("$89 during standard service hours or $129 after hours");
    expect(article("diagnostic")).toContain("approves a repair during the same visit");
    expect(article("diagnostic")).toContain("not that price plus $89 or $129");
    expect(article("comfort-care")).toContain("$189 per year per enrolled system");
    expect(article("comfort-care")).toContain("15% discount on eligible repair parts and labor");
    expect(article("comfort-care")).toContain("Diagnostics, replacement equipment, new installations, and membership dues are excluded");
    expect(article("tune-up")).toContain("$99 per system");
  });

  it("keeps published multi-system and repair examples arithmetically correct", () => {
    const text = article("membership-math");
    const annualMembership = 189 * 2;
    const separateTuneUps = 99 * 4;
    const discountedRepair = 400 * 0.85;
    expect(text).toContain("$189 × 2 = $" + annualMembership);
    expect(text).toContain("$99 × 4 = $" + separateTuneUps);
    expect(text).toContain("a difference of $" + (separateTuneUps - annualMembership));
    expect(text).toContain("repair $" + discountedRepair);
    expect(text).toContain("$" + (annualMembership + discountedRepair) + " versus $" + (separateTuneUps + 400));
    expect(text).toContain("a $" + (separateTuneUps + 400 - annualMembership - discountedRepair) + " difference");
    expect(article("repair-pricing")).toContain("$400 × 0.85 = $340");
  });

  it("supports safety and authorization boundaries without turning unknowns into offers", () => {
    expect(article("ice")).toContain("turn cooling off at the thermostat");
    expect(article("emergency")).toContain("contact emergency services or the relevant utility from a safe location");
    expect(article("rentals")).toContain("requires authorization from the property owner or an authorized property manager");
    expect(article("financing")).toContain("No lender, APR");
    expect(article("warranty")).toContain("one-year workmanship warranty on the specific repair performed");
    expect(article("privacy")).toContain("no real Oak City customer database");
  });

  it("offers distinct multi-topic conversations with meaningful follow-up questions", () => {
    expect(new Set(demoScenarios.map((scenario) => scenario.id)).size).toBe(demoScenarios.length);
    expect(demoScenarios).toHaveLength(4);
    for (const scenario of demoScenarios) {
      expect(scenario.label.length).toBeGreaterThan(5);
      expect(scenario.description.length).toBeGreaterThan(30);
      expect(scenario.prompt.length).toBeGreaterThan(100);
      expect(scenario.followUp.length).toBeGreaterThan(60);
    }
  });
});
