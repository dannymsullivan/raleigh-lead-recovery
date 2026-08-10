import { readFileSync, writeFileSync } from "node:fs";

const envPath = ".env.local";
const assistantName = "Mabel - Missed Call Recovery";
const legacyAssistantNames = new Set(["Riley - Missed Call Recovery", "Riley"]);

type EnvMap = Record<string, string>;

function readEnvFile(): EnvMap {
  const raw = readFileSync(envPath, "utf8");
  const entries = raw
    .split(/\n/)
    .filter(Boolean)
    .filter((line) => !line.trimStart().startsWith("#"))
    .map((line) => {
      const index = line.indexOf("=");
      return [line.slice(0, index), line.slice(index + 1)] as const;
    });

  const shellEnv = Object.fromEntries(
    Object.entries(process.env).filter((entry): entry is [string, string] => typeof entry[1] === "string")
  );

  return { ...Object.fromEntries(entries), ...shellEnv };
}

function upsertEnvValue(key: string, value: string): void {
  const raw = readFileSync(envPath, "utf8");
  const lines = raw.split(/\n/);
  const nextLines = lines.some((line) => line.startsWith(`${key}=`))
    ? lines.map((line) => (line.startsWith(`${key}=`) ? `${key}=${value}` : line))
    : [...lines.filter((line, index) => line || index < lines.length - 1), `${key}=${value}`];

  writeFileSync(envPath, `${nextLines.filter((line, index) => line || index < nextLines.length - 1).join("\n")}\n`);
}

function requireEnv(env: EnvMap, key: string): string {
  const value = env[key]?.trim();
  if (!value) {
    throw new Error(`Missing ${key} in ${envPath}`);
  }
  return value;
}

function webhookUrl(env: EnvMap): string {
  const explicit = env.VAPI_PUBLIC_WEBHOOK_URL?.trim();
  if (explicit) {
    return explicit;
  }

  const appUrl = env.NEXT_PUBLIC_APP_URL?.trim();
  if (!appUrl) {
    throw new Error("Missing VAPI_PUBLIC_WEBHOOK_URL or NEXT_PUBLIC_APP_URL");
  }

  return `${appUrl.replace(/\/$/, "")}/api/webhooks/vapi`;
}

function assertPublicWebhookUrl(url: string): void {
  const parsed = new URL(url);
  const blockedHosts = new Set(["localhost", "127.0.0.1", "0.0.0.0"]);

  if (parsed.protocol !== "https:") {
    throw new Error(`Vapi needs an https webhook URL. Got: ${url}`);
  }

  if (blockedHosts.has(parsed.hostname) || parsed.hostname.endsWith(".local")) {
    throw new Error(`Vapi cannot reach local webhook URL: ${url}`);
  }
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
    throw new Error(`Vapi ${options.method ?? "GET"} ${path} failed with ${response.status}: ${body.slice(0, 1000)}`);
  }

  return (await response.json()) as T;
}

type VapiAssistant = {
  id: string;
  name?: string;
};

type VapiPhoneNumber = {
  id: string;
  provider?: string;
  number?: string;
};

function assistantPayload(webhook: string, webhookSecret: string) {
  return {
    name: assistantName,
    firstMessage:
      "Thanks for calling Oak City Plumbing - this is Mabel. Sorry we couldn't grab the phone, the team's out on jobs. What's going on?",
    firstMessageInterruptionsEnabled: true,
    maxDurationSeconds: 300,
    serverMessages: ["end-of-call-report"],
    server: {
      url: webhook,
      timeoutSeconds: 20,
      headers: {
        "X-Vapi-Secret": webhookSecret
      }
    },
    model: {
      provider: "openai",
      model: "gpt-4.1",
      temperature: 0.3,
      maxTokens: 350,
      messages: [
        {
          role: "system",
          content: systemPrompt
        }
      ]
    },
    transcriber: {
      provider: "deepgram",
      model: "nova-3",
      language: "en-US",
      smartFormat: true,
      numerals: true,
      endpointing: 300,
      keyterm: ["Oak City Plumbing", "Raleigh", "Cary", "Garner", "water heater", "sewer backup"]
    },
    voice: {
      provider: "vapi",
      voiceId: "Savannah",
      version: "latest",
      language: "en-US",
      speed: 1
    },
    analysisPlan: {
      summaryPlan: {
        enabled: true,
        timeoutSeconds: 10
      },
      structuredDataPlan: {
        enabled: true,
        timeoutSeconds: 15,
        schema: structuredDataSchema
      }
    },
    metadata: {
      app: "missed-call-recovery",
      client: "oak-city-plumbing"
    }
  };
}

const structuredDataSchema = {
  type: "object",
  properties: {
    caller_name: { type: "string" },
    callback_number: { type: "string" },
    service_address: { type: "string" },
    issue_description: { type: "string" },
    urgency: {
      type: "string",
      enum: ["emergency", "urgent", "standard", "spam", "other"]
    },
    lead_type: {
      type: "string",
      enum: ["new_job", "existing_customer", "complaint", "price_shopper", "spam", "other"]
    },
    estimated_job_value_band: {
      type: "string",
      enum: ["under_300", "300_800", "800_2000", "over_2000", "unknown"]
    },
    requested_timing: { type: "string" },
    callback_promised_by: { type: "string" }
  },
  required: ["urgency", "lead_type"]
};

const systemPrompt = `[Identity]
You are Mabel, the after-hours assistant for Oak City Plumbing, a plumbing company in Raleigh, North Carolina. You answer when the team can't get to the phone, usually because they're on a job. You are warm, calm, efficient, and human-sounding. You never say you are an AI unless directly asked; if asked, answer honestly and briefly, then continue helping.

[Context]
- Callers may be stressed: water leaking, no hot water, sewage backup. Calm them down and move fast.
- Your job: (1) triage urgency, (2) capture complete lead details, (3) set the expectation that a real plumber will call back, (4) for emergencies, reassure and prioritize.
- You CANNOT quote prices. If asked, say pricing depends on the job and the plumber will confirm on the callback.
- You CANNOT dispatch anyone directly. You collect info and promise a callback within the callback window. Default: 15 minutes for emergencies, 2 hours otherwise.

[Style]
- Short sentences.
- One question at a time.
- Never ask for two pieces of info in the same breath.
- Mirror the caller's energy: urgent caller means brisk and reassuring; calm caller means friendly and unhurried.
- Use natural fillers sparingly: "Got it", "Okay, that helps".
- No corporate phrases.

[Conversation flow]
1. GREETING: "Thanks for calling Oak City Plumbing - this is Mabel. Sorry we couldn't grab the phone, the guys are out on jobs. What's going on?"
2. TRIAGE - classify silently into:
   - EMERGENCY: active leak, burst pipe, flooding, sewage backup, no water to the house, gas smell.
   - URGENT: no hot water, clogged main drain, toilet not working in a one-bathroom home.
   - STANDARD: quotes, remodels, slow drains, dripping faucets, non-urgent repairs.
3. If EMERGENCY: "Okay - first thing, if you can, shut off the water at the main valve. It's usually near the water heater or where the line enters the house. I'm going to get your info to the on-call plumber right now."
4. If gas smell, carbon monoxide, or electrical fire: tell them to leave the house and call 911 or the utility company first, then continue capturing info only if safe.
5. CAPTURE, one at a time:
   - full name
   - callback number, then confirm digits back
   - service address
   - brief description of the problem
   - how soon they need someone
6. EXPECTATION: "You're on the board. Marcus will call you back within the callback window. If anything changes, call this number back and I'll update your ticket."
7. CLOSE: thank them by name.

[Edge cases]
- Price shopper who only wants a number: capture name and number anyway, promise the callback with a quote. Do not lose the lead.
- Wrong number, solicitor, or robocall: politely end the call.
- Existing customer with a scheduling question: capture details, flag as "existing customer - scheduling".
- Angry caller about past work: apologize once, capture details, flag as "complaint - owner callback", and do not promise remedies.
- Caller asks for a specific plumber: note the name in the ticket.

[Hard rules]
- Never invent availability, prices, or arrival times.
- Never collect payment information.
- Safety instructions come before lead capture for gas smell, carbon monoxide, electrical fire, or immediate physical danger.
- Keep total call under 4 minutes when possible.`;

async function main() {
  const env = readEnvFile();
  const apiKey = requireEnv(env, "VAPI_API_KEY");
  const secret = requireEnv(env, "VAPI_WEBHOOK_SECRET");
  const webhook = webhookUrl(env);
  assertPublicWebhookUrl(webhook);

  const assistants = await vapiRequest<VapiAssistant[]>("/assistant?limit=1000", { method: "GET" }, apiKey);
  const existing =
    assistants.find((assistant) => assistant.name === assistantName) ??
    assistants.find((assistant) => assistant.name && legacyAssistantNames.has(assistant.name));
  const payload = assistantPayload(webhook, secret);

  const assistant = existing
    ? await vapiRequest<VapiAssistant>(`/assistant/${existing.id}`, { method: "PATCH", body: JSON.stringify(payload) }, apiKey)
    : await vapiRequest<VapiAssistant>("/assistant", { method: "POST", body: JSON.stringify(payload) }, apiKey);

  upsertEnvValue("VAPI_ASSISTANT_ID", assistant.id);

  const phoneNumberId = env.VAPI_PHONE_NUMBER_ID?.trim();
  if (phoneNumberId) {
    const phoneNumber = await vapiRequest<VapiPhoneNumber>(`/phone-number/${phoneNumberId}`, { method: "GET" }, apiKey);
    await vapiRequest<VapiPhoneNumber>(
      `/phone-number/${phoneNumberId}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          provider: phoneNumber.provider,
          assistantId: assistant.id,
          name: phoneNumber.number ? `Missed Call Recovery ${phoneNumber.number}` : "Missed Call Recovery"
        })
      },
      apiKey
    );
  }

  console.log(existing ? "Updated Vapi assistant" : "Created Vapi assistant");
  console.log(`Assistant ID: ${assistant.id}`);
  console.log(`Webhook URL: ${webhook}`);
  console.log(phoneNumberId ? `Attached phone number: ${phoneNumberId}` : "No VAPI_PHONE_NUMBER_ID set; phone number not attached.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
