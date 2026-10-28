import Link from "next/link";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { getAppOrigin } from "@/lib/app-url";
import { businessProfileKnowledge, effectiveChatKnowledge } from "@/lib/chat-knowledge";
import type { KnowledgeEntry } from "@/lib/chat";
import type { Client } from "@/lib/types";
import { WebsiteChat } from "./website-chat";

/** Parent routes authorize the workspace; all writes separately authorize in server actions. */
export async function ChatKnowledgeManager({ client, saveAction, toggleAction, search, profileHref = "/dashboard/settings" }: {
  client: Client;
  saveAction: (form: FormData) => void | Promise<void>;
  toggleAction: (form: FormData) => void | Promise<void>;
  search: Record<string, string | string[] | undefined>;
  profileHref?: string;
}) {
  const admin = getSupabaseAdmin();
  const [knowledge, settings] = await Promise.all([
    admin.from("website_knowledge").select("id,title,content,keywords,published").eq("client_id", client.id).order("updated_at", { ascending: false }).limit(200),
    admin.from("website_chat_settings").select("enabled,use_business_profile,engine").eq("client_id", client.id).maybeSingle()
  ]);
  if (knowledge.error || settings.error) return <div className="chat-notice" role="alert">We couldn’t load your business information. Try refreshing, or contact Danny for help.</div>;
  const entries = (knowledge.data ?? []) as KnowledgeEntry[];
  const useProfile = settings.data?.use_business_profile ?? true;
  const aiEnabled = settings.data?.engine === "retell";
  const ai = aiEnabled ? await admin.from("website_chat_agents").select("status,monthly_attempt_limit,daily_attempt_limit,synced_at").eq("client_id", client.id).maybeSingle() : null;
  const profile = businessProfileKnowledge(client);
  const effective = effectiveChatKnowledge(useProfile ? profile : [], entries);
  const embed = `<script src="${getAppOrigin()}/widget.js" data-workspace="${client.slug}" defer></script>`;
  const errors: Record<string, string> = { validation: "Add a title and answer within the field limits.", save: "We couldn’t save. Please try again.", knowledge: "Publish an answer or enable an existing business profile with services, hours, or service area before enabling chat.", configuration: "Chat setup is not finished yet. Contact Danny to help turn it on.", limit: "This knowledge base supports up to 200 custom answers." };
  return <>
    {search.knowledge_error ? <p className="chat-notice" role="alert">{errors[String(search.knowledge_error)] || errors.save}</p> : null}
    {search.knowledge_saved ? <p className="chat-notice" role="status">{aiEnabled ? "Saved. Knowledge changes need to be republished to the AI assistant before it answers more questions. Contact Danny to finish the update; contact requests remain available." : "Saved. Published answers are available to new chat questions immediately."}</p> : null}
    {aiEnabled ? <section className="chat-report-panel"><h2>AI knowledge: {ai?.data?.status === "ready" ? "ready" : "update needed"}</h2><p>{ai?.data?.status === "ready" ? "Your assistant uses a dedicated knowledge base for this business. New conversations use its latest published information." : "The assistant is waiting for your approved information to be published. Ask Danny to sync it. Visitors can still submit a follow-up request while answers are paused."}</p>{ai?.data ? <p className="chat-footnote">Configured allowance: {ai.data.monthly_attempt_limit} AI question attempts per calendar month (UTC), with a {ai.data.daily_attempt_limit} rolling daily limit. Failed provider attempts count toward usage.</p> : null}<p className="chat-footnote">Your private preview below checks source text locally. It does not run the live AI agent.</p></section> : null}
    <section className="chat-report-panel"><h2>Website chat is {settings.data?.enabled ? "enabled" : "paused"}</h2><form action={toggleAction} className="chat-enable-form"><label><input name="enabled" type="checkbox" defaultChecked={settings.data?.enabled ?? false} /> Enable website chat</label><label><input name="use_business_profile" type="checkbox" defaultChecked={useProfile} /> Use existing business profile</label><button className="rlr-button rlr-button-primary" type="submit">Save chat settings</button></form><p className="chat-footnote">Pausing stops new messages and contact submissions. Existing conversations remain in the dashboard.</p><details><summary>Install on the website</summary><p>Add this script before the website’s closing body tag. The widget carries the landing page, referrer, and UTM campaign tags into each conversation.</p><pre className="chat-embed-code">{embed}</pre>{settings.data?.enabled ? <Link href={`/chat/${client.slug}`} target="_blank">Open the live chatbot ↗</Link> : <p>Enable chat to activate the hosted page and widget.</p>}</details></section>
    <div className="knowledge-workspace"><div>
      <section className="chat-report-panel"><h2>From the existing business profile</h2><p>Services, hours, and service area use the profile already saved for this workspace. Owner contact details and internal call rules are excluded.</p><Link className="rlr-inline-link" href={profileHref}>Manage business profile →</Link>{profile.length ? profile.map((entry) => <details className="mt-4" key={entry.id}><summary>{entry.title} <span className="chat-status">{useProfile ? "From profile" : "Not in chat"}</span></summary><p>{entry.content}</p></details>) : <p>Add your services, hours, or service area in your business profile to get started.</p>}<p className="chat-footnote">A published custom answer with the same topic title replaces the profile answer in chat.</p></section>
      <section className="chat-report-panel"><h2>Add an approved answer</h2><KnowledgeForm action={saveAction} /></section>
      {entries.map((entry) => <section className="chat-report-panel" key={entry.id}><details><summary>{entry.title} <span className="chat-status">{entry.published ? "Published" : "Draft"}</span></summary><KnowledgeForm action={saveAction} entry={entry} /></details></section>)}
    </div><aside><p className="chat-footnote">Private preview · Uses your published answers and enabled business information. This preview does not record analytics or submit contact details.</p><WebsiteChat preview businessName={client.business_name} knowledge={effective} /></aside></div>
  </>;
}

function KnowledgeForm({ entry, action }: { entry?: KnowledgeEntry; action: (form: FormData) => void | Promise<void> }) {
  return <form action={action} className="knowledge-form"><input type="hidden" name="id" value={entry?.id ?? ""} /><label>Topic<input name="title" required maxLength={120} defaultValue={entry?.title} placeholder="e.g. Service area" /></label><label>Approved answer<textarea name="content" required maxLength={3000} rows={5} defaultValue={entry?.content} placeholder="Write the answer customers should receive." /></label><label>Search keywords<input name="keywords" maxLength={500} defaultValue={entry?.keywords} placeholder="e.g. location, area, city, ZIP" /></label><label className="chat-publish"><input name="published" type="checkbox" defaultChecked={entry?.published ?? true} /> Publish this answer</label><button className="rlr-button rlr-button-primary" type="submit">{entry ? "Save answer" : "Add answer"}</button></form>;
}
