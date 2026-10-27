import Link from "next/link";
import { BrandMark } from "./brand-mark";
import { contactEmail } from "@/lib/contact";

export function PublicSiteFooter() {
  return <footer className="rlr-footer"><div className="page-shell">
    <div><BrandMark inverted accent="#f7fa00" /><p>Snappy Leads · Hands-on setup and support</p></div>
    <nav aria-label="Footer navigation">
      <Link href="/">Chatbots</Link><Link href="/voice">Voice agents</Link>
      <Link href="/dashboard-demo">Dashboard preview</Link>
      <Link href="/get-started">Try two weeks free</Link><Link href="/contact">Contact</Link><Link href="/blog">Resources</Link>
      <Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/login">Sign in</Link>
      <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
    </nav>
  </div></footer>;
}
