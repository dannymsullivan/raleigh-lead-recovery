import { describe, expect, it } from "vitest";
import {
  publicDemoAgentName,
  publicDemoBeginMessage,
  publicDemoPrompt
} from "@/lib/public-demo-agent-config";

describe("public HVAC demo agent", () => {
  it("answers as Chloe for the clearly fictional demo company", () => {
    expect(publicDemoAgentName).toBe("Oak City Heating & Air — Demo");
    expect(publicDemoBeginMessage).toBe(
      "Thanks for calling Oak City Heating & Air. I’m Chloe, their AI assistant. How can I help you today?"
    );
    expect(publicDemoBeginMessage).not.toMatch(/\{\{/);
    expect(publicDemoPrompt).toContain("a fictional company");
    expect(publicDemoPrompt).toContain("Always be honest that you are an AI assistant");
  });

  it("keeps the demo safe, focused, and honest", () => {
    expect(publicDemoPrompt).toContain("Ask one question at a time");
    expect(publicDemoPrompt).toContain("call 911 or their gas utility");
    expect(publicDemoPrompt).toContain("Never invent availability");
    expect(publicDemoPrompt).toContain("Never claim that a real technician has been dispatched");
    expect(publicDemoPrompt).not.toMatch(/\{\{/);
  });
});
