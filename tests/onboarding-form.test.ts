import { describe, expect, it, vi } from "vitest";
import { reportStepValidity } from "@/app/onboarding/onboarding-form";

describe("onboarding step validation", () => {
  it("validates only the controls supplied by the visible step", () => {
    const visibleField = { checkValidity: vi.fn(() => true), reportValidity: vi.fn() };
    const hiddenFutureField = { checkValidity: vi.fn(() => false), reportValidity: vi.fn() };
    const visibleStep = {
      querySelectorAll: vi.fn(() => [visibleField])
    } as unknown as ParentNode;

    expect(reportStepValidity(visibleStep)).toBe(true);
    expect(visibleField.checkValidity).toHaveBeenCalledOnce();
    expect(hiddenFutureField.checkValidity).not.toHaveBeenCalled();
  });

  it("reports the first invalid control on the active step", () => {
    const invalidField = { checkValidity: vi.fn(() => false), reportValidity: vi.fn() };
    const visibleStep = {
      querySelectorAll: vi.fn(() => [invalidField])
    } as unknown as ParentNode;

    expect(reportStepValidity(visibleStep)).toBe(false);
    expect(invalidField.reportValidity).toHaveBeenCalledOnce();
  });
});
