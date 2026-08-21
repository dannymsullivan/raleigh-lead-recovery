"use client";

import { useMemo, useState } from "react";
import {
  CalendarCheck,
  Check,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  Database,
  Headphones,
  ListFilter,
  PhoneCall,
  Play,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import {
  demoCampaign,
  demoCampaignProgress,
  demoLeads,
  demoStatusLabels,
  formatDemoCurrency,
  type DemoLead,
  type DemoLeadStatus,
} from "@/lib/demo-reactivation";

type Filter = "all" | DemoLeadStatus;

const filters: Array<{ value: Filter; label: string }> = [
  { value: "all", label: "All leads" },
  { value: "booked", label: "Booked" },
  { value: "qualified", label: "Qualified" },
  { value: "follow_up", label: "Follow up" },
  { value: "no_answer", label: "No answer" },
];

export function DemoDashboard() {
  const [filter, setFilter] = useState<Filter>("all");
  const visibleLeads = useMemo(
    () => filter === "all" ? demoLeads : demoLeads.filter((lead) => lead.status === filter),
    [filter]
  );

  return (
    <div className="mx-auto grid max-w-[1540px] lg:grid-cols-[248px_minmax(0,1fr)]">
      <aside className="hidden min-h-[calc(100vh-81px)] border-r-2 border-black bg-[#eeece3] p-5 lg:flex lg:flex-col">
        <nav className="grid gap-1 text-sm font-black" aria-label="Demo dashboard navigation">
          <a className="flex items-center gap-3 bg-black px-3 py-3 text-white" href="#overview"><Sparkles className="h-4 w-4" /> Overview</a>
          <a className="flex items-center gap-3 px-3 py-3 hover:bg-black/5" href="#lead-inbox"><Users className="h-4 w-4" /> Recovered leads</a>
          <a className="flex items-center gap-3 px-3 py-3 hover:bg-black/5" href="#campaign"><PhoneCall className="h-4 w-4" /> Campaign setup</a>
        </nav>

        <div className="mt-8 border-2 border-black bg-[#d8ff57] p-4">
          <p className="font-mono text-[9px] font-bold uppercase tracking-[0.16em]">Demo mode</p>
          <p className="mt-3 text-sm font-black leading-5">Everything here is sample data.</p>
          <p className="mt-2 text-xs font-semibold leading-5 text-black/60">Explore the complete customer view without placing a real call.</p>
        </div>

        <div className="mt-auto border-t-2 border-black pt-5">
          <p className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-black/45">Signed in as</p>
          <p className="mt-2 text-sm font-black">Jordan Lee</p>
          <p className="text-xs font-semibold text-black/45">Oak City Home Services</p>
        </div>
      </aside>

      <main className="min-w-0" id="overview">
        <section className="px-5 py-8 sm:px-8 sm:py-10 xl:px-11">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-black/45">Lead recovery command center</p>
                <span className="border border-black bg-[#d8ff57] px-2 py-1 font-mono text-[8px] font-bold uppercase tracking-[0.12em]">Illustrative data</span>
              </div>
              <h1 className="mt-4 max-w-4xl font-serif text-4xl font-semibold leading-[0.94] tracking-[-0.055em] sm:text-6xl">Your old leads are talking again.</h1>
              <p className="mt-4 max-w-2xl text-sm font-semibold leading-6 text-black/50">Follow the campaign from uploaded records to conversations, qualified customers, and booked appointments.</p>
            </div>
            <div className="flex items-center gap-3 border-2 border-black bg-white px-4 py-3 text-sm font-black shadow-[4px_4px_0_#000]">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#769000]" /> Chloe is calling
            </div>
          </div>

          <div className="mt-9 grid grid-cols-2 border-l-2 border-t-2 border-black xl:grid-cols-5">
            <Metric icon={Database} label="Leads loaded" value={String(demoCampaign.listSize)} detail="approved records" />
            <Metric icon={PhoneCall} label="Attempts" value={String(demoCampaign.attempted)} detail={`${demoCampaignProgress()}% of list`} />
            <Metric icon={Users} label="Conversations" value={String(demoCampaign.connected)} detail="meaningful connects" />
            <Metric icon={CalendarCheck} label="Booked" value={String(demoCampaign.booked)} detail="appointments" accent />
            <Metric icon={CircleDollarSign} label="Est. pipeline" value={formatDemoCurrency(demoCampaign.estimatedPipeline)} detail="illustrative only" mobileWide />
          </div>

          <div className="mt-7 grid gap-6 2xl:grid-cols-[minmax(0,1fr)_360px]">
            <section className="border-2 border-black bg-white">
              <div className="flex flex-col gap-5 border-b-2 border-black p-5 sm:flex-row sm:items-end sm:justify-between">
                <div><p className="font-mono text-[9px] font-bold uppercase tracking-[0.15em] text-black/40">Campaign funnel</p><h2 className="mt-2 text-2xl font-black tracking-[-0.04em]">From database to booked work</h2></div>
                <p className="text-xs font-bold text-black/40">Updated 4 minutes ago</p>
              </div>
              <div className="grid gap-6 p-5 sm:grid-cols-[1fr_200px] sm:p-7">
                <div className="grid content-start gap-5">
                  <FunnelRow label="Eligible records" value={demoCampaign.listSize} max={demoCampaign.listSize} />
                  <FunnelRow label="Attempted" value={demoCampaign.attempted} max={demoCampaign.listSize} />
                  <FunnelRow label="Conversations" value={demoCampaign.connected} max={demoCampaign.listSize} />
                  <FunnelRow label="Interested" value={demoCampaign.interested} max={demoCampaign.listSize} accent />
                  <FunnelRow label="Appointments booked" value={demoCampaign.booked} max={demoCampaign.listSize} dark />
                </div>
                <div className="border-2 border-black bg-[#f4f1e8] p-5">
                  <p className="font-mono text-[9px] font-bold uppercase tracking-[0.15em] text-black/40">The useful number</p>
                  <p className="mt-7 font-serif text-6xl font-semibold tracking-[-0.07em]">18</p>
                  <p className="mt-2 text-sm font-black">appointments recovered from the existing database</p>
                  <p className="mt-5 border-t border-black/15 pt-4 text-xs font-semibold leading-5 text-black/50">Actual campaign performance will vary by list quality, age, offer, and follow-up.</p>
                </div>
              </div>
            </section>

            <aside className="grid content-start gap-6" id="campaign">
              <section className="border-2 border-black bg-black p-6 text-white">
                <div className="flex items-start justify-between gap-4"><Sparkles className="h-6 w-6" /><span className="bg-[#d8ff57] px-2 py-1 font-mono text-[8px] font-bold uppercase text-black">Live sample</span></div>
                <p className="mt-9 font-mono text-[9px] font-bold uppercase tracking-[0.15em] text-white/45">Active campaign</p>
                <h2 className="mt-2 text-2xl font-black tracking-[-0.04em]">{demoCampaign.name}</h2>
                <dl className="mt-6 grid gap-4 border-t border-white/15 pt-5 text-xs">
                  <CampaignDetail label="Calling window" value={demoCampaign.callingWindow} icon={Clock3} />
                  <CampaignDetail label="Conversation" value={demoCampaign.scriptVersion} icon={Headphones} />
                  <CampaignDetail label="Next batch" value={demoCampaign.nextCallAt} icon={Play} />
                </dl>
              </section>

              <section className="border-2 border-black bg-white p-5">
                <div className="flex items-center gap-3"><ShieldCheck className="h-5 w-5" /><h2 className="font-black">Launch checks</h2></div>
                <ul className="mt-5 grid gap-4 text-xs font-bold">
                  {["Eligible list approved", "Suppression list checked", "Conversation approved", "Calling window enforced"].map((item) => <li className="flex items-center gap-3" key={item}><span className="grid h-5 w-5 place-items-center rounded-full bg-black text-white"><Check className="h-3 w-3" /></span>{item}</li>)}
                </ul>
              </section>
            </aside>
          </div>
        </section>

        <section className="border-t-2 border-black bg-[#eeece3] px-5 py-9 sm:px-8 xl:px-11" id="lead-inbox">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div><p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-black/45">Recovered lead inbox</p><h2 className="mt-3 font-serif text-4xl font-semibold tracking-[-0.055em] sm:text-5xl">Every outcome, one place.</h2></div>
            <div className="flex max-w-full gap-2 overflow-x-auto pb-1" role="group" aria-label="Filter sample leads">
              <span className="flex items-center px-1"><ListFilter className="h-4 w-4" /></span>
              {filters.map((item) => <button className={`h-9 flex-none border-2 border-black px-3 text-xs font-black ${filter === item.value ? "bg-black text-white" : "bg-white"}`} key={item.value} onClick={() => setFilter(item.value)} type="button">{item.label}</button>)}
            </div>
          </div>

          <div className="mt-7 border-2 border-black bg-white">
            {visibleLeads.length ? visibleLeads.map((lead) => <DemoLeadRow key={lead.id} lead={lead} />) : <p className="p-10 text-center text-sm font-bold text-black/45">No sample leads match this filter.</p>}
          </div>
        </section>
      </main>
    </div>
  );
}

function Metric({ icon: Icon, label, value, detail, accent = false, mobileWide = false }: { icon: typeof Database; label: string; value: string; detail: string; accent?: boolean; mobileWide?: boolean }) {
  return <div className={`border-b-2 border-r-2 border-black p-4 sm:p-5 ${mobileWide ? "col-span-2 xl:col-span-1" : ""} ${accent ? "bg-[#d8ff57]" : "bg-white"}`}><div className="flex items-center justify-between"><p className="font-mono text-[8px] font-bold uppercase tracking-[0.12em] text-black/45 sm:text-[9px] sm:tracking-[0.14em]">{label}</p><Icon className="h-4 w-4" /></div><p className="mt-4 text-2xl font-black tracking-[-0.055em] sm:mt-5 sm:text-3xl">{value}</p><p className="mt-1.5 text-[11px] font-semibold text-black/45 sm:mt-2 sm:text-xs">{detail}</p></div>;
}

function FunnelRow({ label, value, max, accent = false, dark = false }: { label: string; value: number; max: number; accent?: boolean; dark?: boolean }) {
  const width = Math.max(4, Math.round((value / max) * 100));
  return <div><div className="mb-2 flex items-end justify-between gap-4"><span className="text-xs font-black">{label}</span><strong className="text-lg">{value}</strong></div><div className="h-3 border border-black bg-[#eeece3]"><div className={`h-full ${dark ? "bg-black" : accent ? "bg-[#9dbe1c]" : "bg-[#c8caC0]"}`} style={{ width: `${width}%` }} /></div></div>;
}

function CampaignDetail({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Clock3 }) {
  return <div className="grid grid-cols-[20px_1fr] gap-3"><Icon className="h-4 w-4 text-[#d8ff57]" /><div><dt className="font-mono text-[8px] font-bold uppercase tracking-[0.13em] text-white/40">{label}</dt><dd className="mt-1 font-bold leading-5 text-white/80">{value}</dd></div></div>;
}

function DemoLeadRow({ lead }: { lead: DemoLead }) {
  return (
    <details className="group border-b-2 border-black last:border-b-0">
      <summary className="grid grid-cols-2 cursor-pointer list-none gap-5 p-5 hover:bg-[#f4f1e8] sm:grid-cols-[minmax(0,1fr)_170px_150px_20px] sm:items-center">
        <div className="col-span-2 min-w-0 sm:col-span-1"><div className="flex flex-wrap items-center gap-2"><StatusBadge status={lead.status} /><span className="font-mono text-[9px] font-bold uppercase text-black/35">{lead.ageDays} days old · {lead.attempts} attempt{lead.attempts === 1 ? "" : "s"}</span></div><h3 className="mt-3 text-lg font-black">{lead.name} <span className="ml-2 text-sm text-black/35">{lead.phone}</span></h3><p className="mt-1 text-xs font-bold text-black/45">{lead.source}</p></div>
        <div><p className="font-mono text-[8px] font-bold uppercase tracking-[0.12em] text-black/35">Outcome</p><p className="mt-1 text-sm font-black">{lead.outcome}</p></div>
        <div><p className="font-mono text-[8px] font-bold uppercase tracking-[0.12em] text-black/35">Opportunity</p><p className="mt-1 text-sm font-black">{lead.value ? formatDemoCurrency(lead.value) : "—"}</p><p className="mt-1 text-[10px] font-bold text-black/35">{lead.lastContact}</p></div>
        <ChevronDown className="hidden h-4 w-4 transition-transform group-open:rotate-180 sm:block" />
      </summary>
      <div className="grid gap-6 border-t border-black/15 bg-[#faf9f5] p-5 lg:grid-cols-[0.8fr_1.2fr]">
        <div><p className="font-mono text-[8px] font-bold uppercase tracking-[0.13em] text-black/35">Chloe&apos;s summary</p><p className="mt-3 text-sm font-semibold leading-6 text-black/65">{lead.summary}</p><div className="mt-5 border-l-4 border-[#a8ca22] bg-white p-4"><p className="font-mono text-[8px] font-bold uppercase text-black/35">Next step</p><p className="mt-1 text-sm font-black">{lead.nextStep}</p></div></div>
        <div><p className="font-mono text-[8px] font-bold uppercase tracking-[0.13em] text-black/35">Conversation excerpt</p>{lead.transcript.length ? <div className="mt-3 grid gap-2">{lead.transcript.map((line, index) => <div className={`max-w-[90%] p-3 text-xs font-semibold leading-5 ${line.speaker === "Chloe" ? "bg-[#eef5d6]" : "ml-auto bg-[#e8e8e2]"}`} key={`${lead.id}-${index}`}><strong className="mb-1 block font-mono text-[8px] uppercase text-black/40">{line.speaker}</strong>{line.text}</div>)}</div> : <p className="mt-3 border border-dashed border-black/20 p-5 text-sm font-semibold text-black/40">No conversation yet. Chloe reached voicemail on the first attempt.</p>}</div>
      </div>
    </details>
  );
}

function StatusBadge({ status }: { status: DemoLeadStatus }) {
  const classes: Record<DemoLeadStatus, string> = { booked: "bg-black text-white", qualified: "bg-[#d8ff57]", follow_up: "bg-white", not_interested: "bg-[#e2e1db]", no_answer: "bg-white text-black/45" };
  return <span className={`border border-black px-2 py-1 font-mono text-[8px] font-bold uppercase tracking-[0.1em] ${classes[status]}`}>{demoStatusLabels[status]}</span>;
}
