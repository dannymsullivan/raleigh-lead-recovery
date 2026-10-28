"use client";

import { useRef, useState, useEffect, useEffectEvent } from "react";
import { ArrowUp, BookOpen, Check, MessageSquareText, RotateCcw } from "lucide-react";
import { answerFromKnowledge, parseAttribution, type ChatMessage, type KnowledgeEntry } from "@/lib/chat";

import { demoKnowledge, demoScenarios, demoBusinessName } from "@/lib/demo-knowledge";

export function WebsiteChat({ workspace, businessName = demoBusinessName, knowledge = demoKnowledge, preview = false }: { workspace?: string; businessName?: string; knowledge?: KnowledgeEntry[]; preview?: boolean }) {
  const isDemo = !workspace && !preview;
  const sending = useRef(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showLead, setShowLead] = useState(false);
  const [captured, setCaptured] = useState(false);
  const [needsRestart, setNeedsRestart] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);
  const [scenario, setScenario] = useState<string | null>(null);
  const token = useRef<string | undefined>(undefined);
  const log = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const container = log.current;
    if (!container) return;
    const latest = container.querySelector<HTMLElement>(".chat-message:last-of-type");
    const answerStarted = isDemo && messages.at(-1)?.role === "assistant";
    const top = answerStarted && latest
      ? container.scrollTop + latest.getBoundingClientRect().top - container.getBoundingClientRect().top - 12
      : container.scrollHeight;
    container.scrollTo({ top, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }, [messages, busy, isDemo]);

  async function request(payload: Record<string, unknown>) {
    const params = Object.fromEntries(new URLSearchParams(window.location.search));
    const response = await fetch(isDemo ? "/api/chat/demo" : "/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ workspace, sessionToken: token.current, attribution: parseAttribution({ ...params, landing_page: params.landing_page || window.location.href, referrer: params.referrer || document.referrer }), ...payload }) });
    const result = await response.json();
    token.current = result.sessionToken ?? token.current;
    if (result.resetSession) setNeedsRestart(true);
    if (isDemo && response.status === 429) setRateLimited(true);
    if (!response.ok) throw new Error(result.error || "Unable to send. Please try again.");
    return result;
  }

  async function send(text: string) {
    if (sending.current || needsRestart || rateLimited || !text.trim()) return;
    sending.current = true;
    setBusy(true); setError("");
    const question = text.trim().slice(0, 1000);
    setMessages((previous) => [...previous, { role: "user", content: question }]);
    setInput("");
    try {
      const answer = workspace || isDemo ? (await request({ message: question })).answer : answerFromKnowledge(question, knowledge);
      setMessages((previous) => [...previous, { role: "assistant", ...answer }]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to send. Please try again.");
      setInput(question);
    } finally { sending.current = false; setBusy(false); }
  }

  const receiveDemoQuestion = useEffectEvent((event: Event) => {
    const question = (event as CustomEvent<{ question?: unknown }>).detail?.question;
    if (isDemo && typeof question === "string") { setScenario(null); void send(question); }
  });
  useEffect(() => {
    if (!isDemo) return;
    const listener = (event: Event) => receiveDemoQuestion(event);
    window.addEventListener("snappy-demo-question", listener);
    return () => window.removeEventListener("snappy-demo-question", listener);
  }, [isDemo]);

  function reset() {
    if (sending.current || rateLimited) return;
    token.current = undefined;
    setMessages([]); setScenario(null); setNeedsRestart(false); setError(""); setInput(""); setCaptured(false); setShowLead(false);
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

  return <div className={`website-chat${isDemo ? " website-chat-demo" : ""}`} data-has-messages={messages.length > 0}>
    <div className="website-chat-heading"><span className="chat-avatar"><MessageSquareText size={21} /></span><div><strong>{businessName}</strong><p>{workspace ? "Website assistant" : preview ? "Private knowledge preview" : "AI service advisor · Available 24/7"}</p></div>{isDemo ? <button className="chat-reset" type="button" onClick={reset} disabled={busy || rateLimited} aria-label="Start a new conversation" title="Start a new conversation"><RotateCcw size={16} /></button> : <span className="rlr-live-dot" />}</div>
    {isDemo ? <a className="chat-knowledge-link" href="/knowledge-base#knowledge-library" target="_blank" rel="noreferrer"><BookOpen size={15} aria-hidden="true" /><span>Explore the knowledge base</span><strong>{demoKnowledge.length} topics ↗</strong></a> : null}
    {isDemo ? <p className="chat-demo-allowance">6 AI questions per chat · Knowledge library always free</p> : null}
    <div className="website-chat-log" role="log" aria-label="Chat messages" aria-live="polite" ref={log}>
      <div className="chat-message assistant">{isDemo ? "Hi, I’m Oak City’s AI advisor. Ask about pricing, compare plans, or tell me what’s happening with your heating or cooling." : "Hi! I can help with services, hours, and service-area questions. What would you like to know?"}{!workspace ? <small>{preview ? "Preview · Answers from your published knowledge" : "Fictional HVAC business · Sample prices & policies"}</small> : null}</div>
      {messages.map((message, index) => <div className={`chat-message ${message.role}`} key={index}>
        <div className="chat-message-text">{message.content}</div>
        {message.sources?.length ? <details className="chat-sources"><summary><BookOpen size={13} aria-hidden="true" />{message.sources.length} knowledge {message.sources.length === 1 ? "source" : "sources"}</summary><div>{message.sources.map((source) => <details key={source.id}><summary>{source.title}</summary><p>{source.content}</p><a href={`/knowledge-base#knowledge-${source.id}`} target="_blank" rel="noreferrer">View in the knowledge base ↗</a></details>)}</div></details> : message.source ? <small>Source: {message.source}</small> : null}
      </div>)}
      {busy ? <p className="chat-pending" role="status">{isDemo ? "Checking the business handbook…" : "One moment…"}</p> : null}
      {captured ? <div className="chat-message assistant"><Check size={16} /> {workspace ? "Your details are saved for the team to follow up. An appointment has not been booked." : "That’s how contact capture works. This demo hasn’t saved or sent your details."}</div> : null}
    </div>
    {isDemo && !rateLimited ? <div className="chat-demo-prompts"><p>{messages.length ? "Keep exploring" : "Give it a real situation"}</p><div className="chat-suggestions">{!messages.length ? demoScenarios.map((item) => <button key={item.id} type="button" disabled={busy || needsRestart} title={item.prompt} onClick={() => { setScenario(item.id); void send(item.prompt); }}>{item.label}</button>) : <><button type="button" disabled={busy || needsRestart} onClick={() => { const selected = demoScenarios.find((item) => item.id === scenario); setScenario(null); void send(selected?.followUp || "Can you explain the costs and any important exceptions?"); }}>{scenario ? "Ask the follow-up →" : "Go deeper on costs →"}</button><a href="/knowledge-base">Explore all {demoKnowledge.length} topics ↗</a></>}</div></div> : !isDemo && !messages.length ? <div className="chat-suggestions">{["What services do you offer?", "What areas do you serve?", "How much does a repair cost?"].map((question) => <button key={question} onClick={() => send(question)} disabled={busy} type="button">{question}</button>)}</div> : null}
    {showLead ? <form className="chat-lead-form" action={capture}><p><strong>{workspace ? "Leave your details" : "Try the contact form"}</strong></p><label>Name<input name="name" autoComplete="name" required maxLength={100} /></label><label>Email<input name="email" type="email" autoComplete="email" required maxLength={200} /></label><label>Phone (optional)<input name="phone" type="tel" autoComplete="tel" maxLength={40} /></label><label>What do you need help with?<textarea name="request" required maxLength={2000} rows={3} defaultValue={messages.filter((message) => message.role === "user").map((message) => message.content).join(" · ").slice(0, 2000)} /></label><label className="chat-consent"><input name="consent" type="checkbox" required />{workspace ? "This business may contact me about my inquiry." : "I understand this is a demo and my details won’t be sent."}</label><div><button className="rlr-button rlr-button-primary" disabled={busy} type="submit">{workspace ? "Request follow-up" : "Preview capture"}</button><button type="button" onClick={() => setShowLead(false)}>Cancel</button></div></form> : <form className="chat-compose" onSubmit={(event) => { event.preventDefault(); void send(input); }}><label className="sr-only" htmlFor={`chat-input-${workspace || "demo"}`}>Your message</label><input id={`chat-input-${workspace || "demo"}`} value={input} onChange={(event) => setInput(event.target.value)} placeholder={isDemo ? "Ask anything about this business…" : "Ask a question…"} maxLength={1000} disabled={busy || needsRestart || rateLimited} required /><button aria-label="Send message" disabled={busy || needsRestart || rateLimited || !input.trim()} type="submit"><ArrowUp size={19} /></button></form>}
    {(workspace || preview) && !showLead && !captured ? <button className="chat-handoff" type="button" onClick={() => setShowLead(true)} disabled={busy}>{workspace ? "Ask the team to follow up" : "Try the contact form"} <span aria-hidden="true">↗</span></button> : null}
    {error ? <div className="chat-error" role="alert"><p>{error}</p>{needsRestart && !rateLimited ? <button className="chat-restart-action" type="button" onClick={reset}>Start a new conversation</button> : null}</div> : null}
    {isDemo && rateLimited ? <div className="chat-limit-actions"><a href="/knowledge-base#knowledge-library" target="_blank" rel="noreferrer"><BookOpen size={15} aria-hidden="true" />Browse all {demoKnowledge.length} topics free ↗</a><a href="/get-started">Build this for my business →</a></div> : null}
    <p className="chat-disclosure">{workspace ? <>Chats and contact requests are saved for this business. <a href="/privacy" target="_blank" rel="noreferrer">Privacy</a></> : isDemo ? <>AI demo · No real bookings. Messages are processed by Retell and retained for up to 7 days. <a href="/privacy" target="_blank" rel="noreferrer">Privacy</a></> : "Private preview. Your messages stay in this tab."}</p>
  </div>;
}
