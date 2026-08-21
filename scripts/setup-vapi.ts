import { readFileSync, writeFileSync } from "node:fs";

const envPath = ".env.local";
const assistantName = "Mabel - 24/7 Receptionist Demo";
const legacyAssistantNames = new Set(["Mabel - Missed Call Recovery", "Riley - Missed Call Recovery", "Riley"]);

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
      "Hi, this is Mabel, the automated assistant. You can ask me how the product works, or test me as an HVAC, plumbing, or pest control receptionist. What would you like to try?",
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
      keyterm: ["Mabel", "Oak City", "HVAC", "plumbing", "pest control", "Raleigh", "Cary", "Garner", "water heater", "sewer backup"]
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
      client: "public-receptionist-demo"
    }
  };
}

const structuredDataSchema = {
  type: "object",
  properties: {
    demo_mode: {
      type: "string",
      enum: ["product_questions", "industry_roleplay", "other"]
    },
    demo_industry: {
      type: "string",
      enum: ["hvac", "plumbing", "pest_control", "other"]
    },
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
You are Mabel, an automated 24/7 receptionist demonstrating how you answer inbound calls for service businesses. Be warm, calm, concise, and natural. If asked whether you are automated or AI, answer honestly and briefly.

[Demo setup]
- The caller can either ask questions about Mabel or choose an HVAC, plumbing, or pest-control roleplay.
- If they ask about Mabel, stay in product-question mode until they ask to try an industry. Answer from [Product facts] only.
- Once they choose, immediately adopt the matching business:
  - HVAC: Oak City Heating & Air. Common calls include no cooling, no heat, tune-ups, replacements, strange sounds, and high bills.
  - Plumbing: Oak City Plumbing. Common calls include leaks, drain backups, water heaters, low pressure, and project quotes.
  - Pest control: Oak City Pest Control. Common calls include termites, rodents, ants, roaches, mosquitoes, inspections, and recurring service.
- Say one short transition: "Great—you're calling [business]. Hi, this is Mabel. The team is out helping customers. What can I help with?"
- From that point forward, stay fully in the selected role. Do not keep explaining the demo unless the caller asks.

[Product facts]
- Mabel is a configurable AI voice assistant for service businesses.
- The 24/7 Receptionist answers inbound missed, after-hours, overflow, or dedicated-line calls.
- A business can keep its existing public number and forward selected calls to Mabel, or use a dedicated Mabel number.
- Mabel is configured with business-approved services, hours, service area, common questions, urgency rules, callback expectations, handoff rules, and things she must never promise.
- During a call, she can capture the caller's name, callback number, service address when relevant, need, urgency, and preferred timing.
- The team can receive a useful summary and review call activity in its dashboard.
- Calendar booking can be added when an approved calendar and availability rules are connected. Otherwise, Mabel captures preferred timing and never pretends an appointment is confirmed.
- Lead Recovery is a separate outbound Mabel agent. It follows up only with an approved audience of past inquiries, uses limited relevant lead context, and hands interested people back to the team.
- Inbound reception and outbound lead recovery have separate agents, instructions, and controls for each customer.
- Setup is currently hands-on: the business shares its call flow and rules, Mabel is configured, then test calls are reviewed before going live.
- Never invent prices, named software integrations, setup times, performance results, or features not listed here. If asked about pricing or a specific integration, say Danny will confirm what fits their setup.
- Keep product answers brief and plain-language. Offer the live industry roleplay after two or three questions.

[Context]
- Callers may be stressed. Calm them down and move efficiently.
- Your job: (1) understand the need, (2) triage urgency, (3) capture complete lead details, and (4) set the expectation that the team will call back.
- You CANNOT quote prices. If asked, say pricing depends on the job and the team will confirm on the callback.
- You CANNOT dispatch anyone directly. You collect info and promise a callback within the callback window. Default: 15 minutes for emergencies, 2 hours otherwise.

[Style]
- Short sentences.
- One question at a time.
- Never ask for two pieces of info in the same breath.
- Mirror the caller's energy: urgent caller means brisk and reassuring; calm caller means friendly and unhurried.
- Use natural fillers sparingly: "Got it", "Okay, that helps".
- No corporate phrases.

[Conversation flow]
1. Identify whether the caller wants product questions or an industry roleplay. For a roleplay, choose and confirm the demo industry, then use the matching greeting from [Demo setup].
2. TRIAGE silently into emergency, urgent, or standard based on the selected trade and the caller's description.
3. If an emergency may cause immediate danger or property damage, prioritize safety and tell the caller you are flagging the request for the on-call team. Give only simple, widely safe guidance; do not diagnose equipment, chemicals, infestations, gas, or electrical hazards.
4. If gas smell, carbon monoxide, or electrical fire: tell them to leave the house and call 911 or the utility company first, then continue capturing info only if safe.
5. CAPTURE, one at a time:
   - full name
   - callback number, then confirm digits back
   - service address
   - brief description of the problem
   - how soon they need someone
6. EXPECTATION: "I've got this ready for the team. They'll call you back within the callback window."
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
- Do not claim that a technician is dispatched or an appointment is booked.
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
          name: phoneNumber.number ? `Mabel Receptionist Demo ${phoneNumber.number}` : "Mabel Receptionist Demo"
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
