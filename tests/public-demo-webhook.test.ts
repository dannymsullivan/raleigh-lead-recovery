import { describe, expect, it } from "vitest";
import { extractPublicDemoCallEvent } from "@/lib/public-demo-webhook";

describe("public demo Vapi events", () => {
  it("recognizes only public demo call metadata", () => {
    expect(extractPublicDemoCallEvent({ message: { type: "end-of-call-report", call: { id: "call-1", metadata: { app: "public-demo", requestId: "request-1" } } } })).toEqual({ callId: "call-1", eventType: "end-of-call-report" });
    expect(extractPublicDemoCallEvent({ message: { call: { metadata: { app: "lead-reactivation" } } } })).toBeNull();
  });
});
