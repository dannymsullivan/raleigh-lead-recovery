import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const envPath = ".env.local";
const outputPath = resolve("public/mabel-roofing-demo.mp3");

type CallArtifact = {
  recordingUrl?: string;
  stereoRecordingUrl?: string;
  artifact?: {
    recordingUrl?: string;
    recording?: { url?: string; stereoUrl?: string; monoUrl?: string };
  };
};

function readEnvFile(): Record<string, string> {
  const raw = readFileSync(envPath, "utf8");
  return Object.fromEntries(
    raw
      .split(/\n/)
      .filter((line) => line && !line.trimStart().startsWith("#"))
      .map((line) => {
        const index = line.indexOf("=");
        return [line.slice(0, index), line.slice(index + 1)];
      })
  );
}

function requireValue(value: string | undefined, label: string): string {
  const clean = value?.trim();
  if (!clean) throw new Error(`Missing ${label}. Add it to ${envPath} or pass the call ID as the first argument.`);
  return clean;
}

async function main() {
  const env = { ...readEnvFile(), ...process.env };
  const apiKey = requireValue(env.VAPI_API_KEY, "VAPI_API_KEY");
  const callId = requireValue(process.argv[2] ?? env.VAPI_REACTIVATION_DEMO_CALL_ID, "VAPI_REACTIVATION_DEMO_CALL_ID");
  const callResponse = await fetch(`https://api.vapi.ai/call/${callId}`, {
    headers: { Authorization: `Bearer ${apiKey}` }
  });
  if (!callResponse.ok) {
    throw new Error(`Could not retrieve Vapi call ${callId}: ${callResponse.status} ${(await callResponse.text()).slice(0, 600)}`);
  }

  const call = (await callResponse.json()) as CallArtifact;
  const recordingUrl =
    call.artifact?.recording?.stereoUrl ??
    call.artifact?.recording?.monoUrl ??
    call.artifact?.recording?.url ??
    call.artifact?.recordingUrl ??
    call.stereoRecordingUrl ??
    call.recordingUrl;
  if (!recordingUrl) throw new Error("The call is complete, but Vapi has not published a recording artifact yet. Wait a minute and retry.");

  const recordingResponse = await fetch(recordingUrl);
  if (!recordingResponse.ok) throw new Error(`Could not download recording: ${recordingResponse.status}`);
  const bytes = Buffer.from(await recordingResponse.arrayBuffer());
  if (bytes.length < 1_000) throw new Error("The downloaded recording is unexpectedly small; nothing was written.");

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, bytes);
  console.log(`Saved ${bytes.length.toLocaleString()} bytes to ${outputPath}`);
  console.log("Review the full recording, then set NEXT_PUBLIC_REACTIVATION_DEMO_AUDIO_URL=/mabel-roofing-demo.mp3.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
