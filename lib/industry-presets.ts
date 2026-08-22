export type IndustryKey =
  | "hvac"
  | "roofing"
  | "plumbing"
  | "electrical"
  | "tree_service"
  | "garage_doors"
  | "pest_control"
  | "landscaping"
  | "restoration"
  | "other";

export type IndustryPreset = {
  label: string;
  trade: string;
  services: string;
  description: string;
  emergencyRules: string;
};

export const industryPresets: Record<Exclude<IndustryKey, "other">, IndustryPreset> = {
  hvac: {
    label: "HVAC",
    trade: "HVAC",
    services: "AC repair\nHeating repair\nHVAC maintenance and tune-ups\nSystem replacement estimates\nIndoor air quality",
    description: "Local HVAC company serving homeowners and businesses across the service area.",
    emergencyRules: "Flag suspected gas or carbon monoxide, smoke or fire, sparking equipment, flooding near electrical equipment, and dangerous indoor temperatures involving a vulnerable person. Tell callers facing immediate danger to leave the property and call 911 or the gas utility."
  },
  roofing: {
    label: "Roofing",
    trade: "Roofing",
    services: "Roof inspections\nLeak repair\nStorm damage assessment\nRoof replacement estimates\nEmergency tarping",
    description: "Local roofing company serving property owners across the service area.",
    emergencyRules: "Flag active interior water intrusion, structural collapse risk, storm damage exposing the property, and electrical hazards caused by water. Tell callers facing immediate danger to leave the area and call 911."
  },
  plumbing: {
    label: "Plumbing",
    trade: "Plumbing",
    services: "Emergency plumbing repair\nLeak and pipe repair\nDrain cleaning\nWater heater repair and installation\nFixture installation",
    description: "Local plumbing company serving homes and businesses across the service area.",
    emergencyRules: "Flag active flooding, burst pipes, sewage backups, no water to the property, and water near electrical equipment. Tell callers facing immediate danger to call 911."
  },
  electrical: {
    label: "Electrical",
    trade: "Electrical",
    services: "Electrical repair\nPanel and breaker service\nOutlet and switch repair\nLighting installation\nGenerator service",
    description: "Local electrical company serving homes and businesses across the service area.",
    emergencyRules: "Flag smoke, fire, burning smells, sparking equipment, exposed live wires, repeated breaker trips with heat, and power loss involving critical medical equipment. Tell callers facing immediate danger to leave the area and call 911."
  },
  tree_service: {
    label: "Tree Service",
    trade: "Tree Service",
    services: "Tree removal\nTree trimming and pruning\nStorm damage cleanup\nStump grinding\nTree health assessments",
    description: "Local tree care company serving residential and commercial properties across the service area.",
    emergencyRules: "Flag trees or limbs on structures, roads, vehicles, or utility lines; split or leaning trees threatening people or property; and storm damage creating an immediate hazard. Never advise callers to approach downed lines. Tell them to stay clear and contact 911 or the utility when there is immediate danger."
  },
  garage_doors: {
    label: "Garage Doors",
    trade: "Garage Doors",
    services: "Garage door repair\nSpring replacement\nOpener repair and installation\nNew garage door installation\nPreventive maintenance",
    description: "Local garage door company serving homes and businesses across the service area.",
    emergencyRules: "Flag doors that have fallen, are hanging loose, trap a person or vehicle, expose the property, or involve visibly broken high-tension components. Tell callers not to touch broken springs or cables and to call 911 for immediate danger."
  },
  pest_control: {
    label: "Pest Control",
    trade: "Pest Control",
    services: "General pest control\nTermite inspections and treatment\nRodent control\nMosquito treatment\nBed bug treatment",
    description: "Local pest control company serving homes and businesses across the service area.",
    emergencyRules: "Flag severe allergic reactions, suspected venomous bites or stings, pesticide exposure, and wildlife inside an occupied living area. Tell callers with immediate medical danger to call 911 or Poison Control. Never give medical or chemical-handling advice."
  },
  landscaping: {
    label: "Landscaping / Hardscaping",
    trade: "Landscaping / Hardscaping",
    services: "Landscape design and installation\nHardscaping and patios\nDrainage solutions\nLawn and plant care\nOutdoor lighting",
    description: "Local landscaping and hardscaping company serving residential and commercial properties across the service area.",
    emergencyRules: "Flag fallen trees or limbs, active flooding, damaged irrigation near electrical equipment, gas-line concerns, and unsafe retaining walls. Tell callers facing immediate danger to stay clear and call 911 or the appropriate utility."
  },
  restoration: {
    label: "Water / Fire / Mold Restoration",
    trade: "Water / Fire / Mold Restoration",
    services: "Emergency water extraction\nFire and smoke damage restoration\nMold assessment and remediation\nStorm damage cleanup\nContents cleaning and restoration",
    description: "Local property restoration company responding to water, fire, smoke, mold, and storm damage across the service area.",
    emergencyRules: "Treat active fire, smoke, gas smells, rising water, sewage, structural instability, and water near electrical systems as urgent. Tell callers to leave unsafe areas and call 911 or the appropriate utility before discussing restoration. Never give medical advice or declare a property safe."
  }
};

export const industryOptions: Array<{ value: IndustryKey; label: string }> = [
  ...Object.entries(industryPresets).map(([value, preset]) => ({ value: value as IndustryKey, label: preset.label })),
  { value: "other", label: "Other — help me set it up" }
];

export function industryKeyForTrade(trade: string): IndustryKey {
  const normalized = trade.trim().toLowerCase();
  const match = Object.entries(industryPresets).find(([, preset]) => preset.trade.toLowerCase() === normalized);
  return (match?.[0] as IndustryKey | undefined) ?? "other";
}

export function isIndustryKey(value: string): value is IndustryKey {
  return value === "other" || Object.hasOwn(industryPresets, value);
}

export function selectedTrade(key: IndustryKey, otherTrade: string): string {
  return key === "other" ? otherTrade.trim() : industryPresets[key].trade;
}

export function isGuidedIndustry(key: IndustryKey): boolean {
  return key === "other";
}
