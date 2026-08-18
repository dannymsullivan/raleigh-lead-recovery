import { describe, expect, it } from "vitest";
import { contactStatusForOutcome, normalizeUsPhone, parseLeadCsv } from "@/lib/reactivation";

describe("reactivation lead imports", () => {
  it("normalizes US phone numbers", () => {
    expect(normalizeUsPhone("(919) 555-0123")).toBe("+19195550123");
    expect(normalizeUsPhone("1-984-555-0199")).toBe("+19845550199");
    expect(normalizeUsPhone("555-0199")).toBeNull();
  });

  it("parses quoted CSV rows and removes duplicate phones", () => {
    const result = parseLeadCsv('name,phone,source,notes\n"Sarah M.","(919) 555-0123",Website,"Asked for a quote, then paused"\nSarah Again,9195550123,Other,Duplicate');
    expect(result.leads).toHaveLength(1);
    expect(result.leads[0]).toMatchObject({ name: "Sarah M.", phoneE164: "+19195550123", source: "Website" });
    expect(result.duplicateRows).toBe(1);
  });

  it("maps interested outcomes to the priority state", () => {
    expect(contactStatusForOutcome("interested_now")).toBe("interested");
    expect(contactStatusForOutcome("do_not_call")).toBe("do_not_call");
  });
});
