import type { Call } from "./types";

export const demoReportClientId = "11111111-1111-4111-8111-111111111111";
export const demoReportSlug = "oak-city-plumbing";
export const demoReportHref = "/example-report";

export function resolveReportClientId(reportParam: string): string {
  return reportParam === demoReportSlug ? demoReportClientId : reportParam;
}

export function isDemoReport(reportParam: string, clientId: string): boolean {
  return reportParam === demoReportSlug || clientId === demoReportClientId;
}

export function isVisibleDemoCall(call: Pick<Call, "vapi_call_id" | "lead_type">): boolean {
  return call.vapi_call_id.startsWith("demo-") && call.lead_type !== "spam";
}
