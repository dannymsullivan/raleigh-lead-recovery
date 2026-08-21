import { describe, expect, it } from "vitest";
import { analyzeLeadRows, buildLeadAgentContext, classifyLeadBucket, inferLeadColumnMapping, parseCsvRows } from "@/lib/lead-import";
import { ownsLeadUploadPath, validateLeadUploadDescriptor } from "@/lib/lead-upload-server";

describe("flexible lead imports", () => {
  it("accepts a spreadsheet larger than Vercel's function body limit for direct upload", () => {
    expect(validateLeadUploadDescriptor("zimzoom-leads.csv", 5_252_291)).toBeNull();
    expect(validateLeadUploadDescriptor("too-large.csv", 10_000_001)).toContain("10 MB");
  });

  it("scopes temporary uploads to the owning customer and campaign", () => {
    const path = "client-1/campaign-1/upload-leads.csv";
    expect(ownsLeadUploadPath(path, "client-1", "campaign-1")).toBe(true);
    expect(ownsLeadUploadPath(path, "client-2", "campaign-1")).toBe(false);
    expect(ownsLeadUploadPath("client-1/campaign-1/../secret.csv", "client-1", "campaign-1")).toBe(false);
  });

  it("maps a business-specific export without hard-coding its layout", () => {
    const rows = parseCsvRows([
      "ID,Brand,Status,Status Changed,Inquired,Job Name,Job Type,Job Date,Closed Reason,Closed,Source",
      '2278905,"Zim Zoom Photo Booth",Follow Up,2026-01-02,2025-12-01,"Taylor Wedding",Wedding,2026-06-01,Stale/Ghosted Us,Yes,Website',
      '2278906,"Zim Zoom Photo Booth",Ignore,2026-01-03,2025-12-02,"Test Event",Party,2026-06-02,Spam,Yes,Website'
    ].join("\n"));
    const headers = rows[0];
    const data = rows.slice(1);
    const mapping = inferLeadColumnMapping(headers, data);
    expect(mapping).toMatchObject({ external_id: "ID", brand: "Brand", status: "Status", inquired_at: "Inquired", job_name: "Job Name", closed_reason: "Closed Reason" });
    const analysis = analyzeLeadRows(headers, data, mapping, new Date("2026-08-20T12:00:00Z"));
    expect(analysis.validRows).toBe(0);
    expect(analysis.missingPhoneRows).toBe(2);
    expect(analysis.bucketCounts.ready_to_reengage).toBe(1);
    expect(analysis.bucketCounts.exclude).toBe(1);
  });

  it("combines first and last names, normalizes phones, and removes duplicate callable rows", () => {
    const headers = ["Given Name", "Surname", "Cell #", "Lead Stage", "Reason", "Notes"];
    const data = [
      ["Maya", "Lee", "(919) 555-0123", "Follow up", "More info needed", "Asked about premium package"],
      ["Maya Duplicate", "Lee", "9195550123", "Follow up", "More info needed", "Duplicate"],
      ["No", "Phone", "", "New", "", ""]
    ];
    const mapping = inferLeadColumnMapping(headers, data);
    const analysis = analyzeLeadRows(headers, data, mapping);
    expect(mapping).toMatchObject({ first_name: "Given Name", last_name: "Surname", phone: "Cell #" });
    expect(analysis.validRows).toBe(1);
    expect(analysis.duplicateRows).toBe(1);
    expect(analysis.callableBucketCounts.ready_to_reengage).toBe(1);
    expect(analysis.bucketSamples.ready_to_reengage).toHaveLength(1);
    expect(analysis.rows[0]).toMatchObject({ name: "Maya Lee", phoneE164: "+19195550123", bucket: "ready_to_reengage" });
  });

  it("uses deterministic buckets and keeps agent context scoped to useful fields", () => {
    expect(classifyLeadBucket("Closed", "Exceeded budget").bucket).toBe("price_sensitive");
    expect(classifyLeadBucket("Closed", "Booked other vendor").bucket).toBe("lost_elsewhere");
    expect(classifyLeadBucket("Ignore", "duplicate").bucket).toBe("exclude");
    const context = buildLeadAgentContext({ brand: "Zim Zoom", company: "Frame Game", jobType: "Wedding", closedReason: "More Info Needed" });
    expect(context).toContain("Brand: Zim Zoom");
    expect(context).toContain("Parent company: Frame Game");
    expect(context).toContain("Why it closed: More Info Needed");
  });
});
