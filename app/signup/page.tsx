import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { requestSignupCodeAction } from "../auth-actions";
import { AuthField, AuthShell } from "../components/auth-card";

type PageProps = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

const errors: Record<string, string> = {
  missing: "Enter your name and a valid mobile number.",
  consent: "Confirm that we may text the verification code to your mobile number.",
  expired: "That verification attempt expired. Request a new code.",
  workspace: "Your login was created, but the workspace needs attention. Please contact support.",
  configuration: "Self-serve signup needs the Supabase publishable key configured.",
  sms: "We could not text that number. Check it and try again.",
  signup: "We could not create the account. Please try again."
};

export default async function SignupPage({ searchParams }: PageProps) {
  const search = (await searchParams) ?? {};
  const error = typeof search.error === "string" ? search.error : null;

  return (
    <AuthShell eyebrow="14 days free · no card" title="Create your account. That’s it." description="We’ll text your mobile a verification code. After that, you’ll teach Mabel about the business and import your first eligible lead segment.">
      {error ? <p className="mb-5 border-2 border-black bg-black p-4 text-sm font-bold text-white">{errors[error] ?? errors.signup}</p> : null}
      <form action={requestSignupCodeAction} className="grid gap-5">
        <AuthField label="Your name" name="owner_name" autoComplete="name" />
        <AuthField label="Mobile number for sign-in" name="phone" type="tel" placeholder="(919) 555-0123" autoComplete="tel" />
        <label className="flex items-start gap-3 text-xs font-semibold leading-5 text-black/60">
          <input className="mt-1 h-4 w-4 flex-none accent-black" name="sms_consent" type="checkbox" required />
          <span>I agree to receive one-time verification and account-access texts from Raleigh Lead Recovery. Message frequency varies. Message and data rates may apply. Reply STOP to unsubscribe or HELP for help. Consent is not a condition of purchase. See our <Link className="font-black text-black underline" href="/terms">Terms</Link> and <Link className="font-black text-black underline" href="/privacy">Privacy Policy</Link>.</span>
        </label>
        <button className="mt-2 inline-flex h-14 items-center justify-center gap-2 bg-black px-6 font-extrabold text-white transition-transform hover:-translate-y-0.5" type="submit">
          Text me a code <ArrowRight className="h-4 w-4" />
        </button>
      </form>
      <p className="mt-7 text-sm font-semibold text-black/55">Already have an account? <Link className="font-extrabold text-black underline decoration-2 underline-offset-4" href="/login">Sign in</Link></p>
    </AuthShell>
  );
}
