import { ArrowRight, CheckCircle2, MessageSquareText, PhoneCall, Wrench } from "lucide-react";
import Link from "next/link";

const demoNumber = "+19842992155";
const directContactNumber = "+18455481569";
const directSmsHref = `sms:${directContactNumber}`;

export const metadata = {
  title: "Audit Requested | Raleigh Lead Recovery",
  description: "Your Raleigh Lead Recovery audit request was received."
};

export default function ThanksPage() {
  return (
    <main className="min-h-screen bg-[#f4f5ef] px-5 py-10 text-[#151713]">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-3xl flex-col justify-center">
        <Link className="mb-10 inline-flex items-center gap-2 font-semibold" href="/">
          <span className="flex h-9 w-9 items-center justify-center rounded bg-[#d6ff5f] text-[#151713]">
            <Wrench className="h-4 w-4" aria-hidden="true" />
          </span>
          Raleigh Lead Recovery
        </Link>

        <div className="rounded border border-[#d9ddcf] bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded bg-[#e0f8df] text-[#2f7d5c]">
            <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
          </div>
          <h1 className="text-4xl font-black leading-tight tracking-normal sm:text-5xl">Your free audit request is in.</h1>
          <p className="mt-5 text-lg leading-8 text-[#4d5148]">
            We will review the shop details, confirm the best forwarding setup, and get the 7-day missed-call audit ready.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a className="inline-flex items-center justify-center gap-2 rounded bg-[#151713] px-5 py-3 font-semibold text-white hover:bg-[#2a2f26]" href={directSmsHref}>
              Text Danny
              <MessageSquareText className="h-4 w-4" aria-hidden="true" />
            </a>
            <a className="inline-flex items-center justify-center gap-2 rounded border border-[#cfd5c5] px-5 py-3 font-semibold hover:bg-[#f8f9f4]" href={`tel:${demoNumber}`}>
              Call the live demo
              <PhoneCall className="h-4 w-4" aria-hidden="true" />
            </a>
            <Link className="inline-flex items-center justify-center gap-2 rounded border border-[#cfd5c5] px-5 py-3 font-semibold hover:bg-[#f8f9f4]" href="/">
              Back to site
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
