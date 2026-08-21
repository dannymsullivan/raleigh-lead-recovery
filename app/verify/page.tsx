import Link from "next/link";
import { cookies } from "next/headers";
import { ArrowRight } from "lucide-react";
import { verifyPhoneCodeAction } from "../auth-actions";
import { AuthField, AuthShell } from "../components/auth-card";
import { maskPhoneNumber } from "@/lib/phone";

type PageProps = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

export default async function VerifyPage({ searchParams }: PageProps) {
  const search = (await searchParams) ?? {};
  const hasError = search.error === "code";
  const invited = search.source === "invite";
  const phone = (await cookies()).get("mabel_pending_phone")?.value;

  return (
    <AuthShell eyebrow="Check your phone" title="Enter your verification code." description={phone ? invited ? `We sent it to ${maskPhoneNumber(phone)}. Verification opens your existing customer workspace.` : `We sent it to ${maskPhoneNumber(phone)}. Next, you’ll add your business number.` : "Request a new code to continue."}>
      {hasError ? <p className="mb-5 border-2 border-black bg-black p-4 text-sm font-bold text-white">That code is incorrect or expired. Try again or request a new one.</p> : null}
      {phone ? (
        <form action={verifyPhoneCodeAction} className="grid gap-5">
          <AuthField label="Verification code" name="code" type="text" placeholder="123456" autoComplete="one-time-code" />
          <button className="mt-2 inline-flex h-14 items-center justify-center gap-2 bg-black px-6 font-extrabold text-white transition-transform hover:-translate-y-0.5" type="submit">
            Verify and continue <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      ) : null}
      {!invited ? <p className="mt-7 text-sm font-semibold text-black/55"><Link className="font-extrabold text-black underline decoration-2 underline-offset-4" href="/signup">Request a new code</Link></p> : <p className="mt-7 text-sm font-semibold text-black/55">If the code expires, reopen the customer access link to request another.</p>}
    </AuthShell>
  );
}
