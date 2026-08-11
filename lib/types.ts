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
  pilot_start: string;
  pilot_end: string;
  avg_job_value: number;
  close_rate: number;
  vapi_assistant_id: string | null;
  vapi_phone_number_id: string | null;
  created_at: string;
};

export type Call = {
  id: string;
  client_id: string;
  vapi_call_id: string;
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

export type ExtractedVapiCall = {
  eventType: string | null;
  vapiCallId: string | null;
  assistantId: string | null;
  phoneNumberId: string | null;
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
