import { describe, expect, it } from "vitest";
import {
  businessReceptionistLlmPayload,
  businessReceptionistOpeningMessage,
  businessReceptionistPrompt,
} from "@/lib/business-receptionist-agent-config";

describe("Raleigh Lead Recovery business receptionist", () => {
  it("discloses that Chloe is an AI assistant in the opening", () => {
    expect(businessReceptionistOpeningMessage).toContain("AI assistant");
    expect(businessReceptionistOpeningMessage).toContain("Chloe");
  });

  it("requires caller permission before a transfer", () => {
    expect(businessReceptionistPrompt).toContain("Transfer only after the caller says yes");
    const payload = businessReceptionistLlmPayload("+18455550123");
    const transfer = payload.general_tools.find((tool) => tool.type === "transfer_call");
    expect(transfer?.transfer_destination).toEqual({ type: "predefined", number: "+18455550123" });
    expect(transfer?.transfer_option.type).toBe("warm_transfer");
  });
});
