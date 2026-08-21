import { CheckCircle2, Headphones, PhoneOutgoing, Settings2 } from "lucide-react";
import { agentTypeDetails, customerAgentReady, defaultFirstMessage } from "@/lib/customer-agent-config";
import type { Client, CustomerAgent, CustomerAgentType } from "@/lib/types";

type AgentAction = (type: string, formData: FormData) => void | Promise<void>;

export function AgentManager({ client, agents, action, compact = false }: { client: Client; agents: CustomerAgent[]; action: AgentAction; compact?: boolean }) {
  const byType = new Map(agents.map((agent) => [agent.agent_type, agent]));
  return <section className={compact ? "mt-6" : ""} id="agents">
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-black/45">Customer agents</p><h2 className="mt-1 text-xl font-black tracking-[-0.035em] sm:text-2xl">One business, separate jobs.</h2><p className="mt-1.5 max-w-3xl text-xs font-semibold leading-5 text-black/50">Mabel stores the business rules here and keeps each Vapi assistant synchronized. Lead recovery and inbound reception remain independently configurable.</p></div>
      <span className="font-mono text-[9px] font-bold uppercase text-black/40">{agents.filter(customerAgentReady).length} of 2 ready</span>
    </div>
    <div className="mt-4 grid items-start gap-3 lg:grid-cols-2">
      {(["lead_reactivation", "receptionist"] as CustomerAgentType[]).map((type) => <AgentCard action={action.bind(null, type)} agent={byType.get(type) ?? null} client={client} type={type} key={type} />)}
    </div>
  </section>;
}

function AgentCard({ client, agent, type, action }: { client: Client; agent: CustomerAgent | null; type: CustomerAgentType; action: (formData: FormData) => void | Promise<void> }) {
  const details = agentTypeDetails[type];
  const ready = customerAgentReady(agent);
  const Icon = type === "receptionist" ? Headphones : PhoneOutgoing;
  return <details className="group border border-black bg-white">
    <summary className="flex min-h-24 cursor-pointer list-none items-center justify-between gap-4 p-4 marker:content-none">
      <div className="flex min-w-0 items-start gap-3"><span className={`grid h-10 w-10 flex-none place-items-center ${ready ? "bg-[#d8ff57]" : "bg-[#f1efe8]"}`}><Icon className="h-4 w-4" /></span><span className="min-w-0"><span className="flex flex-wrap items-center gap-2"><span className="text-base font-black">{agent?.name || details.defaultName}</span><AgentStatus status={agent?.status || "draft"} /></span><span className="mt-1 block text-xs font-semibold leading-5 text-black/45">{details.description}</span>{agent?.provisioned_phone_number ? <span className="mt-1 block font-mono text-[9px] font-bold">{agent.provisioned_phone_number}</span> : null}</span></div>
      <Settings2 className="h-4 w-4 flex-none text-black/40 transition-transform duration-150 group-open:rotate-90" />
    </summary>
    <form action={action} className="grid gap-4 border-t border-black bg-[#faf9f5] p-4">
      <div className="grid gap-4 sm:grid-cols-[1fr_140px]"><Field label="Agent name" name="name" defaultValue={agent?.name || details.defaultName} /><label className="text-xs font-black">Voice<select className="mt-1.5 h-10 w-full border border-black bg-white px-3 text-sm font-semibold" name="voice_id" defaultValue={agent?.voice_id || "Savannah"}><option value="Savannah">Savannah</option></select></label></div>
      <FieldArea label="Opening message" name="first_message" rows={3} defaultValue={agent?.first_message || defaultFirstMessage(type, client)} />
      {type === "lead_reactivation" ? <FieldArea label="Offer or reason to reconnect" name="offer_details" rows={3} defaultValue={agent?.offer_details || ""} placeholder="Example: Offer a seasonal tune-up or ask whether the original project is still active." /> : null}
      <FieldArea label="Handoff rules" name="handoff_rules" rows={3} defaultValue={agent?.handoff_rules || ""} placeholder="Who should receive interested leads, what should be captured, and what outcome should be promised?" />
      <FieldArea label="Additional guardrails" name="custom_instructions" rows={3} defaultValue={agent?.custom_instructions || ""} placeholder="What should Mabel always say, never say, or do differently for this business?" />
      {type === "receptionist" && !ready ? <label className="flex items-start gap-3 border border-black bg-white p-3 text-[11px] font-semibold leading-4"><input className="mt-0.5 h-4 w-4 flex-none accent-black" name="enable_confirmation" type="checkbox" required /><span>Enable this 24/7 receptionist and provision a dedicated inbound phone number for {client.business_name}.</span></label> : null}
      {agent?.provisioning_error ? <p className="border-l-4 border-[#c33124] bg-white p-3 text-xs font-semibold leading-5">{agent.provisioning_error}</p> : null}
      <div className="flex items-center justify-between gap-3"><p className="text-[10px] font-semibold text-black/40">Saving updates this customer&apos;s Vapi assistant. Vapi credentials stay private.</p><button className="h-10 flex-none bg-black px-4 text-xs font-black text-white" type="submit">{ready ? "Save & sync" : `Set up ${details.label}`}</button></div>
    </form>
  </details>;
}

function AgentStatus({ status }: { status: string }) {
  const ready = status === "ready";
  return <span className={`inline-flex items-center gap-1 border border-black px-2 py-1 font-mono text-[8px] font-bold uppercase ${ready ? "bg-[#d8ff57]" : "bg-white"}`}>{ready ? <CheckCircle2 className="h-3 w-3" /> : null}{status.replaceAll("_", " ")}</span>;
}

function Field({ label, name, defaultValue }: { label: string; name: string; defaultValue: string }) {
  return <label className="text-xs font-black">{label}<input className="mt-1.5 h-10 w-full border border-black bg-white px-3 text-sm font-semibold" name={name} defaultValue={defaultValue} /></label>;
}

function FieldArea({ label, name, defaultValue, placeholder, rows }: { label: string; name: string; defaultValue: string; placeholder?: string; rows: number }) {
  return <label className="text-xs font-black">{label}<textarea className="mt-1.5 w-full resize-y border border-black bg-white p-3 text-sm font-semibold leading-5" name={name} defaultValue={defaultValue} placeholder={placeholder} rows={rows} /></label>;
}
