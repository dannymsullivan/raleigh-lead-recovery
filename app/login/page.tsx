import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { requestLoginCodeAction } from "../auth-actions";
import { AuthField, AuthShell } from "../components/auth-card";

type PageProps = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

export default async function LoginPage({ searchParams }: PageProps) {
  const search = (await searchParams) ?? {};
  const error = typeof search.error === "string" ? search.error : null;

  return (
    <AuthShell eyebrow="Welcome back" title="Open your recovery board." description="Sign in to see the conversations, qualified leads, and next steps Mabel recovered for your team.">
      {error ? <p className="mb-5 border-2 border-black bg-black p-4 text-sm font-bold text-white">{error === "configuration" ? "Customer login needs the Supabase publishable key configured." : error === "phone" ? "We could not text that number. Check it or create an account first." : "That email and password did not match."}</p> : null}
      <form action={requestLoginCodeAction} className="grid gap-5">
        <AuthField label="Mobile number" name="phone" type="tel" placeholder="(919) 555-0123" autoComplete="tel" />
        <button className="mt-2 inline-flex h-14 items-center justify-center gap-2 bg-black px-6 font-extrabold text-white transition-transform hover:-translate-y-0.5" type="submit">
          Text me a code <ArrowRight className="h-4 w-4" />
        </button>
      </form>
      <div className="mt-6 border-2 border-black bg-[#d8ff57] p-4">
        <p className="text-sm font-black">Want to look around first?</p>
        <Link className="mt-2 inline-flex items-center gap-2 text-sm font-black underline decoration-2 underline-offset-4" href="/demo">Explore the sample dashboard <ArrowRight className="h-4 w-4" /></Link>
      </div>
      <p className="mt-7 text-sm font-semibold text-black/55">New here? <Link className="font-extrabold text-black underline decoration-2 underline-offset-4" href="/signup">Start free</Link></p>
    </AuthShell>
  );
}
