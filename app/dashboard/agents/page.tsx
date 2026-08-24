import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { BrandMark } from "@/app/components/brand-mark";
import { DashboardSidebar } from "../dashboard-sidebar";
import { getSupabaseAuth, isSupabaseAuthConfigured } from "@/lib/supabase-auth";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import type { Client, CustomerAgent } from "@/lib/types";
import { AgentManager } from "./agent-manager";
import { saveCustomerAgentAction } from "./actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Call flows | Raleigh Lead Recovery", robots: { index: false, follow: false } };
type PageProps = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

export default async function AgentsPage({ searchParams }: PageProps) {
  if (!isSupabaseAuthConfigured()) redirect("/login?error=configuration");
  const auth = await getSupabaseAuth();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) redirect("/login");
  const admin = getSupabaseAdmin();
  const { data: clientData } = await admin.from("clients").select("*").eq("user_id", user.id).maybeSingle();
  if (!clientData) redirect("/signup?error=workspace");
  const client = clientData as Client;
  const { data: agentData } = await admin.from("customer_agents").select("*").eq("client_id", client.id).order("created_at");
  const search = (await searchParams) ?? {};
  const error = typeof search.error === "string" ? search.error : null;
  const saved = typeof search.agent_saved === "string";

  return <main className="product-ui min-h-screen bg-[#f4f1e8] text-black">
    <header className="border-b border-black"><div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4 sm:px-8"><BrandMark /><Link className="inline-flex h-10 items-center gap-2 text-sm font-black" href="/dashboard/reactivation"><ArrowLeft className="h-4 w-4" /> Dashboard</Link></div></header>
    <div className="mx-auto grid max-w-[1440px] lg:grid-cols-[230px_1fr]">
      <DashboardSidebar active="agents" />
      <div className="min-w-0 px-5 py-8 sm:px-8 sm:py-11">
      <div><p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-black/45">Call-flow workspace</p><h1 className="mt-2 text-3xl font-black tracking-[-0.045em] sm:text-4xl">Raleigh Lead Recovery for {client.business_name}.</h1><p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-black/55">Choose the job, tune the conversation, and save. Your live call flows stay synchronized behind the scenes.</p></div>
      {saved ? <p className="mt-6 border border-black bg-[#d8ff57] p-3 text-sm font-black">Agent saved and synchronized.</p> : null}
      {error ? <p className="mt-6 border border-black bg-black p-3 text-sm font-black text-white">{agentError(error)}</p> : null}
      <div className="mt-8"><AgentManager action={saveCustomerAgentAction} agents={(agentData ?? []) as CustomerAgent[]} client={client} /></div>
      </div>
    </div>
  </main>;
}

function agentError(error: string): string {
  const messages: Record<string, string> = {
    agent_confirmation: "Confirm that you want to provision a dedicated inbound phone number.",
    agent_save: "The agent settings could not be saved.",
    agent_provision: "The settings were saved, but call-flow provisioning needs attention.",
    agent_type: "That agent type is not supported."
  };
  return messages[error] || "The agent could not be updated.";
}
