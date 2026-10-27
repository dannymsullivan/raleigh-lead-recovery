"use client";

import { useState } from "react";
import Link from "next/link";
import { ChatReport } from "@/app/components/chat-report";
import { chatMetrics, parseAttribution, type ChatRecord } from "@/lib/chat";

const samples: ChatRecord[] = [
  { id: "sample-1", created_at: "2026-10-27T18:43:00Z", attribution: parseAttribution({ landing_page: "https://example.com/ac-repair", utm_source: "google", utm_medium: "cpc", utm_campaign: "Summer AC repair" }), messages: [{ role: "user", content: "Can you help with AC repair? My upstairs AC isn’t cooling." }, { role: "assistant", content: "Our sample services include AC repair. Leave your contact details and service request for the team to confirm the next step.", source: "Service area" }], lead_name: "Jordan M. · sample", lead_email: "jordan@example.com", lead_phone: null, lead_request: "Upstairs AC stopped cooling. Prefer a morning callback.", lead_captured_at: "2026-10-27T18:44:00Z", lead_status: "new", booked_value: null },
  { id: "sample-2", created_at: "2026-10-26T14:10:00Z", attribution: parseAttribution({ landing_page: "https://example.com/maintenance", referrer: "https://google.com/search", utm_campaign: "" }), messages: [{ role: "user", content: "Can I get a maintenance estimate?" }, { role: "assistant", content: "The team can provide an estimate after reviewing the system details." }], lead_name: "Alex R. · sample", lead_email: "alex@example.com", lead_phone: null, lead_request: "Seasonal maintenance estimate.", lead_captured_at: "2026-10-26T14:11:00Z", lead_status: "booked", booked_value: 250 },
  { id: "sample-3", created_at: "2026-10-26T13:00:00Z", attribution: parseAttribution({ landing_page: "https://example.com/", utm_source: "newsletter", utm_medium: "email", utm_campaign: "Fall check-in" }), messages: [{ role: "user", content: "What are your hours?" }, { role: "assistant", content: "The sample office is open Monday–Friday, 8 AM–5 PM Eastern.", source: "Hours" }], lead_name: null, lead_email: null, lead_phone: null, lead_request: null, lead_captured_at: null, lead_status: "new", booked_value: null },
];

export function ChatDashboardDemo() {
  const [chats, setChats] = useState(samples);
  const metrics = chatMetrics(chats);
  return <>
    <div className="chat-dashboard-heading"><div><p className="rlr-kicker">Dashboard preview · Fictional sample data</p><h1>See what your chatbot brings in.</h1><p>Read sample conversations, see where leads came from, and try marking a lead as booked. Changes stay in this browser tab.</p></div><Link className="rlr-button rlr-button-secondary" href="/#business-knowledge">How to add your business information →</Link></div>
    <div className="chat-notice">This is an interactive product preview. Your live customer dashboard uses your private workspace and actual conversations.</div>
    <ChatReport records={chats} metrics={metrics} preview action={(form) => { const id = form.get("id"); const status = form.get("status") as ChatRecord["lead_status"]; const value = Number(form.get("booked_value")) || 0; setChats((previous) => previous.map((item) => item.id === id ? { ...item, lead_status: status, booked_value: status === "booked" ? value : null } : item)); }} />
    <button className="rlr-button rlr-button-secondary" type="button" onClick={() => setChats(samples)}>Reset sample data</button>
  </>;
}
