import { readFileSync, writeFileSync } from "node:fs";

const envPath = ".env.local";
const assistantName = "Mabel — Lead Reactivation Demo";

type EnvMap = Record<string, string>;
type VapiAssistant = { id: string; name?: string };

function readEnvFile(): EnvMap {
  const raw = readFileSync(envPath, "utf8");
  const fileEnv = Object.fromEntries(
    raw
      .split(/\n/)
      .filter((line) => line && !line.trimStart().startsWith("#"))
      .map((line) => {
        const index = line.indexOf("=");
        return [line.slice(0, index), line.slice(index + 1)];
      })
  );
  const shellEnv = Object.fromEntries(
    Object.entries(process.env).filter((entry): entry is [string, string] => typeof entry[1] === "string")
  );
  return { ...fileEnv, ...shellEnv };
}

function upsertEnvValue(key: string, value: string): void {
  const raw = readFileSync(envPath, "utf8");
  const lines = raw.split(/\n/);
  const next = lines.some((line) => line.startsWith(`${key}=`))
    ? lines.map((line) => (line.startsWith(`${key}=`) ? `${key}=${value}` : line))
    : [...lines.filter((line, index) => line || index < lines.length - 1), `${key}=${value}`];
  writeFileSync(envPath, `${next.filter((line, index) => line || index < next.length - 1).join("\n")}\n`);
}

function requireEnv(env: EnvMap, key: string): string {
  const value = env[key]?.trim();
  if (!value) throw new Error(`Missing ${key} in ${envPath}`);
  return value;
}

async function vapiRequest<T>(path: string, options: RequestInit, apiKey: string): Promise<T> {
  const response = await fetch(`https://api.vapi.ai${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(options.headers ?? {})
    }
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Vapi ${options.method ?? "GET"} ${path} failed with ${response.status}: ${body.slice(0, 1200)}`);
  }
  return (await response.json()) as T;
}

const structuredDataSchema = {
  type: "object",
  properties: {
    contact_name: { type: "string" },
    outcome: {
      type: "string",
      enum: ["interested_now", "follow_up_later", "project_completed", "not_interested", "wrong_number", "do_not_call"]
    },
    project_type: {
      type: "string",
      enum: ["repair", "replacement", "storm_damage", "inspection", "unknown"]
    },
    project_status: { type: "string" },
    requested_timing: { type: "string" },
    qualification_notes: { type: "string" },
    next_step: {
      type: "string",
      enum: ["book_inspection", "owner_callback", "scheduled_follow_up", "close_record", "suppress"]
    },
    opt_out: { type: "boolean" }
  },
  required: ["outcome", "next_step", "opt_out"]
};

const systemPrompt = `[Identity]
You are Mabel, an automated lead follow-up assistant making a recorded demonstration call on behalf of Oak City Roofing, a fictional Raleigh roofing company. You are warm, concise, respectful, and transparent that you are an automated assistant. Never pretend to be human.

[Demo context]
- The person previously asked Oak City Roofing about a roof estimate but did not move forward at that time.
- The goal is to learn whether the roofing need is still active and, only when useful, offer a conversation with the roofing team.
- This is a demo. Never claim that a real inspection has been booked, that a real employee will call, or that Oak City Roofing is an operating company.
- Do not ask for a full street address, payment information, insurance policy number, or other sensitive information.

[Conversation style]
- Keep the call under three minutes.
- Ask one question at a time and allow the person to finish.
- Sound natural, unhurried, and helpful. Avoid hype and sales jargon.
- Use short acknowledgments such as “Got it” or “That makes sense.”
- If asked whether you are AI, answer directly: “Yes, I’m an automated assistant named Mabel.”

[Flow]
1. Start with the approved disclosure in the first message and ask whether now is an okay time.
2. If yes, ask whether the roofing project is still something they may need help with.
3. If active, ask what changed or what held it up before.
4. Ask only the minimum useful qualification questions: repair versus replacement, rough timing, and whether they would want a roofer to follow up.
5. Summarize the need and explain that, in a real campaign, the roofing team would receive the call summary and requested next step.
6. Close by thanking them and reminding them this was a demonstration.

[Branches]
- INTERESTED NOW: clarify project type and timing, then demonstrate an owner-callback or inspection handoff.
- LATER: ask for an appropriate month or timeframe, then demonstrate a scheduled follow-up disposition.
- PROJECT COMPLETED: congratulate them, record the outcome, and end without pitching.
- NOT INTERESTED: acknowledge once and end politely.
- WRONG NUMBER: apologize, mark wrong number, and end.
- DO NOT CALL / OPT OUT: apologize, confirm that the number would be suppressed in a real campaign, and end immediately. Do not ask another question.

[Hard rules]
- Never invent prices, discounts, insurance coverage, storm dates, availability, or appointment times.
- Never pressure someone who is hesitant.
- Never continue after an opt-out.
- Do not give legal, insurance, structural, or safety advice.
- If the person describes immediate danger, tell them to contact local emergency services or a qualified professional and end the sales flow.`;

function assistantPayload() {
  return {
    name: assistantName,
    firstMessage:
      "Hi, this is Mabel, an automated assistant calling on behalf of Oak City Roofing. This is a recorded demo call. I’m following up about a roofing estimate you requested a while back. Is now an okay time for one quick question?",
    firstMessageInterruptionsEnabled: true,
    maxDurationSeconds: 240,
    artifactPlan: {
      recordingEnabled: true,
      recordingFormat: "mp3",
      loggingEnabled: true,
      transcriptPlan: {
        enabled: true,
        assistantName: "Mabel",
        userName: "Homeowner"
      }
    },
    model: {
      provider: "openai",
      model: "gpt-4.1",
      temperature: 0.25,
      maxTokens: 350,
      messages: [{ role: "system", content: systemPrompt }]
    },
    transcriber: {
      provider: "deepgram",
      model: "nova-3",
      language: "en-US",
      smartFormat: true,
      numerals: true,
      endpointing: 300,
      keyterm: ["Mabel", "Oak City Roofing", "Raleigh", "roof replacement", "storm damage", "inspection"]
    },
    voice: {
      provider: "vapi",
      voiceId: "Savannah",
      version: "latest",
      language: "en-US",
      speed: 1
    },
    analysisPlan: {
      summaryPlan: { enabled: true, timeoutSeconds: 10 },
      structuredDataPlan: {
        enabled: true,
        timeoutSeconds: 15,
        schema: structuredDataSchema
      }
    },
    metadata: {
      app: "lead-reactivation-demo",
      vertical: "roofing",
      disclosure: "automated-recorded-demo"
    }
  };
}

async function main() {
  const env = readEnvFile();
  const apiKey = requireEnv(env, "VAPI_API_KEY");
  const assistants = await vapiRequest<VapiAssistant[]>("/assistant?limit=1000", { method: "GET" }, apiKey);
  const existing = assistants.find((assistant) => assistant.name === assistantName);
  const payload = assistantPayload();
  const assistant = existing
    ? await vapiRequest<VapiAssistant>(`/assistant/${existing.id}`, { method: "PATCH", body: JSON.stringify(payload) }, apiKey)
    : await vapiRequest<VapiAssistant>("/assistant", { method: "POST", body: JSON.stringify(payload) }, apiKey);

  upsertEnvValue("VAPI_REACTIVATION_ASSISTANT_ID", assistant.id);
  console.log(existing ? "Updated Vapi reactivation assistant." : "Created Vapi reactivation assistant.");
  console.log(`Name: ${assistantName}`);
  console.log(`Assistant ID: ${assistant.id}`);
  console.log("Next: open the assistant in Vapi and choose Talk to Assistant to record a roofing demo scenario.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
