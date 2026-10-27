import type { Metadata } from "next";
import { PublicSiteNav } from "@/app/components/public-site-nav";
import { PublicSiteFooter } from "@/app/components/public-site-footer";
import { ChatTrial } from "@/app/components/chatbot-sales-sections";

export const metadata: Metadata = { title: "Start Your Two-Week Free Trial", description: "Request your website chatbot trial. Setup included, no card required. Tell us about your business and we’ll help you get started.", alternates: { canonical: "/get-started" } };
export default function GetStartedPage() {
  return <main className="landing-page rlr-home rlr-retro trial-request-page">
    <PublicSiteNav cta={{ href: "#trial", label: "Try two weeks free" }} />
    <h1 className="sr-only">Request your two-week website chat trial</h1>
    <ChatTrial />
    <section className="page-shell trial-next-steps"><h2>What happens next?</h2><ol><li><strong>Danny reviews your request.</strong> You’ll receive an email to arrange setup and confirm what your business needs.</li><li><strong>We prepare and test your chatbot.</strong> You approve the information and try the answers before it goes on your website.</li><li><strong>Your 14-day trial begins at launch.</strong> Review chats and leads in your dashboard. We agree on a price before any paid service starts.</li></ol><p>Interested in voice coverage or lead follow-up too? Mention it in the form and we’ll discuss the setup and usage with you.</p></section>
    <PublicSiteFooter />
  </main>;
}
