import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { requestLoginLinkAction } from "../auth-actions";
import { AuthField, AuthShell } from "../components/auth-card";

type PageProps = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

export default async function LoginPage({ searchParams }: PageProps) {
  const search = (await searchParams) ?? {};
  const error = typeof search.error === "string" ? search.error : null;

  return (
    <AuthShell eyebrow="Welcome back" title="Open your customer dashboard." description="Sign in to Raleigh Lead Recovery with a secure email link. No password to remember.">
      {error ? <p className="mb-5 border-2 border-black bg-black p-4 text-sm font-bold text-white">{error === "configuration" ? "Sign-in is temporarily unavailable. Please contact support." : error === "phone" ? "Enter a valid mobile phone number." : error === "sms" ? "We could not send a text to that number. Try again." : error === "email" ? "We could not send a link. Check your email address, or wait a minute before trying again." : error === "account" ? "No customer workspace is connected to that account yet. Use your invitation or create an account." : error === "expired" ? "That sign-in link expired or was opened in a different browser. Request a new one here." : error === "invitation" ? "That customer access link is invalid or expired." : "We could not sign you in."}</p> : null}
      <form action={requestLoginLinkAction} className="grid gap-5">
        <AuthField label="Email address" name="email" type="email" placeholder="you@yourbusiness.com" autoComplete="email" />
        <button className="mt-2 inline-flex h-14 items-center justify-center gap-2 bg-black px-6 font-extrabold text-white transition-transform hover:-translate-y-0.5" type="submit">
          Email me a sign-in link <ArrowRight className="h-4 w-4" />
        </button>
      </form>
      <div className="mt-6 border-2 border-black bg-[#d8ff57] p-4">
        <p className="text-sm font-black">Want to try the chatbot first?</p>
        <Link className="mt-2 inline-flex items-center gap-2 text-sm font-black underline decoration-2 underline-offset-4" href="/#try-chat">Try it live <ArrowRight className="h-4 w-4" /></Link>
      </div>
      <p className="mt-7 text-sm font-semibold text-black/55">New here? <Link className="font-extrabold text-black underline decoration-2 underline-offset-4" href="/signup">Create an account</Link></p>
    </AuthShell>
  );
}
