export const urgencyValues = ["emergency", "urgent", "standard", "spam", "other"] as const;
export type Urgency = (typeof urgencyValues)[number];

export const leadTypeValues = [
  "new_job",
  "existing_customer",
  "complaint",
  "price_shopper",
  "spam",
  "other"
] as const;
export type LeadType = (typeof leadTypeValues)[number];

export const valueBandValues = ["under_300", "300_800", "800_2000", "over_2000", "unknown"] as const;
export type ValueBand = (typeof valueBandValues)[number];

export type Client = {
  id: string;
  slug?: string | null;
  user_id?: string | null;
  business_name: string;
  trade: string;
  owner_name: string;
  owner_phone: string;
  owner_email: string | null;
  service_area?: string | null;
  business_description?: string | null;
  services?: string[];
  business_hours?: Record<string, { closed: boolean; open: string; close: string }>;
  timezone?: string;
  emergency_rules?: string | null;
  callback_window?: string;
  alert_phone?: string | null;
  alert_sms_consent_at?: string | null;
  alert_sms_consent_phone?: string | null;
  onboarding_completed_at?: string | null;
  trial_started_at?: string | null;
  trial_ends_at?: string | null;
  account_status?: "onboarding" | "trialing" | "active" | "past_due" | "canceled";
  provisioning_status?: "pending" | "provisioning" | "ready" | "needs_configuration" | "error";
  provisioning_error?: string | null;
  provisioned_phone_number?: string | null;
  number_provider?: string | null;
  last_provision_attempt_at?: string | null;
  forwarding_completed_at?: string | null;
  test_call_completed_at?: string | null;
  product_mode?: "website_chat" | "reactivation" | "missed_call_recovery";
  is_test_account?: boolean;
  pilot_start: string;
  pilot_end: string;
  avg_job_value: number;
  close_rate: number;
  created_at: string;
};

export type CustomerAgentType = "receptionist" | "lead_reactivation";
export type CustomerAgentStatus = "draft" | "provisioning" | "ready" | "needs_configuration" | "error" | "disabled";

export type CustomerAgent = {
  id: string;
  client_id: string;
  agent_type: CustomerAgentType;
  name: string;
  is_default: boolean;
  status: CustomerAgentStatus;
  retell_agent_id: string | null;
  retell_llm_id: string | null;
  retell_agent_version: number | null;
  retell_phone_number: string | null;
  provisioned_phone_number: string | null;
  voice_id: string;
  first_message: string | null;
  offer_details: string | null;
  handoff_rules: string | null;
  custom_instructions: string | null;
  provisioning_error: string | null;
  last_provision_attempt_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ReactivationCampaign = {
  id: string;
  client_id: string;
  agent_id?: string | null;
  name: string;
  status: "draft" | "ready" | "running" | "paused" | "completed";
  service_type: string;
  calling_timezone: string;
  calling_window_start: string;
  calling_window_end: string;
  max_attempts: number;
  daily_limit: number;
  eligibility_attested_at: string | null;
  launched_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ReactivationContactStatus = "queued" | "calling" | "interested" | "follow_up" | "booked" | "contacted" | "not_interested" | "completed_project" | "wrong_number" | "do_not_call" | "no_answer" | "failed";

export type ReactivationContact = {
  id: string;
  client_id: string;
  campaign_id: string;
  external_id?: string | null;
  company?: string | null;
  brand?: string | null;
  name: string;
  phone_e164: string;
  email: string | null;
  source: string | null;
  lead_age_days: number | null;
  notes: string | null;
  import_bucket?: "ready_to_reengage" | "price_sensitive" | "timing_or_capacity" | "lost_elsewhere" | "disrupted" | "review" | "exclude" | null;
  import_metadata?: Record<string, string>;
  event_date?: string | null;
  event_type?: "wedding" | "corporate" | "school" | "birthday" | "fundraiser" | "community" | "private_event" | "other" | "unknown" | null;
  event_location?: string | null;
  prior_reason?: string | null;
  priority_score?: number | null;
  enrichment_version?: string | null;
  status: ReactivationContactStatus;
  outcome: string | null;
  project_type: string | null;
  requested_timing: string | null;
  qualification_notes: string | null;
  next_step: string | null;
  estimated_value: number | null;
  attempt_count: number;
  last_attempt_at: string | null;
  next_attempt_at: string | null;
  owner_contacted_at: string | null;
  booked_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ReactivationAttempt = {
  id: string;
  client_id: string;
  campaign_id: string;
  contact_id: string;
  retell_call_id: string | null;
  status: "queued" | "in_progress" | "completed" | "failed";
  outcome: string | null;
  summary: string | null;
  transcript: string | null;
  recording_url: string | null;
  duration_seconds: number | null;
  structured_data: Record<string, unknown> | null;
  error: string | null;
  owner_alert_sent_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Call = {
  id: string;
  client_id: string;
  retell_call_id: string;
  caller_number: string | null;
  caller_name: string | null;
  callback_number: string | null;
  service_address: string | null;
  issue_description: string | null;
  urgency: Urgency;
  lead_type: LeadType;
  estimated_value_band: ValueBand;
  requested_timing: string | null;
  callback_promised_by: string | null;
  summary: string | null;
  transcript: string | null;
  recording_url: string | null;
  duration_seconds: number | null;
  raw_payload: unknown;
  sms_sent_at: string | null;
  sms_send_in_progress_at?: string | null;
  sms_error?: string | null;
  created_at: string;
  updated_at: string;
  lead_status?: "new" | "contacted" | "booked" | "lost" | "spam";
  owner_notes?: string | null;
  callback_completed_at?: string | null;
  booked_value?: number | null;
};

export type ExtractedRetellCall = {
  eventType: string | null;
  retellCallId: string | null;
  agentId: string | null;
  phoneNumber: string | null;
  callerNumber: string | null;
  callerName: string | null;
  callbackNumber: string | null;
  serviceAddress: string | null;
  issueDescription: string | null;
  urgency: Urgency;
  leadType: LeadType;
  estimatedValueBand: ValueBand;
  requestedTiming: string | null;
  callbackPromisedBy: string | null;
  summary: string | null;
  transcript: string | null;
  recordingUrl: string | null;
  durationSeconds: number | null;
};
