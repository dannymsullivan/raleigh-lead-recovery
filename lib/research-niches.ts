export type ResearchNiche = {
  slug: string;
  name: string;
  audience: string;
  headline: string;
  description: string;
  knowledge: string[];
  questions: { question: string; answer: string; source: string }[];
  handoff: string[];
  researchQuestion: string;
};

// These are illustrative company policies for research, not technical specifications
// or representations about any prospect's services. No sample inquiry is submitted.
export const researchNiches: ResearchNiche[] = [
  {
    slug: "warehouse-racking",
    name: "Warehouse racking",
    audience: "Racking installers & warehouse build coordinators",
    headline: "Your racking expertise. Ready for the next project inquiry.",
    description: "Help warehouse operators understand installation scope, relocation options, and your coordination process before they ask your team for a quote.",
    knowledge: ["Installation-only vs. design-and-install scope", "New, used, and existing rack evaluation process", "Site visits, drawings, and permit coordination", "Working around an operating warehouse"],
    questions: [
      { question: "Can you install racking we already own?", answer: "In this example, the company reviews customer-owned racking before accepting an installation. The first step is sharing the manufacturer details, component list, and any existing drawings. A site review determines what can be used and what additional design work is needed. Final suitability and pricing come from the project team.", source: "Customer-supplied equipment policy" },
      { question: "Can the warehouse stay open during installation?", answer: "This example company considers phased installation. The project team reviews your operating hours, access routes, staging space, and areas that can be taken out of service. Share your preferred work windows and deadline so they can assess a plan; the assistant cannot confirm a safe work sequence or crew availability.", source: "Phased installation & site access guide" },
      { question: "What do you need before you can quote?", answer: "For this example: the facility location, whether this is a new layout or a relocation, approximate rack quantities, available drawings, and the target completion date. Tell the team whether you need installation only or design and build coordination. Missing details can be discussed during the site review.", source: "Project inquiry checklist" },
    ],
    handoff: ["Facility location and project type", "Approximate scope and equipment ownership", "Drawings available and coordination needed", "Desired timeline and decision-maker contact"],
    researchQuestion: "What do warehouse customers need to understand before your team can have a useful quoting conversation?",
  },
  {
    slug: "modular-cleanrooms",
    name: "Modular cleanrooms",
    audience: "Modular cleanroom designers & installers",
    headline: "Help buyers understand the cleanroom project ahead.",
    description: "Bring your scope, planning process, and project requirements into the conversation while buyers are deciding how to move forward.",
    knowledge: ["Modular system options and intended applications", "Design, installation, and testing responsibilities", "Site information needed for an initial review", "Expansion, relocation, and ongoing support policies"],
    questions: [
      { question: "Can a modular cleanroom expand later?", answer: "For this sample company, future expansion is a planning topic, not an automatic feature of every installation. Share the space you expect to need now and later, the available footprint, and any process changes. The design team checks the proposed layout and supporting systems before recommending an expandable configuration.", source: "Future expansion planning guide" },
      { question: "Does installation include testing and certification?", answer: "This example company separates installation from testing and certification in its proposal. The quote identifies who performs each step, what documentation is included, and which responsibilities stay with the customer. Your required standards and acceptance criteria need a specialist review before the scope is agreed.", source: "Project scope & handover policy" },
      { question: "What should we prepare for a first discussion?", answer: "In this example, start with the intended process, location, approximate footprint, any requirements already specified by your team, and desired start date. Existing plans and information about the host building help the team prepare. You do not need to choose a system before that conversation.", source: "Initial project review checklist" },
    ],
    handoff: ["Application and facility location", "Approximate footprint and expansion plans", "Known requirements and available plans", "Project stage, timing, and responsible contact"],
    researchQuestion: "Which scope or planning questions do prospective cleanroom buyers ask before they are ready to speak with your project team?",
  },
  {
    slug: "spray-booth-installation",
    name: "Spray-booth installation",
    audience: "Commercial spray-booth suppliers & installers",
    headline: "Answer the questions between a new booth and a quote.",
    description: "Help shop owners understand your booth options, installation scope, and preparation process before their first project call.",
    knowledge: ["Booth options and supported applications", "Equipment supply vs. installation responsibilities", "Site surveys and trade coordination process", "Maintenance, training, and support scope"],
    questions: [
      { question: "Is this a complete installation or equipment only?", answer: "This sample company offers equipment-only and coordinated installation proposals. The proposal spells out equipment delivery, assembly, site work, trade responsibilities, and commissioning. Share the location and whether you already have a contractor so the project team can discuss the right scope.", source: "Supply & installation scope guide" },
      { question: "Can you replace our booth in the same space?", answer: "In this example, an existing location is reviewed before a replacement is recommended. The team asks about the current booth, building layout, process, and available project window. Reusing the footprint or existing services is a site-specific decision, not something the assistant can approve.", source: "Replacement project review policy" },
      { question: "How do we prepare for a quote?", answer: "For this example, provide what you coat, approximate item dimensions, your current workflow, site location, and project timing. Existing plans and equipment information help. The team confirms the technical requirements and any necessary site review before giving a firm quote.", source: "Pre-quote discovery checklist" },
    ],
    handoff: ["Application and items being coated", "New installation or replacement", "Location, plans, and installation scope", "Target date and project contact"],
    researchQuestion: "What do buyers most often misunderstand about what is included in a spray-booth installation?",
  },
  {
    slug: "commercial-cold-rooms",
    name: "Commercial walk-in coolers",
    audience: "Walk-in cooler & freezer installation specialists",
    headline: "Help buyers plan the cold room before the quote.",
    description: "Make your equipment options, installation process, and service responsibilities easier to understand for businesses planning a major refrigeration purchase.",
    knowledge: ["Cooler, freezer, and supported application options", "Indoor and outdoor project review process", "Delivery, installation, and trade responsibilities", "Warranty, maintenance, and service coverage"],
    questions: [
      { question: "Can you add a walk-in to our existing building?", answer: "This sample company begins with a site review for additions to existing buildings. Share the location, intended use, approximate space, and any plans you have. The project team checks access and site requirements before recommending a layout or confirming feasibility.", source: "Existing-building project guide" },
      { question: "What is included in installation?", answer: "For this example, the proposal lists the enclosure, refrigeration equipment, delivery, assembly, commissioning, and any separately scoped trade work. The team confirms who handles each item before the order is approved. An equipment price alone does not describe the full project scope.", source: "Installation responsibilities checklist" },
      { question: "Can you help us work out what we need?", answer: "In this example, the first conversation covers what you store, your operating pattern, approximate storage volume, and the space available. Your specialist determines the final size and equipment specification. The assistant can explain the process and collect the context for that discussion.", source: "First consultation guide" },
    ],
    handoff: ["Intended use and facility location", "Cooler or freezer and approximate space", "Existing building or new construction", "Timeline and decision-maker contact"],
    researchQuestion: "Which installation and equipment questions stop a business from being ready to request a walk-in quote?",
  },
  {
    slug: "industrial-dust-collection",
    name: "Industrial dust collection",
    audience: "Dust collection system designers & installation teams",
    headline: "Put your system expertise into the first conversation.",
    description: "Help manufacturers understand your design process, retrofit services, and installation scope before they request a system proposal.",
    knowledge: ["Supported industries and project types", "New system vs. retrofit evaluation process", "Site assessment and information requirements", "Installation, commissioning, and maintenance scope"],
    questions: [
      { question: "Can we expand our existing collection system?", answer: "This example company reviews the existing system and planned process changes before recommending an expansion. Share the current equipment details and the machines or processes you want to add. An engineer must assess capacity and suitability; the assistant does not size equipment or approve modifications.", source: "Retrofit & expansion review process" },
      { question: "Do you handle ductwork and installation too?", answer: "For this sample company, a coordinated proposal can include equipment, ductwork, installation, and commissioning. The project team identifies included work and customer responsibilities after reviewing the site. The assistant can explain the published scope and help you prepare for that review.", source: "System project scope guide" },
      { question: "What do you need to start a proposal?", answer: "In this example, the team starts with your process, materials handled, equipment list, site location, and project goals. Existing drawings and system information are useful if available. Technical and hazard assessments stay with qualified specialists; this conversation gathers background for them.", source: "Application review checklist" },
    ],
    handoff: ["Manufacturing process and project goals", "Existing system or new installation", "Available equipment information and drawings", "Facility location, timing, and project contact"],
    researchQuestion: "What background information and explanations make an initial dust collection inquiry useful to your engineering or sales team?",
  },
  {
    slug: "residential-elevators",
    name: "Residential elevators",
    audience: "Home elevator dealers & installation specialists",
    headline: "Help homeowners understand the project before the price.",
    description: "Give homeowners a clear starting point for retrofit options, installation responsibilities, and the steps involved in planning a home elevator.",
    knowledge: ["Supported home elevator options", "Existing-home vs. new-build planning process", "Builder coordination and installation responsibilities", "Service coverage, maintenance, and warranty policies"],
    questions: [
      { question: "Can an elevator be added to an existing home?", answer: "This sample company reviews existing homes before recommending an option. Share your location, the floors you want to connect, and whether you have plans or a builder involved. The team needs a site assessment to determine what fits and what building work is required.", source: "Existing-home consultation guide" },
      { question: "Do I need to hire a separate builder?", answer: "In this example, the proposal separates elevator installation from building work and identifies who coordinates each part. Tell the team if you already have a builder. They can explain their coordination process and the responsibilities that would be included in your project.", source: "Builder coordination policy" },
      { question: "What happens after installation?", answer: "For this sample company, the handover explains operation, service contacts, the maintenance plan, and the written warranty terms. Ask the team to confirm coverage for your location and selected equipment. The assistant can explain approved policy, while the team confirms your specific agreement.", source: "Handover & ongoing service guide" },
    ],
    handoff: ["Home location and floors to connect", "Existing home or new build", "Plans and builder involvement", "Desired timing and homeowner contact"],
    researchQuestion: "What do homeowners need answered before they feel comfortable requesting an elevator consultation?",
  },
];

export function getResearchNiche(slug: string) {
  return researchNiches.find((niche) => niche.slug === slug);
}
