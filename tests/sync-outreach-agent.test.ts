import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  agent: {
    list: vi.fn(), retrieve: vi.fn(), create: vi.fn(), createVersion: vi.fn(), update: vi.fn(), publish: vi.fn()
  },
  llm: { create: vi.fn(), update: vi.fn() },
  phoneNumber: { list: vi.fn() }
}));

vi.mock("@next/env", () => ({ loadEnvConfig: vi.fn() }));
vi.mock("retell-sdk", () => ({
  default: class {
    agent = mocks.agent;
    llm = mocks.llm;
    phoneNumber = mocks.phoneNumber;
  }
}));

describe("outreach agent sync across the Snappy Leads migration", () => {
  let originalExitCode: typeof process.exitCode;

  beforeEach(() => {
    vi.resetModules();
    vi.resetAllMocks();
    originalExitCode = process.exitCode;
    vi.stubEnv("RETELL_API_KEY", "test-api-key");
    vi.stubEnv("RETELL_OUTREACH_AGENT_ID", undefined);
    vi.stubEnv("RETELL_OUTREACH_PHONE_NUMBER", undefined);
    vi.stubEnv("RETELL_WEBHOOK_URL", undefined);
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://snappyleads.xyz");
    mocks.agent.retrieve.mockResolvedValue({
      agent_id: "existing-outreach", version: 3,
      response_engine: { type: "retell-llm", llm_id: "existing-llm", version: 3 }
    });
    mocks.agent.createVersion.mockResolvedValue({
      version: 4, voice_id: "existing-voice",
      response_engine: { type: "retell-llm", llm_id: "existing-llm", version: 4 }
    });
    mocks.llm.update.mockResolvedValue({ llm_id: "existing-llm", version: 4 });
    mocks.agent.update.mockResolvedValue({ version: 4 });
    mocks.agent.publish.mockResolvedValue(undefined);
    mocks.phoneNumber.list.mockResolvedValue({ items: [
      { phone_number: "+19195550001", outbound_agents: [{ agent_id: "unrelated" }] },
      { phone_number: "+19195550002", outbound_agents: [{ agent_id: "existing-lead" }] }
    ] });
  });

  afterEach(() => {
    process.exitCode = originalExitCode;
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it.each([
    ["legacy", "Raleigh Lead Recovery — Sales Qualification", "Lead Recovery — Raleigh Lead Recovery"],
    ["current", "Snappy Leads — Sales Qualification", "Lead Recovery — Snappy Leads"]
  ])("reuses the %s outreach agent and its existing lead-agent phone without optional overrides", async (_label, outreachName, leadName) => {
    mocks.agent.list.mockResolvedValue({ items: [
      { agent_id: "unrelated", agent_name: "Another business" },
      { agent_id: "existing-outreach", agent_name: outreachName },
      { agent_id: "existing-lead", agent_name: leadName }
    ] });
    const logged = vi.spyOn(console, "log").mockImplementation(() => {});
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});

    await import("../scripts/sync-outreach-agent");
    await vi.waitFor(() => {
      expect(logged).toHaveBeenCalled();
    });

    expect(mocks.agent.retrieve).toHaveBeenCalledWith("existing-outreach", { version: "latest_published" });
    expect(mocks.agent.createVersion).toHaveBeenCalledWith("existing-outreach", { base_version: 3 });
    expect(mocks.agent.update).toHaveBeenCalledWith("existing-outreach", expect.objectContaining({
      agent_name: "Snappy Leads — Sales Qualification", version: 4,
      webhook_url: "https://snappyleads.xyz/api/webhooks/retell"
    }));
    expect(mocks.agent.publish).toHaveBeenCalledWith("existing-outreach", expect.objectContaining({ version: 4 }));
    expect(mocks.agent.create).not.toHaveBeenCalled();
    expect(mocks.llm.create).not.toHaveBeenCalled();
    expect(JSON.parse(logged.mock.calls[0][0])).toEqual({
      agentId: "existing-outreach", llmId: "existing-llm", phoneNumber: "+19195550002", version: 4
    });
    expect(errors).not.toHaveBeenCalled();
  });
});
