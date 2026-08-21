import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Call, Client, ExtractedVapiCall } from "./types";

function getSupabaseKey(): string {
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error("Missing SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY");
  }
  return key;
}

export function getSupabaseAdmin(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  if (!url) {
    throw new Error("Missing SUPABASE_URL");
  }

  return createClient(url, getSupabaseKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

export async function findClientByVapiIds(ids: {
  assistantId: string | null;
  phoneNumberId: string | null;
}): Promise<Client | null> {
  const supabase = getSupabaseAdmin();

  if (ids.assistantId || ids.phoneNumberId) {
    let agentQuery = supabase.from("customer_agents").select("client_id").limit(1);
    agentQuery = ids.assistantId
      ? agentQuery.eq("vapi_assistant_id", ids.assistantId)
      : agentQuery.eq("vapi_phone_number_id", ids.phoneNumberId!).eq("agent_type", "receptionist");
    const { data: agent, error: agentError } = await agentQuery.maybeSingle();
    if (agentError) throw agentError;
    if (agent) {
      const { data: customer, error: customerError } = await supabase.from("clients").select("*").eq("id", agent.client_id).maybeSingle();
      if (customerError) throw customerError;
      if (customer) return customer as Client;
    }
  }

  if (ids.assistantId) {
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("vapi_assistant_id", ids.assistantId)
      .limit(1)
      .maybeSingle();

    if (error) {
      throw error;
    }
    if (data) {
      return data as Client;
    }
  }

  if (ids.phoneNumberId) {
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("vapi_phone_number_id", ids.phoneNumberId)
      .limit(1)
      .maybeSingle();

    if (error) {
      throw error;
    }
    if (data) {
      return data as Client;
    }
  }

  return null;
}

export async function upsertCall(
  clientId: string,
  call: ExtractedVapiCall,
  rawPayload: unknown,
  now: Date
): Promise<Call> {
  if (!call.vapiCallId) {
    throw new Error("Cannot upsert a Vapi call without vapiCallId");
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("calls")
    .upsert(
      {
        client_id: clientId,
        vapi_call_id: call.vapiCallId,
        caller_number: call.callerNumber,
        caller_name: call.callerName,
        callback_number: call.callbackNumber ?? call.callerNumber,
        service_address: call.serviceAddress,
        issue_description: call.issueDescription,
        urgency: call.urgency,
        lead_type: call.leadType,
        estimated_value_band: call.estimatedValueBand,
        requested_timing: call.requestedTiming,
        callback_promised_by: call.callbackPromisedBy,
        summary: call.summary,
        transcript: call.transcript,
        recording_url: call.recordingUrl,
        duration_seconds: call.durationSeconds,
        raw_payload: rawPayload,
        updated_at: now.toISOString()
      },
      { onConflict: "vapi_call_id" }
    )
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  const { error: activationError } = await supabase
    .from("clients")
    .update({ test_call_completed_at: now.toISOString(), forwarding_completed_at: now.toISOString() })
    .eq("id", clientId)
    .is("test_call_completed_at", null);

  if (activationError && !activationError.message.includes("test_call_completed_at")) {
    throw activationError;
  }

  return data as Call;
}

export async function claimSmsSend(vapiCallId: string, now: Date): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  const staleBefore = new Date(now.getTime() - 5 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("calls")
    .update({
      sms_send_in_progress_at: now.toISOString(),
      sms_error: null,
      updated_at: now.toISOString()
    })
    .eq("vapi_call_id", vapiCallId)
    .is("sms_sent_at", null)
    .or(`sms_send_in_progress_at.is.null,sms_send_in_progress_at.lt.${staleBefore}`)
    .select("id")
    .maybeSingle();

  if (error) {
    throw error;
  }

  return Boolean(data);
}

export async function markSmsSent(vapiCallId: string, sentAt: Date): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("calls")
    .update({
      sms_sent_at: sentAt.toISOString(),
      sms_send_in_progress_at: null,
      sms_error: null,
      updated_at: sentAt.toISOString()
    })
    .eq("vapi_call_id", vapiCallId);

  if (error) {
    throw error;
  }
}

export async function releaseSmsClaim(vapiCallId: string, errorMessage: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("calls")
    .update({
      sms_send_in_progress_at: null,
      sms_error: errorMessage.slice(0, 500),
      updated_at: new Date().toISOString()
    })
    .eq("vapi_call_id", vapiCallId);

  if (error) {
    throw error;
  }
}

export async function loadClientReport(clientId: string): Promise<{ client: Client; calls: Call[] } | null> {
  const supabase = getSupabaseAdmin();
  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .maybeSingle();

  if (clientError) {
    throw clientError;
  }
  if (!client) {
    return null;
  }

  const { data: calls, error: callsError } = await supabase
    .from("calls")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  if (callsError) {
    throw callsError;
  }

  return {
    client: client as Client,
    calls: (calls ?? []) as Call[]
  };
}
