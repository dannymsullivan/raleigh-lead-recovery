import { describe, expect, it } from "vitest";
import { customerCrmPath, customerSlug } from "@/lib/customer-slug";

describe("customer URLs", () => {
  it("turns a business name into a readable URL segment", () => {
    expect(customerSlug("Oak City Home Services")).toBe("oak-city-home-services");
    expect(customerSlug("  Ápex HVAC & Plumbing, LLC  ")).toBe("apex-hvac-plumbing-llc");
  });

  it("falls back safely for names without URL characters", () => {
    expect(customerSlug("***")).toBe("customer");
  });

  it("uses the readable slug in CRM paths and supports legacy records", () => {
    expect(customerCrmPath({ id: "client-id", slug: "oak-city-home-services" })).toBe("/admin/customers/oak-city-home-services");
    expect(customerCrmPath({ id: "client-id", slug: null })).toBe("/admin/customers/client-id");
  });
});
