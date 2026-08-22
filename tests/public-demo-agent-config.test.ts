import { describe, expect, it } from "vitest";
import {
  publicDemoAgentName,
  publicDemoBeginMessage,
  publicDemoPrompt
} from "@/lib/public-demo-agent-config";

describe("public HVAC demo agent", () => {
  it("uses a fixed branded opening without unresolved variables or a persona name", () => {
    expect(publicDemoAgentName).toBe("Raleigh Lead Recovery — HVAC Demo");
    expect(publicDemoBeginMessage).toContain("live HVAC call demo");
    expect(publicDemoBeginMessage).not.toMatch(/\{\{|Chloe|Mabel|AI receptionist/i);
  });

  it("keeps the demo safe, focused, and honest", () => {
    expect(publicDemoPrompt).toContain("Ask one question at a time");
    expect(publicDemoPrompt).toContain("call 911 or their gas utility");
    expect(publicDemoPrompt).toContain("Never invent availability");
    expect(publicDemoPrompt).toContain("Never claim that a real technician has been dispatched");
    expect(publicDemoPrompt).not.toMatch(/\{\{/);
  });
});
