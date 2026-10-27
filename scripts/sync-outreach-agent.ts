import { loadEnvConfig } from "@next/env";
import Retell from "retell-sdk";
import {
  outreachAgentName,
  outreachLlmPayload,
  outreachVoicePayload,
} from "../lib/outreach-agent-config";

loadEnvConfig(process.cwd());

function requiredEnvironment(name: "RETELL_API_KEY"): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

function webhookUrl(): string {
  const explicit = process.env.RETELL_WEBHOOK_URL?.trim();
  if (explicit) return explicit;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim()?.replace(/\/$/, "");
  if (!appUrl?.startsWith("https://")) throw new Error("A public HTTPS NEXT_PUBLIC_APP_URL or RETELL_WEBHOOK_URL is required.");
  return `${appUrl}/api/webhooks/retell`;
}

async function main() {
  const retell = new Retell({ apiKey: requiredEnvironment("RETELL_API_KEY"), timeout: 20_000, maxRetries: 2 });
  const agents = await retell.agent.list();
  const agentItems = agents.items ?? [];
  const configuredId = process.env.RETELL_OUTREACH_AGENT_ID?.trim();
  const existingId = configuredId || agentItems.find((agent) =>
    [outreachAgentName, "Raleigh Lead Recovery — Sales Qualification"].includes(agent.agent_name ?? ""),
  )?.agent_id;
  const existing = existingId
    ? await retell.agent.retrieve(existingId, { version: "latest_published" })
    : null;

  let agentId: string;
  let llmId: string;
  let agentVersion: number;

  if (!existing) {
    const llm = await retell.llm.create(outreachLlmPayload());
    const agent = await retell.agent.create(outreachVoicePayload(llm.llm_id, llm.version, webhookUrl()));
    agentId = agent.agent_id;
    llmId = llm.llm_id;
    agentVersion = agent.version;
  } else {
    if (existing.response_engine.type !== "retell-llm") throw new Error("The existing outreach agent does not use a Retell LLM.");
    agentId = existing.agent_id;
    const draft = await retell.agent.createVersion(agentId, { base_version: existing.version });
    if (!("voice_id" in draft) || draft.response_engine.type !== "retell-llm") {
      throw new Error("Expected a Retell LLM voice-agent draft.");
    }
    llmId = draft.response_engine.llm_id;
    const llm = await retell.llm.update(llmId, {
      ...outreachLlmPayload(),
      version: draft.response_engine.version ?? undefined,
    });
    const agent = await retell.agent.update(
      agentId,
      { ...outreachVoicePayload(llmId, llm.version, webhookUrl()), version: draft.version },
    );
    agentVersion = agent.version;
  }

  try {
    await retell.agent.publish(agentId, {
      version: agentVersion,
      version_description: "Transparent, manually initiated sales qualification",
    });
  } catch (error) {
    // Retell can publish successfully and then fail to parse its empty response.
    const published = await retell.agent.retrieve(agentId, { version: "latest_published" });
    if (published.version !== agentVersion) throw error;
  }

  let phoneNumber = process.env.RETELL_OUTREACH_PHONE_NUMBER?.trim();
  if (!phoneNumber) {
    const numbers = await retell.phoneNumber.list();
    const leadAgentIds = new Set(agentItems.filter((agent) =>
      ["Lead Recovery — Snappy Leads", "Lead Recovery — Raleigh Lead Recovery"].includes(agent.agent_name ?? ""),
    ).map((agent) => agent.agent_id));
    phoneNumber = (numbers.items ?? []).find((number) =>
      number.outbound_agents?.some((binding) => leadAgentIds.has(binding.agent_id)),
    )?.phone_number;
  }
  if (!phoneNumber) throw new Error("No existing Snappy Leads outbound number was found. Set RETELL_OUTREACH_PHONE_NUMBER before syncing.");

  console.log(JSON.stringify({ agentId, llmId, phoneNumber, version: agentVersion }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
