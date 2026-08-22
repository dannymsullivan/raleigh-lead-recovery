import { describe, expect, it, vi } from "vitest";
import { reportStepValidity } from "@/app/onboarding/onboarding-form";
import { industryKeyForTrade, isGuidedIndustry, isIndustryKey, selectedTrade } from "@/lib/industry-presets";

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

describe("onboarding industry selection", () => {
  it("recognizes supported trades and keeps their canonical label", () => {
    expect(industryKeyForTrade("HVAC")).toBe("hvac");
    expect(selectedTrade("hvac", "")).toBe("HVAC");
    expect(isGuidedIndustry("hvac")).toBe(false);
    expect(industryKeyForTrade("Pest Control")).toBe("pest_control");
    expect(selectedTrade("pest_control", "")).toBe("Pest Control");
    expect(isIndustryKey("pest_control")).toBe(true);
  });

  it("routes a custom trade to guided setup", () => {
    expect(industryKeyForTrade("Chimney sweep")).toBe("other");
    expect(selectedTrade("other", "Chimney sweep")).toBe("Chimney sweep");
    expect(isGuidedIndustry("other")).toBe(true);
    expect(isIndustryKey("chimney_sweep")).toBe(false);
  });
});
