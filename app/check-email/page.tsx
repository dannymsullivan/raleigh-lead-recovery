import Link from "next/link";
import { cookies } from "next/headers";
import { MailCheck } from "lucide-react";
import { AuthShell } from "../components/auth-card";
import { pendingEmailCookie } from "@/lib/auth-email";

function maskEmail(email: string): string {
  const [name, domain] = email.split("@");
  if (!domain) return email;
  return `${name.slice(0, 2)}${"•".repeat(Math.max(2, Math.min(6, name.length - 2)))}@${domain}`;
}

export default async function CheckEmailPage() {
  const email = (await cookies()).get(pendingEmailCookie)?.value;
  return (
    <AuthShell eyebrow="Check your inbox" title="Your secure link is on the way." description={email ? `We sent a sign-in link to ${maskEmail(email)}. It expires shortly and works once.` : "Request a fresh sign-in link to continue."}>
      <div className="grid place-items-center border-2 border-black bg-white p-8 text-center">
        <MailCheck className="h-12 w-12" aria-hidden="true" />
        <p className="mt-5 text-sm font-black">Open the email on this device to continue.</p>
        <p className="mt-2 text-xs font-semibold leading-5 text-black/55">You can close this tab after the dashboard opens.</p>
      </div>
      <p className="mt-7 text-sm font-semibold text-black/55">Didn&apos;t receive it? <Link className="font-extrabold text-black underline decoration-2 underline-offset-4" href="/login">Request another link</Link></p>
    </AuthShell>
  );
}
