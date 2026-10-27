import { describe, expect, it } from "vitest";
import { businessProfileKnowledge, effectiveChatKnowledge } from "@/lib/chat-knowledge";
import { answerFromKnowledge } from "@/lib/chat";

describe("chat reuses existing business facts", () => {
  const business = { business_name: "Example HVAC", services: ["AC repair", "Heat pumps"], service_area: "Raleigh and Cary", business_hours: { monday: { closed: false, open: "08:00", close: "17:00" }, sunday: { closed: true, open: "08:00", close: "17:00" } }, timezone: "America/New_York", owner_phone: "+19195550123", owner_email: "private@example.com", emergency_rules: "Call the owner's private mobile" };
  it("uses services, area, and hours without exposing private owner or escalation fields", () => {
    const entries = businessProfileKnowledge(business);
    expect(entries).toHaveLength(3);
    expect(answerFromKnowledge("Do you serve Cary?", entries).content).toContain("Raleigh and Cary");
    expect(answerFromKnowledge("What are your office hours?", entries).content).toContain("sunday: closed");
    expect(JSON.stringify(entries)).not.toMatch(/private@example|19195550123|private mobile/);
  });
  it("does not invent profile facts when fields are absent", () => {
    expect(businessProfileKnowledge({ business_name: "Example" })).toEqual([]);
  });
  it("lets a published custom answer replace the same profile topic while drafts stay private", () => {
    const entries = effectiveChatKnowledge(businessProfileKnowledge(business), [
      { id: "custom", title: "Service area", content: "Cary only.", keywords: "cary area" },
      { id: "draft", title: "Services", content: "Secret draft", keywords: "services", published: false },
    ]);
    expect(entries.filter((entry) => entry.title === "Service area")).toHaveLength(1);
    expect(answerFromKnowledge("Do you serve Cary?", entries).content).toBe("Cary only.");
    expect(entries.find((entry) => entry.id === "profile-services")).toBeDefined();
    expect(JSON.stringify(entries)).not.toContain("Secret draft");
  });
});
