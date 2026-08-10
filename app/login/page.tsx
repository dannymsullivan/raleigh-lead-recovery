import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { loginCustomerAction } from "../auth-actions";
import { AuthField, AuthShell } from "../components/auth-card";

type PageProps = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

export default async function LoginPage({ searchParams }: PageProps) {
  const search = (await searchParams) ?? {};
  const error = typeof search.error === "string" ? search.error : null;
  const checkEmail = search.check_email === "1";

  return (
    <AuthShell eyebrow="Welcome back" title="Open your call board." description="Sign in to see the leads Mabel caught while you were busy doing the actual work.">
      {checkEmail ? <p className="mb-5 border-2 border-black bg-white p-4 text-sm font-bold">Check your inbox to confirm your email, then come back and sign in.</p> : null}
      {error ? <p className="mb-5 border-2 border-black bg-black p-4 text-sm font-bold text-white">{error === "configuration" ? "Customer login needs the Supabase publishable key configured." : "That email and password did not match."}</p> : null}
      <form action={loginCustomerAction} className="grid gap-5">
        <AuthField label="Email" name="email" type="email" autoComplete="email" />
        <AuthField label="Password" name="password" type="password" autoComplete="current-password" />
        <button className="mt-2 inline-flex h-14 items-center justify-center gap-2 bg-black px-6 font-extrabold text-white transition-transform hover:-translate-y-0.5" type="submit">
          Sign in <ArrowRight className="h-4 w-4" />
        </button>
      </form>
      <p className="mt-7 text-sm font-semibold text-black/55">New here? <Link className="font-extrabold text-black underline decoration-2 underline-offset-4" href="/signup">Start free</Link></p>
    </AuthShell>
  );
}
