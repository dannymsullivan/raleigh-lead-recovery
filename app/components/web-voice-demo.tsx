"use client";

import { useEffect, useRef, useState } from "react";
import { LoaderCircle, Mic, PhoneOff, Radio } from "lucide-react";
import { RetellWebClient } from "retell-client-js-sdk";

type DemoState = "idle" | "connecting" | "active" | "error";

export function WebVoiceDemo({ assistantName = "our AI receptionist", compact = false }: { assistantName?: string; compact?: boolean }) {
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
        body: JSON.stringify({ website: "" })
      });
      const result = await response.json() as { accessToken?: string; error?: string };
      if (!response.ok || !result.accessToken) throw new Error(result.error || "Unable to start the conversation.");

      const client = new RetellWebClient();
      clientRef.current = client;
      client.on("call_started", () => setState("active"));
      client.on("call_ended", () => {
        setAgentTalking(false);
        setState("idle");
        clientRef.current = null;
      });
      client.on("agent_start_talking", () => setAgentTalking(true));
      client.on("agent_stop_talking", () => setAgentTalking(false));
      client.on("error", () => {
        client.stopCall();
        clientRef.current = null;
        setAgentTalking(false);
        setError("The conversation ended unexpectedly. Please try again.");
        setState("error");
      });
      await client.startCall({ accessToken: result.accessToken, sampleRate: 24_000 });
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

  return (
    <div className={`web-voice-demo ${compact ? "compact" : ""}`}>
      {state === "active" ? (
        <button className="button button-dark receptionist-call-button web-voice-stop" type="button" onClick={stop}>
          <PhoneOff aria-hidden="true" /> End conversation
        </button>
      ) : (
        <button className="button button-dark receptionist-call-button" type="button" onClick={start} disabled={state === "connecting"}>
          {state === "connecting" ? <LoaderCircle className="web-voice-spinner" aria-hidden="true" /> : <Mic aria-hidden="true" />}
          {state === "connecting" ? "Connecting…" : `Talk to ${assistantName} now`}
        </button>
      )}
      {!compact ? (
        <p className={`web-voice-status ${state}`} aria-live="polite">
          {state === "active" ? <><Radio className={agentTalking ? "talking" : ""} aria-hidden="true" /> {agentTalking ? `${assistantName} is speaking` : "Listening—go ahead"}</> : "Live browser demo · Uses your microphone · No phone number"}
        </p>
      ) : null}
      {error ? <p className="web-voice-error" role="alert">{error}</p> : null}
    </div>
  );
}
