export type RecordingSource = "calls" | "reactivation-attempts";

export function recordingPlaybackPath(source: RecordingSource, recordId: string): string {
  return `/api/recordings/${source}/${encodeURIComponent(recordId)}`;
}

export function vapiMonoRecordingEndpoint(callId: string): string {
  return `https://api.vapi.ai/call/${encodeURIComponent(callId)}/mono-recording`;
}

export function signedRecordingLocation(response: Response): string | null {
  const location = response.headers.get("location");
  if (!location) return null;

  try {
    const url = new URL(location);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}
