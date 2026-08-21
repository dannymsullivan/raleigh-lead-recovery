import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";

if (existsSync(".env.local")) {
  for (const line of readFileSync(".env.local", "utf8").split(/\n/)) {
    if (!line || line.trimStart().startsWith("#")) {
      continue;
    }

    const index = line.indexOf("=");
    if (index < 1) continue;
    const key = line.slice(0, index).trim();
    const rawValue = line.slice(index + 1).trim();
    const value = ((rawValue.startsWith('"') && rawValue.endsWith('"')) || (rawValue.startsWith("'") && rawValue.endsWith("'")))
      ? rawValue.slice(1, -1)
      : rawValue;
    process.env[key] ??= value;
  }
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Set SUPABASE_URL and SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY before running the seed script.");
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

const clientId = "11111111-1111-4111-8111-111111111111";
const demoOwnerPhone = process.env.DEMO_OWNER_PHONE || process.env.OWNER_PHONE || "+19195550123";
const demoRetellAgentId = process.env.RETELL_DEMO_AGENT_ID || null;
const demoRetellPhoneNumber = process.env.RETELL_DEMO_PHONE_NUMBER || null;
const now = new Date();

function daysAgo(days: number, hour: number, minute: number): string {
  const date = new Date(now);
  date.setDate(date.getDate() - days);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

async function main() {
  const { error: clientError } = await supabase.from("clients").upsert(
    {
      id: clientId,
      slug: "oak-city-plumbing",
      business_name: "Oak City Plumbing",
      trade: "plumbing",
      owner_name: "Marcus Hill",
      owner_phone: demoOwnerPhone,
      owner_email: "marcus@example.com",
      pilot_start: daysAgo(7, 8, 0).slice(0, 10),
      pilot_end: now.toISOString().slice(0, 10),
      avg_job_value: 650,
      close_rate: 0.42,
      provisioned_phone_number: demoRetellPhoneNumber,
      number_provider: demoRetellPhoneNumber ? "retell" : null
    },
    { onConflict: "id" }
  );

  if (clientError) {
    throw clientError;
  }

  for (const agent of [
    { agent_type: "receptionist", name: "24/7 Receptionist", status: demoRetellAgentId && demoRetellPhoneNumber ? "ready" : "draft", retell_agent_id: demoRetellAgentId, retell_phone_number: demoRetellPhoneNumber },
    { agent_type: "lead_reactivation", name: "Lead Recovery", status: "draft", retell_agent_id: null, retell_phone_number: demoRetellPhoneNumber }
  ]) {
    const { data: existingAgent, error: agentLookupError } = await supabase.from("customer_agents").select("id").eq("client_id", clientId).eq("agent_type", agent.agent_type).eq("is_default", true).maybeSingle();
    if (agentLookupError) throw agentLookupError;
    const result = existingAgent
      ? await supabase.from("customer_agents").update(agent).eq("id", existingAgent.id)
      : await supabase.from("customer_agents").insert({ client_id: clientId, is_default: true, ...agent });
    if (result.error) throw result.error;
  }

  const { error: cleanupError } = await supabase
    .from("calls")
    .delete()
    .eq("client_id", clientId)
    .or("retell_call_id.like.demo-%,retell_call_id.like.synthetic-%,caller_name.eq.Test Caller");

  if (cleanupError) {
    throw cleanupError;
  }

  const calls = [
    call("demo-001", 0, 18, 12, "Tanya Mills", "+19195551001", "414 Northfield Dr, Raleigh, NC", "Water heater leaking into the garage", "emergency", "new_job", "800_2000", "Tonight", "15 minutes"),
    call("demo-002", 0, 13, 8, "Greg Patel", "+19195551002", "91 Linden Way, Cary, NC", "Main drain backing up into downstairs shower", "emergency", "new_job", "over_2000", "As soon as possible", "15 minutes"),
    call("demo-003", 1, 9, 41, "Elaine Ross", "+19195551003", "620 Sasser St, Raleigh, NC", "No hot water since morning", "urgent", "existing_customer", "300_800", "Today", "2 hours"),
    call("demo-004", 1, 16, 22, "Chris Moreno", "+19195551004", "202 Mial St, Raleigh, NC", "Looking for a quote to replace two toilets", "standard", "price_shopper", "300_800", "This week", "2 hours"),
    call("demo-005", 2, 11, 5, "Mia Johnson", "+19195551005", "18 Brighton Rd, Garner, NC", "Kitchen sink is clogged and disposal hums", "urgent", "new_job", "300_800", "Tomorrow morning", "2 hours"),
    call("demo-006", 2, 17, 49, "Robyn Lee", "+19195551006", "704 N East St, Raleigh, NC", "Slow leak under vanity after DIY repair", "standard", "new_job", "under_300", "Friday", "2 hours"),
    call("demo-007", 3, 8, 27, "DeShawn Carter", "+19195551007", "1334 Poole Rd, Raleigh, NC", "Sewage smell and basement floor drain bubbling", "emergency", "new_job", "over_2000", "Immediately", "15 minutes"),
    call("demo-008", 4, 15, 18, "Kara Singh", "+19195551008", "4820 Kaplan Dr, Raleigh, NC", "Bathroom faucet dripping steadily", "standard", "new_job", "under_300", "No rush", "2 hours"),
    call("demo-009", 4, 10, 52, "Bill Andrews", "+19195551009", "77 Jones Franklin Rd, Raleigh, NC", "Needs estimate for tankless water heater", "standard", "price_shopper", "800_2000", "Next week", "2 hours"),
    call("demo-010", 5, 12, 33, "Patricia Nguyen", "+19195551010", "308 Chavis Way, Raleigh, NC", "Only toilet in the house will not flush", "urgent", "new_job", "300_800", "Today", "2 hours"),
    call("demo-011", 6, 9, 36, "Helen Brooks", "+19195551012", "59 Mordecai Dr, Raleigh, NC", "Garbage disposal replacement", "standard", "new_job", "300_800", "This week", "2 hours")
  ];

  const { error: callsError } = await supabase.from("calls").upsert(calls, { onConflict: "retell_call_id" });
  if (callsError) {
    throw callsError;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  console.log(`Seeded demo client: ${clientId}`);
  console.log(`Report: ${appUrl}/report/${clientId}`);
}

function call(
  id: string,
  days: number,
  hour: number,
  minute: number,
  callerName: string,
  callbackNumber: string,
  address: string | null,
  issue: string,
  urgency: string,
  leadType: string,
  valueBand: string,
  requestedTiming: string | null,
  callbackPromisedBy: string | null
) {
  const createdAt = daysAgo(days, hour, minute);
  return {
    client_id: clientId,
    retell_call_id: id,
    caller_number: callbackNumber,
    caller_name: callerName,
    callback_number: callbackNumber,
    service_address: address,
    issue_description: issue,
    urgency,
    lead_type: leadType,
    estimated_value_band: valueBand,
    requested_timing: requestedTiming,
    callback_promised_by: callbackPromisedBy,
    summary: `${callerName} called about: ${issue}. Raleigh Lead Recovery captured callback details and set a ${callbackPromisedBy ?? "normal"} callback expectation.`,
    transcript: `Raleigh Lead Recovery: Thanks for calling Oak City Plumbing. What's going on?\nCaller: ${issue}.\nRaleigh Lead Recovery: Got it. I will get this to Marcus and have him call you back.`,
    recording_url: null,
    duration_seconds: urgency === "emergency" ? 154 : 108,
    raw_payload: { seed: true, retell_call_id: id },
    created_at: createdAt,
    updated_at: createdAt
  };
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
