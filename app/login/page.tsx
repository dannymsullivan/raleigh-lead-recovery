import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { requestLoginLinkAction } from "../auth-actions";
import { AuthField, AuthShell } from "../components/auth-card";

type PageProps = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

export default async function LoginPage({ searchParams }: PageProps) {
  const search = (await searchParams) ?? {};
  const error = typeof search.error === "string" ? search.error : null;

  return (
    <AuthShell eyebrow="Welcome back" title="Open your customer dashboard." description="Sign in to see conversations, qualified leads, and the next steps your agents captured for the team.">
      {error ? <p className="mb-5 border-2 border-black bg-black p-4 text-sm font-bold text-white">{error === "configuration" ? "Customer login needs the Supabase publishable key configured." : error === "email" ? "We could not email that address. Check it or create an account first." : error === "invitation" ? "That customer access link is invalid or expired. Ask for a fresh link." : error === "expired" ? "That sign-in link is invalid or expired. Request a new one." : "We could not sign you in."}</p> : null}
      <form action={requestLoginLinkAction} className="grid gap-5">
        <AuthField label="Email address" name="email" type="email" placeholder="you@business.com" autoComplete="email" />
        <button className="mt-2 inline-flex h-14 items-center justify-center gap-2 bg-black px-6 font-extrabold text-white transition-transform hover:-translate-y-0.5" type="submit">
          Email me a sign-in link <ArrowRight className="h-4 w-4" />
        </button>
      </form>
      <div className="mt-6 border-2 border-black bg-[#d8ff57] p-4">
        <p className="text-sm font-black">Want to hear Raleigh Lead Recovery first?</p>
        <Link className="mt-2 inline-flex items-center gap-2 text-sm font-black underline decoration-2 underline-offset-4" href="/#talk-now">Try it live <ArrowRight className="h-4 w-4" /></Link>
      </div>
      <p className="mt-7 text-sm font-semibold text-black/55">New here? <Link className="font-extrabold text-black underline decoration-2 underline-offset-4" href="/signup">Start free</Link></p>
    </AuthShell>
  );
}
