"use client";

import { useRef, useState, useEffect } from "react";
import { ArrowUp, Check, MessageSquareText } from "lucide-react";
import { answerFromKnowledge, demoKnowledge, parseAttribution, type ChatMessage, type KnowledgeEntry } from "@/lib/chat";

export function WebsiteChat({ workspace, businessName = "Oak City Heating & Air", knowledge = demoKnowledge, preview = false }: { workspace?: string; businessName?: string; knowledge?: KnowledgeEntry[]; preview?: boolean }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showLead, setShowLead] = useState(false);
  const [captured, setCaptured] = useState(false);
  const token = useRef<string | undefined>(undefined);
  const log = useRef<HTMLDivElement>(null);
  useEffect(() => { log.current?.scrollTo({ top: log.current.scrollHeight, behavior: "smooth" }); }, [messages, busy]);

  async function request(payload: Record<string, unknown>) {
    const params = Object.fromEntries(new URLSearchParams(window.location.search));
    const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ workspace, sessionToken: token.current, attribution: parseAttribution({ ...params, landing_page: params.landing_page || window.location.href, referrer: params.referrer || document.referrer }), ...payload }) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Unable to send. Please try again.");
    token.current = result.sessionToken ?? token.current;
    return result;
  }

  async function send(text: string) {
    if (busy || !text.trim()) return;
    setBusy(true); setError("");
    try {
      const answer = workspace ? (await request({ message: text.trim() })).answer : answerFromKnowledge(text, knowledge);
      setMessages((previous) => [...previous, { role: "user", content: text.trim() }, { role: "assistant", ...answer }]);
      setInput("");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to send. Please try again."); }
    finally { setBusy(false); }
  }

  async function capture(form: FormData) {
    if (busy) return;
    setBusy(true); setError("");
    try {
      if (workspace) await request({ lead: { name: form.get("name"), email: form.get("email"), phone: form.get("phone"), request: form.get("request"), consent: form.get("consent") === "on" } });
      setCaptured(true); setShowLead(false);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to save your details."); }
    finally { setBusy(false); }
  }

  return <div className="website-chat">
    <div className="website-chat-heading"><span className="chat-avatar"><MessageSquareText size={21} /></span><div><strong>{businessName}</strong><p>{workspace ? "Website assistant" : preview ? "Private knowledge preview" : "Try asking about this sample business"}</p></div><span className="rlr-live-dot" /></div>
    <div className="website-chat-log" role="log" aria-label="Chat messages" aria-live="polite" ref={log}>
      <div className="chat-message assistant">Hi! I can help with services, hours, and service-area questions. What would you like to know?{!workspace ? <small>{preview ? "Preview · Answers from your published knowledge" : "Fictional business · Sample answers"}</small> : null}</div>
      {messages.map((message, index) => <div className={`chat-message ${message.role}`} key={index}>{message.content}{message.source ? <small>Source: {message.source}</small> : null}</div>)}
      {busy ? <p className="chat-pending" role="status">One moment…</p> : null}
      {captured ? <div className="chat-message assistant"><Check size={16} /> {workspace ? "Your details are saved for the team to follow up. An appointment has not been booked." : "That’s how contact capture works. This demo hasn’t saved or sent your details."}</div> : null}
    </div>
    {!messages.length ? <div className="chat-suggestions">{["What services do you offer?", "What areas do you serve?", "How much does a repair cost?"].map((question) => <button key={question} onClick={() => send(question)} disabled={busy} type="button">{question}</button>)}</div> : null}
    {showLead ? <form className="chat-lead-form" action={capture}><p><strong>{workspace ? "Leave your details" : "Try the contact form"}</strong></p><label>Name<input name="name" autoComplete="name" required maxLength={100} /></label><label>Email<input name="email" type="email" autoComplete="email" required maxLength={200} /></label><label>Phone (optional)<input name="phone" type="tel" autoComplete="tel" maxLength={40} /></label><label>What do you need help with?<textarea name="request" required maxLength={2000} rows={3} defaultValue={messages.filter((message) => message.role === "user").map((message) => message.content).join(" · ").slice(0, 2000)} /></label><label className="chat-consent"><input name="consent" type="checkbox" required />{workspace ? "This business may contact me about my inquiry." : "I understand this is a demo and my details won’t be sent."}</label><div><button className="rlr-button rlr-button-primary" disabled={busy} type="submit">{workspace ? "Request follow-up" : "Preview capture"}</button><button type="button" onClick={() => setShowLead(false)}>Cancel</button></div></form> : <form className="chat-compose" onSubmit={(event) => { event.preventDefault(); void send(input); }}><label className="sr-only" htmlFor={`chat-input-${workspace || "demo"}`}>Your message</label><input id={`chat-input-${workspace || "demo"}`} value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask a question…" maxLength={1000} disabled={busy} required /><button aria-label="Send message" disabled={busy || !input.trim()} type="submit"><ArrowUp size={19} /></button></form>}
    {(workspace || preview) && !showLead && !captured ? <button className="chat-handoff" type="button" onClick={() => setShowLead(true)} disabled={busy}>Prefer a person? Leave your details <span aria-hidden="true">↗</span></button> : null}
    {error ? <p className="chat-error" role="alert">{error}</p> : null}
    <p className="chat-disclosure">{workspace ? <>Chats and contact requests are saved for this business. <a href="/privacy" target="_blank" rel="noreferrer">Privacy</a></> : "This is a demo. Your messages stay in this tab."}</p>
  </div>;
}
