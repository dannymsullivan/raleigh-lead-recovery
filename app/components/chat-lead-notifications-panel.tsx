import { chatNotificationIssue, loadChatLeadNotifications } from "@/lib/chat-lead-notifications";

type Action = (form: FormData) => Promise<void>;
type Search = Record<string, string | string[] | undefined>;

/** Caller authorizes clientId. Destinations and failures never appear in the public widget. */
export async function ChatLeadNotificationsPanel({ clientId, saveAction, retryAction, search }: { clientId: string; saveAction: Action; retryAction: Action; search: Search }) {
  const state = await loadChatLeadNotifications(clientId);
  if (state.unavailable) return <p className="chat-notice" role="alert">Lead alert settings are unavailable. Check the database connection and lead-alert migration. Captured leads are still available in the chat dashboard.</p>;
  return <div className="grid gap-7">
    <div><h1 className="text-3xl font-bold">Send new inquiries to the right inbox.</h1><p className="mt-3 max-w-2xl text-slate-600">Choose one person or team mailbox for website leads. When a visitor gives permission to follow up, their contact details and request go into your dashboard and an email alert is queued.</p></div>
    {!state.configured ? <p className="chat-notice" role="status"><strong>Email delivery is not configured.</strong> You can save your destination now. Alerts will show their status here until the email sender is connected; leads remain saved in your dashboard.</p> : null}
    {search.error ? <p className="chat-notice" role="alert">{search.error === "validation" ? "Enter one valid email address, a short team name, and confirm permission before enabling alerts." : "We couldn’t save these settings. Please try again."}</p> : null}
    {search.saved ? <p className="chat-notice" role="status">Alert settings saved. This applies to new inquiries; previously captured leads aren’t emailed automatically.</p> : null}
    {search.checked ? <p className="chat-notice" role="status">Retry checked. Review the latest status below; an attempt does not guarantee inbox delivery.</p> : null}
    <form action={saveAction} className="grid max-w-2xl gap-5 rounded-2xl border border-slate-200 bg-white p-6">
      <label className="grid gap-2 font-semibold">Team or recipient name<input name="destination_label" maxLength={80} required defaultValue={state.settings?.destination_label || "Your team"} className="rounded-lg border border-slate-300 p-3" /></label>
      <label className="grid gap-2 font-semibold">Destination email<input name="destination_email" type="email" maxLength={200} defaultValue={state.settings?.destination_email || ""} placeholder="office@example.com" className="rounded-lg border border-slate-300 p-3" /></label>
      <label className="flex items-start gap-3"><input name="recipient_consent" type="checkbox" className="mt-1 h-4 w-4" /><span>I control this mailbox or have the recipient’s permission to send website lead alerts to it.</span></label>
      <label className="flex items-center gap-3 font-semibold"><input name="enabled" type="checkbox" defaultChecked={state.settings?.enabled || false} className="h-4 w-4" /> Enable website lead email alerts</label>
      <p className="text-sm text-slate-600">Alerts include contact details, a short request summary, and a link that requires sign-in. No appointment is booked and no message is sent to the visitor.</p>
      <button className="rlr-button rlr-button-primary justify-self-start" type="submit">Save alert destination</button>
    </form>
    <section><h2 className="text-xl font-bold">Recent email alerts</h2><p className="mt-2 text-sm text-slate-600">“Sent to provider” means the email service accepted the alert; it does not confirm inbox delivery. Retry keeps the same message and destination to prevent duplicates.</p>
      {!state.history.length ? <p className="mt-4 text-slate-600">No alerts yet. New consented inquiries are queued after alerts are enabled.</p> : <ul className="mt-4 grid gap-3">{state.history.map(item => {
        const expired = item.status !== "sent" && Boolean(item.first_attempt_at && state.checkedAt - Date.parse(item.first_attempt_at) >= 23 * 60 * 60 * 1000);
        const active = item.status === "sending" && Boolean(item.last_attempt_at && state.checkedAt - Date.parse(item.last_attempt_at) < 120_000);
        const retryable = item.status !== "sent" && !active && !expired && item.attempts < 5;
        return <li key={item.id} className="rounded-xl border border-slate-200 bg-white p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold">{item.destination_label} · {item.destination_email}</p><p className="mt-1 text-sm text-slate-600">{new Date(item.created_at).toLocaleString("en-US", { timeZone: "America/New_York" })} Eastern · {item.status === "sent" ? "Sent to provider" : item.status === "sending" ? "Sending / awaiting confirmation" : item.status === "queued" ? "Queued" : "Needs attention"}</p></div>{retryable ? <form action={retryAction}><input type="hidden" name="chat_id" value={item.chat_id} /><button className="rounded-lg border border-slate-300 px-4 py-2 font-semibold" type="submit">Retry alert</button></form> : null}</div>{item.last_error || expired ? <p className="mt-3 text-sm text-amber-800">{chatNotificationIssue(expired ? "review_required" : item.last_error)}</p> : null}</li>;
      })}</ul>}
    </section>
  </div>;
}
