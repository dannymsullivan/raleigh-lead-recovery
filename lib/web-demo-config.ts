export type WebDemoMode = "receptionist" | "reactivation";

export function parseWebDemoMode(value: unknown): WebDemoMode | null {
  return value === "receptionist" || value === "reactivation" ? value : null;
}

export function webDemoAgentId(
  mode: WebDemoMode,
  environment: Record<string, string | undefined> = process.env
): string | null {
  if (mode === "reactivation") {
    return environment.RETELL_REACTIVATION_DEMO_AGENT_ID?.trim() || null;
  }

  return environment.RETELL_RECEPTIONIST_DEMO_AGENT_ID?.trim()
    || environment.RETELL_WEB_DEMO_AGENT_ID?.trim()
    || environment.RETELL_DEMO_AGENT_ID?.trim()
    || null;
}

export function webDemoDynamicVariables(mode: WebDemoMode): Record<string, string> {
  if (mode === "reactivation") {
    return {
      demo_channel: "website",
      demo_mode: mode,
      business_name: "Raleigh Lead Recovery",
      contact_name: "there",
      service_type: "seasonal HVAC tune-up",
      lead_source: "a previous seasonal maintenance inquiry",
      lead_age_context: "from an earlier season",
      event_type: "seasonal maintenance",
      event_date: "this season",
      prior_reason: "the system may be due for maintenance",
      owner_name: "the HVAC team",
      callback_expectation: "the team will follow up using the timing you request"
    };
  }

  return {
    demo_channel: "website",
    demo_mode: mode
  };
}
