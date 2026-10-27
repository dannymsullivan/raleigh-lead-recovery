import Link from "next/link";
import { cookies } from "next/headers";
import { MailCheck } from "lucide-react";
import { AuthShell } from "../components/auth-card";
import { pendingEmailCookie, pendingInvitationCookie, pendingModeCookie } from "@/lib/auth-email";
import { resendEmailLinkAction } from "../auth-actions";

function maskEmail(email: string): string {
  const [name, domain] = email.split("@");
  if (!domain) return email;
  return `${name.slice(0, 2)}${"•".repeat(Math.max(2, Math.min(6, name.length - 2)))}@${domain}`;
}

export default async function CheckEmailPage() {
  const cookieStore = await cookies();
  const email = cookieStore.get(pendingEmailCookie)?.value;
  const mode = cookieStore.get(pendingModeCookie)?.value;
  const invitation = cookieStore.get(pendingInvitationCookie)?.value;
  const restartPath = mode === "invite" && invitation ? `/invite/${encodeURIComponent(invitation)}` : mode === "signup" ? "/signup" : "/login";
  return (
    <AuthShell eyebrow="Check your inbox" title="Your secure link is on the way." description={email ? `We sent a sign-in link to ${maskEmail(email)}. It expires shortly and works once.` : "Request a fresh sign-in link to continue."}>
      <div className="grid place-items-center border-2 border-black bg-white p-8 text-center">
        <MailCheck className="h-12 w-12" aria-hidden="true" />
        <p className="mt-5 text-sm font-black">Open the link in this same browser.</p>
        <p className="mt-2 text-xs font-semibold leading-5 text-black/55">Check your spam folder if it doesn’t arrive. You can close this tab after your Raleigh Lead Recovery workspace opens.</p>
      </div>
      {email ? <form action={resendEmailLinkAction} className="mt-6"><button className="inline-flex min-h-12 w-full items-center justify-center border-2 border-black bg-black px-5 py-3 font-extrabold text-white" type="submit">Send another link</button><p className="mt-2 text-xs font-semibold text-black/55">Please wait a minute between requests. Use the most recent email.</p></form> : null}
      <p className="mt-7 text-sm font-semibold text-black/55"><Link className="font-extrabold text-black underline decoration-2 underline-offset-4" href={restartPath}>{email ? "Use a different email address" : "Request a sign-in link"}</Link></p>
    </AuthShell>
  );
}
