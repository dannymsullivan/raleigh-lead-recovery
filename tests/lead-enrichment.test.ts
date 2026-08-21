import { describe, expect, it } from "vitest";
import { daysUntilEvent, enrichLead, inferEventType, urgencyBandForDate } from "@/lib/lead-enrichment";

describe("lead enrichment", () => {
  const now = new Date("2026-08-21T12:00:00Z");

  it("creates stable event timing bands at the documented boundaries", () => {
    expect(daysUntilEvent("2026-09-04", now)).toBe(14);
    expect(urgencyBandForDate("2026-09-04", now)).toBe("urgent_14");
    expect(urgencyBandForDate("2026-09-05", now)).toBe("near_term_30");
    expect(urgencyBandForDate("2026-09-20", now)).toBe("near_term_30");
    expect(urgencyBandForDate("2026-11-19", now)).toBe("planning_90");
    expect(urgencyBandForDate("2026-11-20", now)).toBe("long_range");
  });

  it("classifies explicit event language deterministically", () => {
    expect(inferEventType("Wedding reception")).toBe("wedding");
    expect(inferEventType("Annual company conference")).toBe("corporate");
    expect(inferEventType("High school prom")).toBe("school");
    expect(inferEventType("40th birthday party")).toBe("birthday");
    expect(inferEventType("Details unavailable")).toBe("unknown");
  });

  it("prioritizes a near event with a real follow-up signal", () => {
    const urgent = enrichLead({ jobType: "Wedding", jobDate: "2026-09-01", closedReason: "Needs follow up", bucket: "ready_to_reengage", leadAgeDays: 20 }, now);
    const longRange = enrichLead({ jobType: "Wedding", jobDate: "2027-06-01", bucket: "review", leadAgeDays: 200 }, now);
    expect(urgent).toMatchObject({ eventType: "wedding", urgencyBand: "urgent_14", priorReason: "Needs follow up" });
    expect(urgent.priorityScore).toBeGreaterThan(longRange.priorityScore);
    expect(urgent.reasons).toContain("Prior follow-up signal");
  });
});
