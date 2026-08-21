"use client";

import { Check, Copy, Link2, RefreshCw, UserRoundCheck } from "lucide-react";
import { useState } from "react";

export function CustomerAccessPanel({
  active,
  ownerName,
  ownerEmail,
  pendingUntil,
  invitationUrl,
  action
}: {
  active: boolean;
  ownerName: string;
  ownerEmail: string | null;
  pendingUntil: string | null;
  invitationUrl: string | null;
  action: () => void | Promise<void>;
}) {
  const [copied, setCopied] = useState(false);

  async function copyInvitation() {
    if (!invitationUrl) return;
    await navigator.clipboard.writeText(invitationUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return <section className={`scroll-mt-6 mt-6 border border-black bg-white ${active ? "" : "border-l-4 border-l-[#d8ff57]"}`} id="customer-access">
    <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[1fr_auto] lg:items-center">
      <div className="flex min-w-0 items-start gap-4">
        <span className={`grid h-10 w-10 flex-none place-items-center ${active ? "bg-black text-white" : "bg-[#d8ff57] text-black"}`}>{active ? <UserRoundCheck className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}</span>
        <div className="min-w-0">
          <p className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-black/45">Customer access</p>
          <h2 className="mt-1 text-lg font-black tracking-[-0.025em]">{active ? `${ownerName} has dashboard access` : invitationUrl ? "Access link ready to send" : pendingUntil ? "An access link is pending" : "Give the customer their dashboard"}</h2>
          <p className="mt-2 max-w-3xl text-xs font-semibold leading-5 text-black/55">{active ? "This login opens the customer dashboard for this exact workspace. Your admin access remains separate." : `The customer verifies a mobile number and claims this existing workspace. No duplicate customer is created.${ownerEmail ? ` Send it to ${ownerEmail}.` : ""}`}</p>
        </div>
      </div>

      {!active ? <div className="flex flex-col gap-2 sm:min-w-80">
        {invitationUrl ? <button className="inline-flex min-h-10 items-center justify-center gap-2 bg-black px-4 text-xs font-black text-white transition-transform duration-100 active:scale-[0.97]" onClick={copyInvitation} type="button">{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}{copied ? "Copied" : "Copy customer access link"}</button> : null}
        <form action={action}><button className={`inline-flex min-h-11 w-full items-center justify-center gap-2 px-4 text-xs font-black ${invitationUrl ? "border-2 border-black bg-white" : "bg-black text-white"}`} type="submit"><RefreshCw className="h-3.5 w-3.5" />{pendingUntil ? "Replace with a new link" : "Create customer access link"}</button></form>
        {invitationUrl || pendingUntil ? <p className="text-center font-mono text-[9px] font-bold uppercase text-black/45">Expires {formatInvitationExpiry(pendingUntil)}</p> : null}
      </div> : <span className="inline-flex min-h-11 items-center gap-2 border-2 border-black bg-[#d8ff57] px-4 text-xs font-black"><Check className="h-4 w-4" /> Access active</span>}
    </div>
  </section>;
}

function formatInvitationExpiry(value: string | null): string {
  if (!value) return "in 7 days";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));
}
