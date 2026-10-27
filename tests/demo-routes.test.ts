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
    ["/demo", DemoPage, "/voice#talk-now"],
    ["/hvac-demo", HvacDemoPage, "/hvac#listen"]
  ] as const)("sends %s directly to its current demo", (_route, Page, destination) => {
    Page();

    expect(redirect).toHaveBeenCalledOnce();
    expect(redirect).toHaveBeenCalledWith(destination);
  });
});
