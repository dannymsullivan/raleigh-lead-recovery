export type RecordingSource = "calls" | "reactivation-attempts";

export function recordingPlaybackPath(source: RecordingSource, recordId: string): string {
  return `/api/recordings/${source}/${encodeURIComponent(recordId)}`;
}
