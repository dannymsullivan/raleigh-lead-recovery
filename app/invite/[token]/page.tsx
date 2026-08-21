import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Check } from "lucide-react";
import { requestInviteCodeAction } from "@/app/auth-actions";
import { AuthField, AuthShell } from "@/app/components/auth-card";
import { hashCustomerInvitationToken, isCustomerInvitationExpired, isCustomerInvitationToken } from "@/lib/customer-invitations";
import { isSupabaseAuthConfigured } from "@/lib/supabase-auth";
import { getSupabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Open your Mabel workspace", robots: { index: false, follow: false } };
type PageProps = { params: Promise<{ token: string }>; searchParams?: Promise<Record<string, string | string[] | undefined>> };

const errors: Record<string, string> = {
  phone: "Enter a mobile number that can receive your sign-in code.",
  consent: "Confirm that we may send the one-time verification text.",
  sms: "We could not send the verification code. Check the mobile number and try again.",
  claimed: "This workspace already has an owner login. Sign in instead.",
  account: "That mobile login is already connected to another workspace. Contact support for help.",
  invalid: "This access link is invalid, expired, or has already been used.",
  configuration: "Customer authentication is not configured yet. Contact support."
};

export default async function CustomerInvitationPage({ params, searchParams }: PageProps) {
  const { token } = await params;
  if (!isCustomerInvitationToken(token)) redirect("/login?error=invitation");
  const search = (await searchParams) ?? {};
  const error = typeof search.error === "string" ? search.error : null;
  const admin = getSupabaseAdmin();
  const { data: invitation } = await admin.from("customer_workspace_invitations").select("client_id,expires_at,accepted_at,revoked_at").eq("token_hash", hashCustomerInvitationToken(token)).maybeSingle();
  const valid = Boolean(invitation && !invitation.accepted_at && !invitation.revoked_at && !isCustomerInvitationExpired(invitation.expires_at));
  const expiresAt = invitation?.expires_at ?? null;
  const { data: client } = invitation ? await admin.from("clients").select("business_name,owner_name,user_id").eq("id", invitation.client_id).maybeSingle() : { data: null };
  const usable = valid && client && !client.user_id && isSupabaseAuthConfigured();

  return <AuthShell eyebrow={usable ? "Your workspace is ready" : "Customer access"} title={usable ? `Welcome to ${client.business_name}.` : "This access link can’t be used."} description={usable ? "Verify one mobile number for sign-in. You’ll enter the dashboard that is already set up for your business." : "Ask your Mabel administrator for a fresh customer access link."}>
    {error ? <p className="mb-5 border-2 border-black bg-black p-4 text-sm font-bold text-white">{errors[error] ?? errors.invalid}</p> : null}
    {usable ? <>
      <div className="mb-6 grid gap-2 border-2 border-black bg-[#d8ff57] p-4 text-xs font-bold"><p className="flex items-center gap-2"><Check className="h-4 w-4" /> No new business profile</p><p className="flex items-center gap-2"><Check className="h-4 w-4" /> No duplicate workspace</p><p className="flex items-center gap-2"><Check className="h-4 w-4" /> Existing campaigns and leads stay attached</p></div>
      <form action={requestInviteCodeAction.bind(null, token)} className="grid gap-5">
        <AuthField label="Mobile number for sign-in" name="phone" type="tel" placeholder="(919) 555-0123" autoComplete="tel" />
        <label className="flex items-start gap-3 text-xs font-semibold leading-5 text-black/60"><input className="mt-1 h-4 w-4 flex-none accent-black" name="sms_consent" type="checkbox" required /><span>I agree to receive one-time verification and account-access texts from Raleigh Lead Recovery. Message and data rates may apply. Reply STOP to unsubscribe or HELP for help. See our <Link className="font-black text-black underline" href="/terms">Terms</Link> and <Link className="font-black text-black underline" href="/privacy">Privacy Policy</Link>.</span></label>
        <button className="mt-2 inline-flex h-14 items-center justify-center gap-2 bg-black px-6 font-extrabold text-white transition-transform duration-100 active:scale-[0.97]" type="submit">Text my access code <ArrowRight className="h-4 w-4" /></button>
      </form>
      {expiresAt ? <p className="mt-6 text-xs font-semibold leading-5 text-black/45">This link expires {new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(new Date(expiresAt))} and works once.</p> : null}
    </> : <Link className="inline-flex h-12 items-center justify-center bg-black px-5 text-sm font-black text-white" href="/login">Go to sign in</Link>}
  </AuthShell>;
}
