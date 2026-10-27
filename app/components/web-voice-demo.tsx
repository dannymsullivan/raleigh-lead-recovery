"use client";

import { useEffect, useRef, useState } from "react";
import { LoaderCircle, PhoneOff, Radio } from "lucide-react";
import { RetellWebClient, type StartCallConfig } from "retell-client-js-sdk";
import type { WebDemoMode } from "@/lib/web-demo-config";

type DemoState = "idle" | "connecting" | "active" | "error";

export function WebVoiceDemo({
  compact = false,
  label = "Try it now",
  mode = "receptionist",
  visual = "button",
}: {
  compact?: boolean;
  label?: string;
  mode?: WebDemoMode;
  visual?: "button" | "orb";
}) {
  const clientRef = useRef<RetellWebClient | null>(null);
  const [state, setState] = useState<DemoState>("idle");
  const [agentTalking, setAgentTalking] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => () => clientRef.current?.stopCall(), []);

  async function start() {
    setState("connecting");
    setError("");
    try {
      const response = await fetch("/api/web-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ website: "", mode })
      });
      const result = await response.json() as Partial<StartCallConfig> & { error?: string };
      if (!response.ok || !result.accessToken || !result.callId || !result.transport || !result.iceServers) throw new Error(result.error || "Unable to start the conversation.");

      const client = new RetellWebClient();
      clientRef.current = client;
      client.on("call_started", () => setState("active"));
      client.on("call_ended", () => {
        setAgentTalking(false);
        setState("idle");
        clientRef.current = null;
      });
      // v3 gateway audio does not emit the old speaking-boundary events.
      client.on("audio", (samples: Float32Array) => {
        const energy = samples.reduce((sum, sample) => sum + sample * sample, 0);
        setAgentTalking(samples.length > 0 && Math.sqrt(energy / samples.length) > .015);
      });
      client.on("error", () => {
        client.stopCall();
        clientRef.current = null;
        setAgentTalking(false);
        setError("The conversation ended unexpectedly. Please try again.");
        setState("error");
      });
      await client.startCall({ callId: result.callId, accessToken: result.accessToken, transport: result.transport, iceServers: result.iceServers, sampleRate: 24_000, emitRawAudioSamples: true });
    } catch (caught) {
      clientRef.current?.stopCall();
      clientRef.current = null;
      setError(caught instanceof Error ? caught.message : "Unable to start the conversation.");
      setState("error");
    }
  }

  function stop() {
    clientRef.current?.stopCall();
    clientRef.current = null;
    setAgentTalking(false);
    setState("idle");
  }

  if (visual === "orb") {
    const isActive = state === "active";
    const isConnecting = state === "connecting";
    const statusLabel = state === "error"
      ? "Demo unavailable right now"
      : isActive
      ? agentTalking
        ? "Chloe is speaking"
        : "Listening—go ahead"
      : isConnecting
        ? "Opening a secure demo"
        : "Ready when you are";

    return (
      <div className={`web-voice-demo voice-orb-demo is-${state} ${agentTalking ? "is-talking" : ""}`}>
        <button
          className="voice-orb-button"
          type="button"
          onClick={isActive ? stop : start}
          disabled={isConnecting}
          aria-label={isActive ? "End live conversation with Chloe" : "Start a live conversation with Chloe"}
        >
          <span className="voice-orb-halo halo-one" aria-hidden="true" />
          <span className="voice-orb-halo halo-two" aria-hidden="true" />
          <span className="voice-orb-sphere" aria-hidden="true">
            <span className="voice-orb-glow" />
            <span className="voice-orb-wave">
              <i /><i /><i /><i /><i />
            </span>
          </span>
          <span className="voice-orb-action">
            {isActive ? <PhoneOff aria-hidden="true" /> : isConnecting ? <LoaderCircle className="web-voice-spinner" aria-hidden="true" /> : <Radio aria-hidden="true" />}
            {isActive ? "End conversation" : isConnecting ? "Connecting…" : state === "error" ? "Try demo again" : label}
          </span>
        </button>
        <p className="voice-orb-status" aria-live="polite">
          <span aria-hidden="true" /> {statusLabel}
        </p>
        <p className="voice-orb-privacy">Live browser demo · Uses your microphone · No phone number needed</p>
        {error ? <p className="web-voice-error" role="alert">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className={`web-voice-demo ${compact ? "compact" : ""}`}>
      {state === "active" ? (
        <button className="button button-dark receptionist-call-button web-voice-stop" type="button" onClick={stop}>
          <PhoneOff aria-hidden="true" /> End conversation
        </button>
      ) : (
        <button className="button button-dark receptionist-call-button" type="button" onClick={start} disabled={state === "connecting"}>
          {state === "connecting" ? <LoaderCircle className="web-voice-spinner" aria-hidden="true" /> : (
            <span className="web-voice-waveform" aria-hidden="true">
              <span /><span /><span /><span /><span />
            </span>
          )}
          {state === "connecting" ? "Connecting…" : label}
        </button>
      )}
      {!compact ? (
        <p className={`web-voice-status ${state}`} aria-live="polite">
          {state === "active" ? <><Radio className={agentTalking ? "talking" : ""} aria-hidden="true" /> {agentTalking ? "Raleigh Lead Recovery is speaking" : "Listening—go ahead"}</> : "Live browser demo · Uses your microphone · No phone number"}
        </p>
      ) : null}
      {error ? <p className="web-voice-error" role="alert">{error}</p> : null}
    </div>
  );
}
