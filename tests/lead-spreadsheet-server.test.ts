import { describe, expect, it } from "vitest";
import { parseLeadSpreadsheet } from "@/lib/lead-spreadsheet-server";

describe("lead spreadsheet parsing", () => {
  it("normalizes BOM-prefixed and duplicate CSV headers", async () => {
    const file = new File(["\uFEFFName,Phone,Phone\nMaya,9195550123,home\n"], "leads.csv", { type: "text/csv" });

    await expect(parseLeadSpreadsheet(file)).resolves.toMatchObject({
      headers: ["Name", "Phone", "Phone (2)"],
      rows: [["Maya", "9195550123", "home"]],
      totalRows: 1,
      truncated: false
    });
  });

  it("reports truncation instead of silently treating a partial file as complete", async () => {
    const file = new File(["Name,Phone\nOne,9195550101\nTwo,9195550102\n"], "leads.csv", { type: "text/csv" });

    await expect(parseLeadSpreadsheet(file, 1)).resolves.toMatchObject({
      rows: [["One", "9195550101"]],
      totalRows: 2,
      truncated: true
    });
  });
});
