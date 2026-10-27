import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { pendingEmailCookie, pendingInvitationCookie, pendingModeCookie, pendingOwnerNameCookie } from "@/lib/auth-email";
import { hashCustomerInvitationToken, isCustomerInvitationToken } from "@/lib/customer-invitations";
import { uniqueCustomerSlug } from "@/lib/customer-slug";
import { getSupabaseAuth } from "@/lib/supabase-auth";
import { getSupabaseAdmin } from "@/lib/supabase-server";

export const runtime = "nodejs";

function go(request: NextRequest, path: string): NextResponse {
  return NextResponse.redirect(new URL(path, request.url));
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const code = request.nextUrl.searchParams.get("code");
  if (!code) return go(request, "/login?error=expired");

  const cookieStore = await cookies();
  const mode = cookieStore.get(pendingModeCookie)?.value;
  const pendingEmail = cookieStore.get(pendingEmailCookie)?.value;
  const invitationToken = cookieStore.get(pendingInvitationCookie)?.value;
  if ((mode !== "signup" && mode !== "login" && mode !== "invite") || !pendingEmail) {
    return go(request, "/login?error=expired");
  }

  const auth = await getSupabaseAuth();
  const { data, error } = await auth.auth.exchangeCodeForSession(code);
  if (error || !data.user || !data.session || data.user.email?.toLowerCase() !== pendingEmail.toLowerCase()) {
    return go(request, "/login?error=expired");
  }

  cookieStore.delete(pendingEmailCookie);
  cookieStore.delete(pendingModeCookie);
  cookieStore.delete(pendingInvitationCookie);
  cookieStore.delete(pendingOwnerNameCookie);
  const admin = getSupabaseAdmin();

  if (mode === "login") {
    const { data: client } = await admin.from("clients").select("id").eq("user_id", data.user.id).maybeSingle();
    if (!client) {
      await auth.auth.signOut();
      return go(request, "/login?error=account");
    }
    return go(request, "/dashboard");
  }

  if (mode === "invite") {
    if (!invitationToken || !isCustomerInvitationToken(invitationToken)) return go(request, "/login?error=invitation");
    const now = new Date().toISOString();
    const { data: invitation } = await admin.from("customer_workspace_invitations").select("id,client_id").eq("token_hash", hashCustomerInvitationToken(invitationToken)).is("accepted_at", null).is("revoked_at", null).gt("expires_at", now).maybeSingle();
    if (!invitation) return go(request, "/login?error=invitation");
    const [{ data: target }, { data: existing }] = await Promise.all([
      admin.from("clients").select("id,user_id,product_mode,onboarding_completed_at").eq("id", invitation.client_id).maybeSingle(),
      admin.from("clients").select("id").eq("user_id", data.user.id).maybeSingle()
    ]);
    if (!target || (target.user_id && target.user_id !== data.user.id) || (existing && existing.id !== target.id)) return go(request, "/login?error=account");

    if (!target.user_id) {
      const update: Record<string, unknown> = { user_id: data.user.id, owner_email: data.user.email };
      if ((target.product_mode === "reactivation" || target.product_mode === "website_chat") && !target.onboarding_completed_at) update.onboarding_completed_at = now;
      const { data: linked, error: linkError } = await admin.from("clients").update(update).eq("id", target.id).is("user_id", null).select("id").maybeSingle();
      if (linkError || !linked) return go(request, "/login?error=account");
    }
    const { error: acceptError } = await admin.from("customer_workspace_invitations").update({ accepted_at: now, accepted_user_id: data.user.id }).eq("id", invitation.id).is("accepted_at", null);
    if (acceptError) return go(request, "/login?error=account");
    await admin.from("customer_workspace_invitations").update({ revoked_at: now }).eq("client_id", target.id).neq("id", invitation.id).is("accepted_at", null).is("revoked_at", null);
    return go(request, target.product_mode === "website_chat" ? "/dashboard/chats?invited=1" : target.product_mode === "reactivation" ? "/dashboard/reactivation?invited=1" : "/onboarding?invited=1");
  }

  const { data: existingClient, error: lookupError } = await admin.from("clients").select("id").eq("user_id", data.user.id).maybeSingle();
  if (lookupError) return go(request, "/signup?error=workspace");
  if (existingClient) return go(request, "/dashboard");

  const ownerName = typeof data.user.user_metadata.owner_name === "string" ? data.user.user_metadata.owner_name.trim() : "";
  if (!ownerName) return go(request, "/signup?error=missing");
  const today = new Date();
  const pilotEnd = new Date(today);
  pilotEnd.setUTCDate(pilotEnd.getUTCDate() + 14);
  const workspaceName = `${ownerName} workspace`;
  const workspaceSlug = await uniqueCustomerSlug(admin, workspaceName);
  const { error: clientError } = await admin.from("clients").insert({
    user_id: data.user.id,
    slug: workspaceSlug,
    business_name: workspaceName,
    trade: "service business",
    owner_name: ownerName,
    owner_phone: "Not set",
    owner_email: data.user.email ?? null,
    pilot_start: today.toISOString().slice(0, 10),
    pilot_end: pilotEnd.toISOString().slice(0, 10),
    account_status: "onboarding",
    product_mode: "website_chat",
    provisioning_status: "needs_configuration"
  });
  if (clientError) return go(request, "/signup?error=workspace");
  return go(request, "/dashboard/settings?welcome=1");
}
