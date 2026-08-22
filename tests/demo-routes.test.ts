import { beforeEach, describe, expect, it, vi } from "vitest";

const { redirect } = vi.hoisted(() => ({
  redirect: vi.fn()
}));

vi.mock("next/navigation", () => ({ redirect }));

import DemoPage from "@/app/demo/page";
import HvacDemoPage from "@/app/hvac-demo/page";

describe("public demo routes", () => {
  beforeEach(() => {
    redirect.mockClear();
  });

  it.each([
    ["/demo", DemoPage],
    ["/hvac-demo", HvacDemoPage]
  ])("sends %s to the HVAC follow-up demo", (_route, Page) => {
    Page();

    expect(redirect).toHaveBeenCalledOnce();
    expect(redirect).toHaveBeenCalledWith("/lead-recovery#listen-now-form");
  });
});
