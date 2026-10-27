import type { ReactNode } from "react";
import { attributionSource, type ChatRecord, type chatMetrics } from "@/lib/chat";

const money = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);

/** Shared by the customer dashboard, the authenticated admin CRM, and the public sample preview. */
export function ChatReport({ records, metrics, action, preview = false, timezone = "America/New_York", pagination }: {
  records: ChatRecord[];
  metrics: ReturnType<typeof chatMetrics>;
  action?: (form: FormData) => void | Promise<void>;
  preview?: boolean;
  timezone?: string;
  pagination?: ReactNode;
}) {
  return <>
    <div className="chat-metrics">{[["Conversations", metrics.chats], ["Captured leads", metrics.leads], ["Chat → lead", `${metrics.conversion}%`], ["Booked", metrics.booked], ["Booked job value", money(metrics.revenue)]].map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
    <p className="chat-footnote">{preview ? "Illustrative data only. " : metrics.chats === 1000 ? "Metrics cover the most recent 1,000 conversations in this period. " : "Conversations started in the last 30 days. "}Leads are visitors who shared contact details and agreed to follow-up. Your team records bookings and job values. Source and campaign details come from the visitor’s browser and may be incomplete.</p>
    <section className="chat-report-panel"><h2>Where your leads come from</h2>{metrics.sources.length ? <div className="chat-table-wrap"><table className="chat-table"><thead><tr><th>Source</th><th>Chats</th><th>Leads</th><th>Booked</th><th>Value</th></tr></thead><tbody>{metrics.sources.map((row) => <tr key={row.source}><td>{row.source}</td><td>{row.chats}</td><td>{row.leads}</td><td>{row.booked}</td><td>{money(row.revenue)}</td></tr>)}</tbody></table></div> : <p>Sources will appear when visitors start conversations.</p>}</section>
    <section className="chat-report-panel"><h2>Conversations & leads</h2>{records.length ? <div className="chat-inbox">{records.map((chat) => <article key={chat.id}>
      <div className="chat-inbox-title"><div><strong>{chat.lead_name || "Website visitor"}</strong><p>{new Date(chat.created_at).toLocaleString("en-US", { timeZone: timezone })} · {attributionSource(chat.attribution)}</p></div><span className="chat-status">{chat.lead_captured_at ? chat.lead_status : "Conversation"}</span></div>
      {chat.lead_captured_at ? <p>{chat.lead_email ? <a href={`mailto:${chat.lead_email}`}>{chat.lead_email}</a> : null}{chat.lead_phone ? ` · ${chat.lead_phone}` : ""}</p> : null}
      {chat.lead_request ? <p><strong>Request:</strong> {chat.lead_request}</p> : null}
      <dl className="chat-attribution">{[["Landing page", chat.attribution.landing_page], ["Referrer", chat.attribution.referrer], ["Campaign", chat.attribution.utm_campaign], ["Medium", chat.attribution.utm_medium], ["Content", chat.attribution.utm_content], ["Term", chat.attribution.utm_term]].filter(([, value]) => value).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
      <details><summary>Read conversation ({chat.messages.length} messages)</summary><div className="chat-transcript">{chat.messages.length ? chat.messages.map((message, i) => <p key={i}><strong>{message.role === "user" ? "Visitor" : "Assistant"}</strong>{message.content}{message.source ? <small>Source: {message.source}</small> : null}</p>) : <p>Contact form submitted without a message.</p>}</div></details>
      {chat.lead_captured_at && action ? <form key={`${chat.id}-${chat.lead_status}-${chat.booked_value}`} action={action} className="chat-outcome-form"><input type="hidden" name="id" value={chat.id} /><label>Outcome<select name="status" defaultValue={chat.lead_status}><option value="new">New</option><option value="contacted">Contacted</option><option value="booked">Booked</option><option value="lost">Lost</option></select></label><label>Booked value ($)<input name="booked_value" type="number" step="0.01" min="0" max="9999999999" defaultValue={chat.booked_value ?? ""} /></label><button className="rlr-button rlr-button-primary" type="submit">{preview ? "Try saving outcome" : "Save outcome"}</button></form> : null}
    </article>)}</div> : <div className="chat-empty"><h3>Your first conversation will appear here.</h3><p>Add your business information and publish your chatbot answers. Then turn on chat and add it to your website.</p></div>}{pagination}</section>
  </>;
}
