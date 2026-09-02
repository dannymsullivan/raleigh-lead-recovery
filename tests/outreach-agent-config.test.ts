import { describe, expect, it } from "vitest";
import { outreachAgentPrompt, outreachLlmPayload, outreachOpeningMessage, outreachVoicePayload } from "@/lib/outreach-agent-config";

describe("outreach agent configuration", () => {
  it("discloses that Chloe is an AI and prohibits a fake wrong-number exit", () => {
    expect(outreachLlmPayload()).toMatchObject({
      start_speaker: "user",
      begin_message: outreachOpeningMessage,
    });
    expect(outreachOpeningMessage).toContain("can I ask one quick question?");
    expect(outreachAgentPrompt).toContain("Wait for the person who answered to speak first");
    expect(outreachAgentPrompt).toContain("Never pretend to be human");
    expect(outreachAgentPrompt).toContain("someone who dialed by accident");
  });

  it("uses short permission-based turns instead of pitching after the first answer", () => {
    expect(outreachAgentPrompt).toContain("Do not explain or pitch Raleigh Lead Recovery immediately after their first answer");
    expect(outreachAgentPrompt).toContain("Do you know if most callers leave a message?");
    expect(outreachAgentPrompt).toContain("speak no more than twenty-five words");
    expect(outreachAgentPrompt).toContain("Never ask a compound");
    expect(outreachAgentPrompt).toContain("Want the twenty-second version?");
    expect(outreachAgentPrompt).toContain("Never imply that this outbound sales call is an inbound call");
  });

  it("hangs up on voicemail and sends analyzed calls to the app", () => {
    expect(outreachVoicePayload("llm-1", 1, "https://example.com/api/webhooks/retell")).toMatchObject({
      webhook_events: ["call_analyzed"],
      voicemail_option: { action: { type: "hangup" } },
      max_call_duration_ms: 180_000,
    });
  });
});
