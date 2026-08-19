import { describe, expect, it } from "vitest";
import {
  recordingPlaybackPath,
  signedRecordingLocation,
  vapiMonoRecordingEndpoint
} from "@/lib/vapi-recording";

describe("Vapi recording access", () => {
  it("builds app and Vapi URLs with encoded identifiers", () => {
    expect(recordingPlaybackPath("calls", "call/id")).toBe("/api/recordings/calls/call%2Fid");
    expect(vapiMonoRecordingEndpoint("vapi/id")).toBe("https://api.vapi.ai/call/vapi%2Fid/mono-recording");
  });

  it("accepts only absolute HTTPS signed URLs", () => {
    expect(signedRecordingLocation(new Response(null, { headers: { location: "https://storage.example/recording.wav?token=short" } })))
      .toBe("https://storage.example/recording.wav?token=short");
    expect(signedRecordingLocation(new Response(null, { headers: { location: "http://storage.example/recording.wav" } }))).toBeNull();
    expect(signedRecordingLocation(new Response(null, { headers: { location: "/recording.wav" } }))).toBeNull();
    expect(signedRecordingLocation(new Response())).toBeNull();
  });
});
