import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check, Save } from "lucide-react";
import { BrandMark } from "../../components/brand-mark";
import { getSupabaseAuth, isSupabaseAuthConfigured } from "@/lib/supabase-auth";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import type { Client } from "@/lib/types";
import { saveAssistantSettingsAction } from "../actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Mabel settings | Raleigh Lead Recovery", robots: { index: false, follow: false } };
type PageProps = { searchParams?: Promise<Record<string, string | string[] | undefined>> };
const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

export default async function SettingsPage({ searchParams }: PageProps) {
  if (!isSupabaseAuthConfigured()) redirect("/login?error=configuration");
  const auth = await getSupabaseAuth();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) redirect("/login");
  const admin = getSupabaseAdmin();
  const { data } = await admin.from("clients").select("*").eq("user_id", user.id).maybeSingle();
  if (!data) redirect("/signup?error=workspace");
  const client = data as Client;
  const search = (await searchParams) ?? {};

  return (
    <main className="product-ui min-h-screen bg-[#f4f1e8] text-black">
      <header className="border-b-2 border-black"><div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5 sm:px-8"><BrandMark /><Link className="inline-flex items-center gap-2 text-sm font-black" href="/dashboard"><ArrowLeft className="h-4 w-4" /> Back to dashboard</Link></div></header>
      <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="grid gap-8 lg:grid-cols-[0.55fr_1fr]">
          <aside><p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-black/45">Business profile</p><h1 className="mt-2 text-3xl font-black leading-tight tracking-[-0.045em]">The business changes. Every Mabel keeps up.</h1><p className="mt-3 text-sm font-semibold leading-6 text-black/55">These shared facts feed every active agent. Saving synchronizes the new hours, services, and rules to Vapi.</p><Link className="mt-4 inline-flex text-sm font-black underline decoration-2 underline-offset-4" href="/dashboard/agents">Configure individual agents</Link>
            <div className="mt-8 border border-black bg-white p-5"><p className="text-sm font-black">Business profile</p><p className="mt-2 flex items-center gap-2 text-sm font-semibold text-black/55"><span className="h-2.5 w-2.5 rounded-full bg-[#d8ff57] ring-1 ring-black" /> Ready to sync to active agents</p>{client.provisioned_phone_number ? <p className="mt-4 text-xs font-semibold text-black/45">Receptionist number</p> : null}{client.provisioned_phone_number ? <p className="mt-1 text-xl font-black">{client.provisioned_phone_number}</p> : null}</div>
          </aside>

          <form action={saveAssistantSettingsAction} className="grid gap-7">
            {search.saved === "1" ? <div className="flex items-center gap-3 border-2 border-black bg-black p-4 text-sm font-black text-white"><Check className="h-4 w-4" /> Saved. Mabel is updating now.</div> : null}
            {search.error ? <div className="border-2 border-black bg-white p-4 text-sm font-black">{search.error === "consent" ? "Confirm permission to send transactional alerts to the alert number." : "We could not save those settings. Check the required fields and try again."}</div> : null}

            <SettingsSection number="01" title="Business basics">
              <div className="grid gap-5 sm:grid-cols-2"><Field label="Business name" name="business_name" defaultValue={client.business_name} required /><Field label="Business phone" name="owner_phone" type="tel" defaultValue={client.owner_phone} required /><Field label="Business type" name="trade" defaultValue={client.trade} /><Field label="Service area" name="service_area" defaultValue={client.service_area ?? ""} /></div>
              <label className="mt-5 block text-sm font-black">Short business description<textarea className="mt-2 min-h-24 w-full border-2 border-black bg-white p-3 font-semibold leading-6" name="business_description" defaultValue={client.business_description ?? ""} /></label>
            </SettingsSection>

            <SettingsSection number="02" title="Services & call rules">
              <label className="block text-sm font-black">Services<textarea className="mt-2 min-h-36 w-full border-2 border-black bg-white p-3 font-semibold leading-6" name="services" defaultValue={client.services?.join("\n") ?? ""} placeholder="One service per line" /></label>
              <label className="mt-5 block text-sm font-black">What counts as an emergency?<textarea className="mt-2 min-h-28 w-full border-2 border-black bg-white p-3 font-semibold leading-6" name="emergency_rules" defaultValue={client.emergency_rules ?? ""} /></label>
              <div className="mt-5 grid gap-5 sm:grid-cols-2"><Field label="Callback expectation" name="callback_window" defaultValue={client.callback_window ?? ""} /><Field label="Send lead alerts to" name="alert_phone" type="tel" defaultValue={client.alert_phone ?? client.owner_phone} /></div>
              <label className="mt-5 flex items-start gap-3 border-2 border-black bg-white p-4 text-xs font-semibold leading-5 text-black/65"><input className="mt-1 h-4 w-4 flex-none accent-black" name="alert_sms_consent" type="checkbox" required /><span>I confirm that I control the alert number or have the recipient&apos;s express consent, and I agree that Raleigh Lead Recovery may send transactional lead alerts and account notifications to it. Message frequency varies. Message and data rates may apply. Reply STOP to unsubscribe or HELP for help.</span></label>
            </SettingsSection>

            <SettingsSection number="03" title="Weekly hours">
              <div className="border-l-2 border-t-2 border-black">{days.map((day) => { const schedule = client.business_hours?.[day]; return <div className="grid items-center gap-3 border-b-2 border-r-2 border-black bg-white p-3 sm:grid-cols-[100px_1fr_auto]" key={day}><p className="text-sm font-black capitalize">{day}</p><div className="flex items-center gap-2"><input className="h-10 min-w-0 flex-1 border border-black px-2 font-mono text-xs" name={`${day}_open`} type="time" defaultValue={schedule?.open ?? "08:00"} /><span className="text-xs font-black">to</span><input className="h-10 min-w-0 flex-1 border border-black px-2 font-mono text-xs" name={`${day}_close`} type="time" defaultValue={schedule?.close ?? "17:00"} /></div><label className="flex items-center gap-2 text-xs font-black"><input className="h-4 w-4 accent-black" name={`${day}_closed`} type="checkbox" defaultChecked={schedule?.closed ?? (day === "saturday" || day === "sunday")} /> Closed</label></div>; })}</div>
              <label className="mt-5 block text-sm font-black">Timezone<select className="mt-2 h-13 w-full border-2 border-black bg-white px-4 font-semibold" name="timezone" defaultValue={client.timezone ?? "America/New_York"}><option value="America/New_York">Eastern Time</option><option value="America/Chicago">Central Time</option><option value="America/Denver">Mountain Time</option><option value="America/Los_Angeles">Pacific Time</option></select></label>
            </SettingsSection>

            <div className="sticky bottom-4 flex justify-end"><button className="inline-flex h-14 items-center gap-2 border-2 border-white bg-black px-7 text-sm font-black text-white shadow-[6px_6px_0_#f4f1e8,6px_6px_0_2px_#000]" type="submit"><Save className="h-4 w-4" /> Save & update Mabel</button></div>
          </form>
        </div>
      </div>
    </main>
  );
}

function SettingsSection({ number, title, children }: { number: string; title: string; children: React.ReactNode }) { return <section className="border border-black bg-white p-5"><div className="mb-5 flex items-center gap-3 border-b border-black pb-3"><span className="font-mono text-[9px] font-bold text-black/45">{number}</span><h2 className="text-lg font-black tracking-[-0.025em]">{title}</h2></div>{children}</section>; }
function Field({ label, name, defaultValue, type = "text", required = false }: { label: string; name: string; defaultValue: string; type?: string; required?: boolean }) { return <label className="block text-sm font-black">{label}<input className="mt-2 h-13 w-full border-2 border-black bg-white px-3 font-semibold" name={name} defaultValue={defaultValue} type={type} required={required} /></label>; }
