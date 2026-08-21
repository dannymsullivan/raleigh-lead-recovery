import { describe, expect, it } from "vitest";
import { extractPublicDemoCallEvent } from "@/lib/public-demo-webhook";

describe("public demo Retell events", () => {
  it("recognizes only public demo call metadata", () => {
    expect(extractPublicDemoCallEvent({ event: "call_analyzed", call: { call_id: "call-1", metadata: { app: "public-demo", requestId: "request-1" } } })).toEqual({ callId: "call-1", eventType: "call_analyzed", channel: "phone" });
    expect(extractPublicDemoCallEvent({ call: { metadata: { app: "lead-reactivation" } } })).toBeNull();
  });
});
