import { describe, expect, it } from "vitest";
import { parseWebDemoMode, webDemoAgentId, webDemoDynamicVariables } from "@/lib/web-demo-config";

describe("browser demo routing", () => {
  it("accepts only the two public demo modes", () => {
    expect(parseWebDemoMode("receptionist")).toBe("receptionist");
    expect(parseWebDemoMode("reactivation")).toBe("reactivation");
    expect(parseWebDemoMode("roofing")).toBeNull();
  });

  it("keeps receptionist and reactivation agents separate", () => {
    const environment = {
      RETELL_RECEPTIONIST_DEMO_AGENT_ID: "agent-inbound",
      RETELL_REACTIVATION_DEMO_AGENT_ID: "agent-outbound",
      RETELL_WEB_DEMO_AGENT_ID: "agent-legacy"
    };

    expect(webDemoAgentId("receptionist", environment)).toBe("agent-inbound");
    expect(webDemoAgentId("reactivation", environment)).toBe("agent-outbound");
  });

  it("supports the legacy receptionist setting without using it for reactivation", () => {
    const environment = { RETELL_WEB_DEMO_AGENT_ID: "agent-legacy" };

    expect(webDemoAgentId("receptionist", environment)).toBe("agent-legacy");
    expect(webDemoAgentId("reactivation", environment)).toBeNull();
  });

  it("provides every variable used by the reactivation opening and prompt", () => {
    expect(webDemoDynamicVariables("reactivation")).toMatchObject({
      business_name: "Snappy Leads",
      contact_name: "there",
      service_type: "seasonal HVAC tune-up",
      lead_source: "a previous seasonal maintenance inquiry",
      demo_mode: "reactivation"
    });
  });
});
