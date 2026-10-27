import { ArrowLeft, Check } from "lucide-react";
import Link from "next/link";
import { BrandMark } from "./brand-mark";

export function AuthShell({
  eyebrow,
  title,
  description,
  children
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <main className="auth-ui auth-retro grid min-h-screen bg-[#f5f8fc] lg:grid-cols-[0.9fr_1.1fr]">
      <section className="auth-story flex flex-col justify-between border-b border-white/10 p-6 text-white sm:p-10 lg:border-b-0 lg:border-r">
        <BrandMark inverted />
        <div className="my-20 max-w-lg">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-white/55">Your customer dashboard</p>
          <h2 className="mt-6 text-5xl font-black leading-[0.94] tracking-[-0.055em] sm:text-7xl">Every conversation. One place to follow up.</h2>
          <ul className="mt-10 grid gap-4 text-sm font-bold text-white/75">
            {["Read customer chats and call summaries", "Keep your business information up to date", "See lead sources and record bookings"].map((item) => (
              <li className="flex items-center gap-3" key={item}>
                <span className="grid h-6 w-6 place-items-center rounded-full bg-[#63e6d1] text-[#111b35]"><Check className="h-3.5 w-3.5" /></span>
                {item}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs font-semibold text-white/45">Snappy Leads · Hands-on setup and support</p>
      </section>

      <section className="auth-form flex items-center justify-center px-5 py-16 sm:px-10">
        <div className="w-full max-w-md">
          <Link className="mb-12 inline-flex items-center gap-2 text-sm font-bold text-black/55 hover:text-black" href="/">
            <ArrowLeft className="h-4 w-4" /> Back home
          </Link>
          <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-black/50">{eyebrow}</p>
          <h1 className="mt-4 text-5xl font-semibold leading-[0.96] tracking-[-0.055em] text-[#111b35]">{title}</h1>
          <p className="mt-5 text-base leading-7 text-black/60">{description}</p>
          <div className="mt-9">{children}</div>
        </div>
      </section>
    </main>
  );
}

export function AuthField({ label, name, type = "text", placeholder, autoComplete, inputMode, required = true }: { label: string; name: string; type?: string; placeholder?: string; autoComplete?: string; inputMode?: "numeric" | "text" | "tel"; required?: boolean }) {
  return (
    <label className="block text-sm font-extrabold">
      {label}
      <input
        className="mt-2 h-13 w-full rounded-xl border border-[#cfd9e7] bg-white px-4 font-semibold outline-none transition-[border-color,box-shadow] focus:border-[#2968e8] focus:shadow-[0_0_0_4px_rgba(41,104,232,0.1)]"
        name={name}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        required={required}
      />
    </label>
  );
}
