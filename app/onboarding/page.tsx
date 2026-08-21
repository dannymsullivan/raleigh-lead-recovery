import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BrandMark } from "../components/brand-mark";
import { getSupabaseAuth, isSupabaseAuthConfigured } from "@/lib/supabase-auth";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import type { Client } from "@/lib/types";
import { OnboardingForm } from "./onboarding-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Set up Chloe | Raleigh Lead Recovery", robots: { index: false, follow: false } };

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
  if (client.onboarding_completed_at) redirect("/dashboard");

  const search = (await searchParams) ?? {};
  const error = typeof search.error === "string" ? search.error : null;

  return (
    <main className="min-h-screen bg-[#f4f1e8] text-black">
      <header className="border-b-2 border-black">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
          <BrandMark />
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-black/45">14-day trial starts after setup</p>
        </div>
      </header>
      <OnboardingForm client={client} email={user.email ?? client.owner_email ?? ""} error={error} />
    </main>
  );
}
