import { describe, expect, it, vi } from "vitest";
import { classifyRetellProvisioningError, publishRetellAgent } from "@/lib/customer-agent-provisioning";

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

describe("customer-facing Retell provisioning errors", () => {
  it("turns a raw KYC response into a customer-safe configuration state", () => {
    expect(classifyRetellProvisioningError(new Error("403 No valid KYC, please visit the dashboard"))).toEqual({
      status: "needs_configuration",
      message: "Phone-number activation is waiting on a one-time provider verification. Your call flows are saved, and no action is required from you.",
      verificationRequired: true
    });
  });

  it("does not expose unknown provider errors to customers", () => {
    const issue = classifyRetellProvisioningError(new Error("internal provider trace abc-123"));
    expect(issue.status).toBe("error");
    expect(issue.message).not.toContain("abc-123");
  });

  it("keeps the verification action visible after the friendly message is stored", () => {
    const first = classifyRetellProvisioningError(new Error("403 No valid KYC"));
    expect(classifyRetellProvisioningError(new Error(first.message)).verificationRequired).toBe(true);
  });
});
