import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BrandMark } from "../components/brand-mark";
import { getSupabaseAuth, isSupabaseAuthConfigured } from "@/lib/supabase-auth";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import type { Client } from "@/lib/types";
import { OnboardingForm } from "./onboarding-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Set up Snappy Leads", robots: { index: false, follow: false } };

type PageProps = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

export default async function OnboardingPage({ searchParams }: PageProps) {
  if (!isSupabaseAuthConfigured()) redirect("/login?error=configuration");

  const auth = await getSupabaseAuth();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) redirect("/login");

  const admin = getSupabaseAdmin();
  const { data } = await admin.from("clients").select("*").eq("user_id", user.id).maybeSingle();
  if (!data) redirect("/signup?error=workspace");

  const client = data as Client;
  if (client.product_mode === "website_chat") redirect("/dashboard/settings?welcome=1");
  if (client.onboarding_completed_at) redirect("/dashboard");

  const search = (await searchParams) ?? {};
  const error = typeof search.error === "string" ? search.error : null;

  return (
    <main className="brand-surface product-ui min-h-screen bg-[var(--product-canvas)] text-[var(--product-ink)]">
      <header className="border-b border-[var(--product-line)] bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
          <BrandMark />
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-black/45">Your business setup · Pricing agreed before service begins</p>
        </div>
      </header>
      <OnboardingForm client={client} email={user.email ?? client.owner_email ?? ""} error={error} />
    </main>
  );
}
