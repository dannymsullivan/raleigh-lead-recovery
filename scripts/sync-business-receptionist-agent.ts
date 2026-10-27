import { loadEnvConfig } from "@next/env";
import Retell from "retell-sdk";
import {
  businessReceptionistAgentName,
  businessReceptionistLlmPayload,
} from "../lib/business-receptionist-agent-config";

loadEnvConfig(process.cwd());

function requiredEnvironment(name: "RETELL_API_KEY" | "RETELL_OWNER_TRANSFER_NUMBER") {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

async function main() {
  const retell = new Retell({ apiKey: requiredEnvironment("RETELL_API_KEY"), timeout: 20_000, maxRetries: 2 });
  const configuredNumber = process.env.RETELL_BUSINESS_PHONE_NUMBER?.trim();
  const numbers = await retell.phoneNumber.list();
  const agents = await retell.agent.list();
  const agentNames = new Map((agents.items ?? []).map((agent) => [agent.agent_id, agent.agent_name]));
  const phone = configuredNumber
    ? (numbers.items ?? []).find((number) => number.phone_number === configuredNumber)
    : (numbers.items ?? []).find((number) =>
        number.inbound_agents?.some((binding) => /Snappy Leads|Raleigh Lead Recovery/.test(agentNames.get(binding.agent_id) ?? "")),
      );
  if (!phone) throw new Error("No Snappy Leads business phone number was found.");
  const inbound = phone.inbound_agents?.[0];
  if (!inbound) throw new Error("The Snappy Leads number has no inbound agent.");

  const published = await retell.agent.retrieve(inbound.agent_id, { version: "latest_published" });
  const draft = await retell.agent.createVersion(published.agent_id, { base_version: published.version });
  if (!("voice_id" in draft) || draft.response_engine.type !== "retell-llm") {
    throw new Error("Expected a Retell LLM voice-agent draft.");
  }
  const llm = await retell.llm.update(draft.response_engine.llm_id, {
    version: draft.response_engine.version ?? undefined,
    ...businessReceptionistLlmPayload(requiredEnvironment("RETELL_OWNER_TRANSFER_NUMBER")),
  });
  const updated = await retell.agent.update(published.agent_id, {
    version: draft.version,
    agent_name: businessReceptionistAgentName,
    begin_message_delay_ms: 250,
    responsiveness: 0.9,
    interruption_sensitivity: 0.85,
    enable_dynamic_responsiveness: true,
    enable_dynamic_voice_speed: true,
    end_call_after_silence_ms: 45_000,
    max_call_duration_ms: 300_000,
    response_engine: { type: "retell-llm", llm_id: llm.llm_id, version: llm.version },
  });
  try {
    await retell.agent.publish(updated.agent_id, {
      version: updated.version,
      version_title: "Snappy Leads business receptionist",
      version_description: "Chloe answers inbound business calls and warm-transfers qualified callers to Danny.",
    });
  } catch (error) {
    const verification = await retell.agent.retrieve(updated.agent_id, { version: "latest_published" });
    if (verification.version !== updated.version) throw error;
  }
  await retell.phoneNumber.update(phone.phone_number, { nickname: "Snappy Leads business line" });
  console.log(JSON.stringify({ phoneNumber: phone.phone_number, agentId: updated.agent_id, version: updated.version, transfer: "configured" }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
