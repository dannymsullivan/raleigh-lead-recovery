import { NextRequest, NextResponse } from "next/server";
import { runReactivationBatch } from "@/lib/reactivation-retell";
import { getSupabaseAdmin } from "@/lib/supabase-server";

export const runtime = "nodejs";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const admin = getSupabaseAdmin();
  const { data, error } = await admin.from("reactivation_campaigns").select("id,client_id").eq("status", "running").limit(20);
  if (error) throw error;
  const results = [];
  for (const campaign of data ?? []) {
    results.push({ campaignId: campaign.id, ...(await runReactivationBatch(campaign.id, campaign.client_id, 50)) });
  }
  return NextResponse.json({ ok: true, results });
}
