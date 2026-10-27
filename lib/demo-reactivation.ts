export type DemoLeadStatus = "booked" | "qualified" | "follow_up" | "not_interested" | "no_answer";

export type DemoLead = {
  id: string;
  name: string;
  phone: string;
  source: string;
  ageDays: number;
  status: DemoLeadStatus;
  outcome: string;
  nextStep: string;
  value: number | null;
  attempts: number;
  lastContact: string;
  summary: string;
  transcript: Array<{ speaker: "Snappy Leads" | "Lead"; text: string }>;
};

export const demoCampaign = {
  businessName: "Oak City Home Services",
  name: "Spring database recovery",
  status: "Calling now",
  listSize: 500,
  attempted: 326,
  connected: 112,
  interested: 34,
  booked: 18,
  estimatedPipeline: 216000,
  startedAt: "August 12, 2026",
  callingWindow: "Monday–Friday · 9:00 AM–6:00 PM ET",
  scriptVersion: "Past estimate · v1.3",
  nextCallAt: "Today · 2:15 PM",
};

export const demoLeads: DemoLead[] = [
  {
    id: "lead-001",
    name: "Sarah M.",
    phone: "(919) •••-1842",
    source: "Water heater estimate",
    ageDays: 94,
    status: "booked",
    outcome: "Inspection booked",
    nextStep: "Inspection · Aug 20 at 10:30 AM",
    value: 14500,
    attempts: 1,
    lastContact: "12 minutes ago",
    summary: "Put the project on hold earlier this year. Ready to revisit it before fall and requested a morning inspection.",
    transcript: [
      { speaker: "Snappy Leads", text: "Did you ever get that water heater project taken care of?" },
      { speaker: "Lead", text: "Not yet. We put it off, but we need to revisit it before fall." },
      { speaker: "Snappy Leads", text: "I can help get an inspection back on the calendar. Is morning or afternoon usually better?" },
    ],
  },
  {
    id: "lead-002",
    name: "Marcus T.",
    phone: "(984) •••-7106",
    source: "HVAC replacement inquiry",
    ageDays: 167,
    status: "qualified",
    outcome: "Replacement still needed",
    nextStep: "Sales rep callback today",
    value: 18000,
    attempts: 2,
    lastContact: "38 minutes ago",
    summary: "The system is acting up again after the project was postponed. Wants a rep to review replacement options before scheduling.",
    transcript: [
      { speaker: "Snappy Leads", text: "Is the HVAC replacement you discussed with the team still unresolved?" },
      { speaker: "Lead", text: "Yes. We put it off, but the system is acting up again and I need someone to look at it." },
    ],
  },
  {
    id: "lead-003",
    name: "Jamie R.",
    phone: "(919) •••-0365",
    source: "Online estimate request",
    ageDays: 61,
    status: "booked",
    outcome: "Inspection booked",
    nextStep: "Inspection · Aug 21 at 3:00 PM",
    value: 12000,
    attempts: 1,
    lastContact: "1 hour ago",
    summary: "Got busy after requesting an estimate and never scheduled. Confirmed the project is still active and booked an afternoon visit.",
    transcript: [
      { speaker: "Snappy Leads", text: "Is that home-service project still something you're considering?" },
      { speaker: "Lead", text: "It is. I got busy and never scheduled the inspection." },
    ],
  },
  {
    id: "lead-004",
    name: "Priya K.",
    phone: "(919) •••-4290",
    source: "Repair estimate",
    ageDays: 121,
    status: "follow_up",
    outcome: "Interested this winter",
    nextStep: "Follow up · November 3",
    value: 8500,
    attempts: 1,
    lastContact: "2 hours ago",
    summary: "Project is real but timing moved. Asked the team to reconnect in early November after another home project is finished.",
    transcript: [
      { speaker: "Snappy Leads", text: "Is the repair still on your list, or did you already get it handled?" },
      { speaker: "Lead", text: "Still on the list, just not until later this year." },
    ],
  },
  {
    id: "lead-005",
    name: "Daniel C.",
    phone: "(984) •••-9007",
    source: "Replacement quote",
    ageDays: 203,
    status: "not_interested",
    outcome: "Project completed elsewhere",
    nextStep: "No further calls",
    value: null,
    attempts: 1,
    lastContact: "Yesterday",
    summary: "Homeowner completed the project with another contractor. Record closed and suppressed from future campaign attempts.",
    transcript: [
      { speaker: "Lead", text: "We already had it replaced, so we're all set." },
      { speaker: "Snappy Leads", text: "Understood. I'll close this out so the team doesn't follow up again." },
    ],
  },
  {
    id: "lead-006",
    name: "Elena W.",
    phone: "(919) •••-6618",
    source: "Service inspection form",
    ageDays: 78,
    status: "no_answer",
    outcome: "Voicemail left",
    nextStep: "Second attempt · tomorrow morning",
    value: null,
    attempts: 1,
    lastContact: "Yesterday",
    summary: "First attempt reached voicemail. One follow-up attempt remains within the campaign's approved calling rules.",
    transcript: [],
  },
];

export function demoCampaignProgress(): number {
  return Math.round((demoCampaign.attempted / demoCampaign.listSize) * 100);
}

export function formatDemoCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export const demoStatusLabels: Record<DemoLeadStatus, string> = {
  booked: "Booked",
  qualified: "Qualified",
  follow_up: "Follow up",
  not_interested: "Closed",
  no_answer: "No answer",
};
