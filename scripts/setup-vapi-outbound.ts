import { readFileSync, writeFileSync } from "node:fs";

const envPath = ".env.local";
const assistantName = "Mabel — Lead Reactivation";
type EnvMap = Record<string, string>;
type Assistant = { id: string; name?: string };

function env(): EnvMap {
  const file = Object.fromEntries(readFileSync(envPath, "utf8").split(/\n/).filter((line) => line && !line.trimStart().startsWith("#")).map((line) => { const index = line.indexOf("="); return [line.slice(0, index), line.slice(index + 1)]; }));
  return { ...file, ...Object.fromEntries(Object.entries(process.env).filter((entry): entry is [string,string] => typeof entry[1] === "string")) };
}
function need(values: EnvMap, key: string): string { const value = values[key]?.trim(); if (!value) throw new Error(`Missing ${key}`); return value; }
function save(key: string, value: string) { const raw = readFileSync(envPath, "utf8"); const lines = raw.split(/\n/); const next = lines.some((line) => line.startsWith(`${key}=`)) ? lines.map((line) => line.startsWith(`${key}=`) ? `${key}=${value}` : line) : [...lines.filter((line,index) => line || index < lines.length - 1), `${key}=${value}`]; writeFileSync(envPath, `${next.filter((line,index) => line || index < next.length - 1).join("\n")}\n`); }
async function request<T>(path: string, options: RequestInit, apiKey: string): Promise<T> { const response = await fetch(`https://api.vapi.ai${path}`, { ...options, headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" } }); if (!response.ok) throw new Error(`Vapi ${response.status}: ${(await response.text()).slice(0,1000)}`); return await response.json() as T; }

const schema = { type: "object", properties: {
  outcome: { type: "string", enum: ["interested_now", "follow_up_later", "project_completed", "not_interested", "wrong_number", "do_not_call", "no_answer", "failed"] },
  project_type: { type: "string", enum: ["repair", "replacement", "inspection", "maintenance", "other", "unknown"] },
  requested_timing: { type: "string" },
  qualification_notes: { type: "string" },
  next_step: { type: "string", enum: ["book_inspection", "owner_callback", "scheduled_follow_up", "close_record", "suppress"] },
  opt_out: { type: "boolean" }
}, required: ["outcome", "next_step", "opt_out"] };

const prompt = `[Identity]
You are Mabel, the automated lead-recovery assistant for {{business_name}}. You are calling {{contact_name}} about {{lead_source}}, originally received {{lead_age_context}}. Be transparent, warm, concise, and respectful.

[Known context]
Service: {{service_type}}
Prior notes: {{prior_context}}
Owner: {{owner_name}}
Callback expectation: {{callback_expectation}}

[Conversational style]
Sound like a capable, friendly coordinator—not a script reader. Use contractions and plain spoken English. Keep most turns to one or two short sentences, then let the person respond. Vary acknowledgements naturally among phrases such as “Got it,” “That makes sense,” “Okay,” and “I understand,” but use at most one and do not acknowledge every answer. Avoid repeatedly saying “perfect,” repeating the person's words back to them, stacking questions, or using sales jargon.

[Interruption handling]
If the person starts speaking, stop immediately and listen until they finish. Briefly acknowledge the new information when appropriate, answer or follow their direction first, and then resume only the part of the prior question that is still needed. Never restart the entire sentence or continue as though they did not interrupt. Treat short listening cues such as “yeah,” “right,” “okay,” “uh-huh,” and “mm-hmm” as acknowledgements rather than a new answer unless the context clearly indicates otherwise.

[Goal]
Learn whether the original need is still active. If it is, capture just enough current context to make the handoff useful and ask whether the person wants the team to call them. Interested people must get a clear, smooth next step.

[Flow]
1. Ask permission to take 30 seconds.
2. Ask whether the original project or service need is still unresolved.
3. If active, ask what has changed, the rough timing, and whether they want {{business_name}} to reconnect.
4. If yes, confirm their preferred callback window. Explain naturally that you will send the conversation and preferred timing to {{owner_name}} so they will not need to repeat everything.
5. If they want an appointment, record book_inspection as the requested next step. Never invent or confirm a calendar time.
6. Summarize and close in one sentence.

[Branches]
- Interested now: outcome interested_now; capture project type, timing, useful notes, and owner_callback or book_inspection.
- Later: outcome follow_up_later; capture the requested month or timeframe.
- Already completed: congratulate them, outcome project_completed, then end.
- Not interested: acknowledge once, outcome not_interested, then end.
- Wrong number: apologize, outcome wrong_number, then end.
- Opt out: apologize, confirm removal, outcome do_not_call and opt_out true, then end immediately.
- Voicemail: leave a brief transparent message with the business name and do not mention sensitive prior details.

[Hard rules]
Never claim to be human. Never pressure, argue, or continue after an opt-out. Never invent prices, availability, insurance outcomes, appointments, discounts, or business policies. Never collect payment, policy, or sensitive personal information. Ask one question at a time and aim for under three minutes.`;

function payload(webhook: string, secret: string) { return {
  name: assistantName,
  firstMessage: "Hi {{contact_name}}, this is Mabel, an automated assistant calling for {{business_name}} about an earlier {{service_type}} inquiry. Is now an okay time for a quick question?",
  firstMessageInterruptionsEnabled: true,
  maxDurationSeconds: 240,
  startSpeakingPlan: {
    waitSeconds: 0.4,
    smartEndpointingPlan: {
      provider: "livekit",
      waitFunction: "2000 / (1 + exp(-10 * (x - 0.5)))"
    }
  },
  stopSpeakingPlan: {
    numWords: 0,
    voiceSeconds: 0.2,
    backoffSeconds: 1,
    acknowledgementPhrases: [
      "i understand", "i see", "right", "okay", "ok", "sure", "alright", "got it", "yeah", "yes",
      "uh-huh", "mm-hmm", "gotcha", "mhmm", "ah", "yeah okay", "yeah sure"
    ]
  },
  serverMessages: ["end-of-call-report"],
  server: { url: webhook, timeoutSeconds: 20, headers: { "X-Vapi-Secret": secret } },
  artifactPlan: { recordingEnabled: true, recordingFormat: "mp3", loggingEnabled: true, transcriptPlan: { enabled: true, assistantName: "Mabel", userName: "Lead" } },
  model: { provider: "openai", model: "gpt-4.1", temperature: 0.3, maxTokens: 350, messages: [{ role: "system", content: prompt }] },
  transcriber: { provider: "deepgram", model: "nova-3", language: "en-US", smartFormat: true, numerals: true, endpointing: 300 },
  voice: { provider: "vapi", voiceId: "Savannah", version: "latest", language: "en-US", speed: 1 },
  analysisPlan: { summaryPlan: { enabled: true, timeoutSeconds: 10 }, structuredDataPlan: { enabled: true, timeoutSeconds: 15, schema } },
  metadata: { app: "lead-reactivation", mode: "production" }
}; }

async function main() { const values = env(); const apiKey = need(values, "VAPI_API_KEY"); const secret = need(values, "VAPI_WEBHOOK_SECRET"); const webhook = values.VAPI_PUBLIC_WEBHOOK_URL?.trim() || `${need(values, "NEXT_PUBLIC_APP_URL").replace(/\/$/, "")}/api/webhooks/vapi`; const assistants = await request<Assistant[]>("/assistant?limit=1000", { method: "GET" }, apiKey); const existing = assistants.find((assistant) => assistant.name === assistantName); const assistant = existing ? await request<Assistant>(`/assistant/${existing.id}`, { method: "PATCH", body: JSON.stringify(payload(webhook, secret)) }, apiKey) : await request<Assistant>("/assistant", { method: "POST", body: JSON.stringify(payload(webhook, secret)) }, apiKey); save("VAPI_OUTBOUND_ASSISTANT_ID", assistant.id); console.log(`${existing ? "Updated" : "Created"} ${assistantName}`); console.log(`Assistant ID: ${assistant.id}`); console.log(`Webhook: ${webhook}`); }
main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exit(1); });
