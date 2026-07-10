import { describe, expect, it } from "vitest";
import { extractVapiCall } from "@/lib/vapi";

describe("extractVapiCall", () => {
  it("maps Vapi end-of-call analysis into the app call shape", () => {
    const extracted = extractVapiCall({
      message: {
        type: "end-of-call-report",
        call: {
          id: "call_123",
          assistantId: "asst_123",
          phoneNumberId: "pn_123",
          customer: { number: "+19195550123" },
          durationSeconds: 97
        },
        analysis: {
          summary: "Caller has a leaking water heater.",
          structuredData: {
            caller_name: "Tanya Mills",
            callback_number: "+19195554821",
            service_address: "123 Oak Valley Dr, Raleigh, NC",
            issue_description: "Water heater leak",
            urgency: "emergency",
            lead_type: "new_job",
            estimated_job_value_band: "800_2000",
            requested_timing: "Tonight",
            callback_promised_by: "15 minutes"
          }
        },
        transcript: "Riley: What's going on?",
        recordingUrl: "https://example.com/recording.wav"
      }
    });

    expect(extracted).toMatchObject({
      eventType: "end-of-call-report",
      vapiCallId: "call_123",
      assistantId: "asst_123",
      phoneNumberId: "pn_123",
      callerNumber: "+19195550123",
      callerName: "Tanya Mills",
      callbackNumber: "+19195554821",
      urgency: "emergency",
      leadType: "new_job",
      estimatedValueBand: "800_2000",
      durationSeconds: 97
    });
  });

  it("falls back to safe enum values when the payload drifts", () => {
    const extracted = extractVapiCall({
      message: {
        type: "end-of-call-report",
        call: { id: "call_123" },
        analysis: {
          structuredData: {
            urgency: "right_now",
            lead_type: "mystery",
            estimated_job_value_band: "huge"
          }
        }
      }
    });

    expect(extracted.urgency).toBe("other");
    expect(extracted.leadType).toBe("other");
    expect(extracted.estimatedValueBand).toBe("unknown");
  });
});
