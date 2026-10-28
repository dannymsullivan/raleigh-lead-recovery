import Retell from "retell-sdk";
import {
  publicDemoAgentName,
  publicDemoBeginMessage,
  publicDemoMaxCallDurationMs,
  publicDemoPrompt
} from "../lib/public-demo-agent-config";

function requiredEnvironment(name: "RETELL_API_KEY" | "RETELL_WEB_DEMO_AGENT_ID"): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

async function main(): Promise<void> {
  const apiKey = requiredEnvironment("RETELL_API_KEY");
  const agentId = requiredEnvironment("RETELL_WEB_DEMO_AGENT_ID");
  const retell = new Retell({ apiKey, timeout: 20_000, maxRetries: 2 });
  const published = await retell.agent.retrieve(agentId, { version: "latest_published" });

  if (published.agent_name !== publicDemoAgentName) {
    throw new Error("Refusing to alter a non-Oak City demo voice agent");
  }

  if (published.response_engine.type !== "retell-llm") {
    throw new Error(`Expected a Retell LLM response engine, received ${published.response_engine.type}`);
  }

  const publishedLlm = await retell.llm.retrieve(published.response_engine.llm_id, {
    version: published.response_engine.version ?? undefined
  });
  if (
    published.agent_name === publicDemoAgentName
    && published.max_call_duration_ms === publicDemoMaxCallDurationMs
    && published.contact_memory_config?.enable_read === false
    && published.contact_memory_config?.enable_update === false
    && publishedLlm.begin_message === publicDemoBeginMessage
    && publishedLlm.general_prompt === publicDemoPrompt
  ) {
    console.log(JSON.stringify({ agentId, version: published.version, agentName: publicDemoAgentName, status: "already_published" }));
    return;
  }

  const createdDraft = await retell.agent.createVersion(agentId, { base_version: published.version });
  if (!("voice_id" in createdDraft)) throw new Error("Expected a voice-agent draft");
  const draft = createdDraft;

  if (draft.response_engine.type !== "retell-llm") {
    throw new Error(`Expected a Retell LLM response engine, received ${draft.response_engine.type}`);
  }

  const llm = await retell.llm.update(draft.response_engine.llm_id, {
    version: draft.response_engine.version ?? undefined,
    begin_message: publicDemoBeginMessage,
    general_prompt: publicDemoPrompt,
    model: "gpt-4.1",
    model_temperature: 0.2,
    start_speaker: "agent",
    tool_call_strict_mode: true
  });

  const updated = await retell.agent.update(agentId, {
    version: draft.version,
    agent_name: publicDemoAgentName,
    begin_message_delay_ms: 350,
    boosted_keywords: ["Snappy Leads", "HVAC", "thermostat", "heat pump"],
    enable_dynamic_responsiveness: true,
    enable_dynamic_voice_speed: true,
    max_call_duration_ms: publicDemoMaxCallDurationMs,
    contact_memory_config: { enable_read: false, enable_update: false },
    response_engine: {
      type: "retell-llm",
      llm_id: llm.llm_id,
      version: llm.version
    }
  });

  try {
    await retell.agent.publish(agentId, {
      version: updated.version,
      version_title: "HVAC browser demo",
      version_description: "Fictional HVAC company role-play with clear AI disclosure"
    });
  } catch (error) {
    const verification = await retell.agent.retrieve(agentId, { version: "latest_published" });
    if (verification.version !== updated.version || verification.agent_name !== publicDemoAgentName) throw error;
  }

  console.log(JSON.stringify({ agentId, version: updated.version, agentName: publicDemoAgentName }));
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
