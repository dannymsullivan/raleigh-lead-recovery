import { PublicSiteFooter } from "@/app/components/public-site-footer";
import type { Metadata } from "next";
import { PublicSiteNav } from "@/app/components/public-site-nav";
import { ChatDashboardDemo } from "./chat-dashboard-demo";

export const metadata: Metadata = { title: "Chat Dashboard Preview | Raleigh Lead Recovery", robots: { index: false, follow: false } };
export default function DashboardDemoPage() {
  return <main className="landing-page rlr-home rlr-retro"><PublicSiteNav cta={{ href: "/login", label: "Customer sign in" }} /><div className="page-shell py-12"><ChatDashboardDemo /></div><PublicSiteFooter /></main>;
}
