import { verifyPhoneOtpAction } from "../auth-actions";
import { AuthField, AuthShell } from "../components/auth-card";
import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { pendingPhoneCookie } from "@/lib/auth-email";

export default async function VerifyPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const search = (await searchParams) ?? {};
  const phone = (await cookies()).get(pendingPhoneCookie)?.value;
  if (!phone) redirect("/login?error=expired");
  return <AuthShell eyebrow="Check your phone" title="Enter your six-digit code." description={phone ? `We texted a one-time code to ${phone}.` : "Request a new code to continue."}>
    {search.error ? <p className="mb-5 border-2 border-black bg-black p-4 text-sm font-bold text-white">That code expired or was incorrect. Try again.</p> : null}
    <form action={verifyPhoneOtpAction} className="grid gap-5"><AuthField label="Text message code" name="token" inputMode="numeric" placeholder="123456" autoComplete="one-time-code" /><button className="mt-2 h-14 bg-black px-6 font-extrabold text-white" type="submit">Continue</button></form>
    <p className="mt-7 text-sm font-semibold text-black/55">Prefer email? <Link className="font-extrabold text-black underline decoration-2 underline-offset-4" href="/login">Get a sign-in link</Link></p>
  </AuthShell>;
}
