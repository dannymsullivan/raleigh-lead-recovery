import { describe, expect, it, vi } from "vitest";
import { publishRetellAgent } from "@/lib/customer-agent-provisioning";

describe("customer agent publishing", () => {
  it("accepts Retell's empty-response parse error when the requested version is published", async () => {
    const agentApi = {
      publish: vi.fn().mockRejectedValue(new SyntaxError("Unexpected end of JSON input")),
      retrieve: vi.fn().mockResolvedValue({ version: 4 })
    };

    await expect(publishRetellAgent(agentApi, "agent-1", 4)).resolves.toBeUndefined();
    expect(agentApi.retrieve).toHaveBeenCalledWith("agent-1", { version: "latest_published" });
  });

  it("keeps the failure when Retell did not publish the requested version", async () => {
    const error = new Error("publish failed");
    const agentApi = {
      publish: vi.fn().mockRejectedValue(error),
      retrieve: vi.fn().mockResolvedValue({ version: 3 })
    };

    await expect(publishRetellAgent(agentApi, "agent-1", 4)).rejects.toBe(error);
  });
});
