import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Mail } from "lucide-react";
import { PublicSiteNav } from "@/app/components/public-site-nav";
import { PublicSiteFooter } from "@/app/components/public-site-footer";
import { contactEmail } from "@/lib/contact";

export const metadata: Metadata = { title: "Contact Danny", description: "Get help with website chat, voice coverage, setup, or your customer dashboard.", alternates: { canonical: "/contact" } };
export default function ContactPage() {
  return <main className="landing-page rlr-home rlr-retro"><PublicSiteNav cta={{ href: "/get-started", label: "Try two weeks free" }} />
    <section className="page-shell contact-page-content"><div><p className="rlr-kicker">Questions or support</p><h1 className="knowledge-public-title">Talk to the person setting it up.</h1><p>I’m Danny Sullivan. Email me about your business, an existing setup, or something you need help with. If you’re already a customer, include your business name so I can find your account.</p><a className="rlr-button rlr-button-primary" href={`mailto:${contactEmail}`}><Mail aria-hidden="true" /> Email Danny</a><p><a className="rlr-inline-link" href={`mailto:${contactEmail}`}>{contactEmail}</a></p><Link className="rlr-inline-link" href="/get-started">Request a free chatbot trial <ArrowRight aria-hidden="true" /></Link></div><Image src="/danny.jpeg" alt="Danny Sullivan" width={340} height={340} /></section>
    <PublicSiteFooter />
  </main>;
}
