import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { requestPhoneOtpAction } from "../auth-actions";
import { AuthField, AuthShell } from "../components/auth-card";

type PageProps = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

const errors: Record<string, string> = {
  missing: "Enter your name and mobile phone number.",
  expired: "That sign-up link expired. Request a new one.",
  workspace: "Your login was created, but the workspace needs attention. Please contact support.",
  configuration: "Self-serve signup needs the Supabase publishable key configured.",
  phone: "Enter your name and a valid mobile phone number.",
  sms: "We could not send a text to that number. Try again.",
  signup: "We could not create the account. Please try again."
};

export default async function SignupPage({ searchParams }: PageProps) {
  const search = (await searchParams) ?? {};
  const error = typeof search.error === "string" ? search.error : null;

  return (
    <AuthShell eyebrow="14 days free · no card" title="Set up Raleigh Lead Recovery." description="Create your account, add the business basics, and hear your call flow work before you send it a real customer. After setup, book a short pilot call with Danny so he can review your first 25 contacts and help launch it safely.">
      {error ? <p className="mb-5 border-2 border-black bg-black p-4 text-sm font-bold text-white">{errors[error] ?? errors.signup}</p> : null}
      <form action={requestPhoneOtpAction} className="grid gap-5">
        <AuthField label="Your name" name="owner_name" autoComplete="name" />
        <AuthField label="Mobile phone" name="phone" type="tel" placeholder="(919) 555-0123" autoComplete="tel" />
        <input type="hidden" name="mode" value="signup" />
        <button className="mt-2 inline-flex h-14 items-center justify-center gap-2 bg-black px-6 font-extrabold text-white transition-transform hover:-translate-y-0.5" type="submit">
          Text me a sign-in code <ArrowRight className="h-4 w-4" />
        </button>
      </form>
      <p className="mt-7 text-sm font-semibold text-black/55">Already have an account? <Link className="font-extrabold text-black underline decoration-2 underline-offset-4" href="/login">Sign in</Link></p>
    </AuthShell>
  );
}
