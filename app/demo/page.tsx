import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { BrandMark } from "../components/brand-mark";
import { DemoDashboard } from "./demo-dashboard";
import { contactEmail } from "@/lib/contact";

export const metadata: Metadata = {
  title: "Lead Recovery Dashboard Demo | Raleigh Lead Recovery",
  description: "Explore a sample Raleigh Lead Recovery campaign from old lead list to calls, qualified homeowners, and booked inspections.",
  robots: { index: false, follow: false },
};

const pilotHref = `mailto:${contactEmail}?subject=${encodeURIComponent("Lead recovery pilot")}`;

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-[#f4f1e8] text-black">
      <header className="border-b-2 border-black bg-[#f4f1e8]">
        <div className="mx-auto flex min-h-20 max-w-[1540px] items-center justify-between gap-5 px-5 sm:px-8">
          <BrandMark />
          <div className="flex items-center gap-3">
            <Link className="hidden items-center gap-2 text-xs font-black sm:inline-flex" href="/"><ArrowLeft className="h-4 w-4" /> Back to site</Link>
            <a className="inline-flex h-10 items-center gap-2 bg-black px-4 text-xs font-black text-white" href={pilotHref}>Discuss a pilot <ArrowRight className="h-4 w-4" /></a>
          </div>
        </div>
      </header>
      <DemoDashboard />
    </div>
  );
}
