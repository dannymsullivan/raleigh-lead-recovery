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
    <main className="grid min-h-screen bg-[#f4f1e8] lg:grid-cols-[0.9fr_1.1fr]">
      <section className="flex flex-col justify-between border-b-2 border-black bg-black p-6 text-white sm:p-10 lg:border-b-0 lg:border-r-2">
        <BrandMark inverted />
        <div className="my-20 max-w-lg">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-white/55">Your lead recovery command center</p>
          <h2 className="mt-6 text-5xl font-black leading-[0.94] tracking-[-0.055em] sm:text-7xl">Old leads in. Real opportunities out.</h2>
          <ul className="mt-10 grid gap-4 text-sm font-bold text-white/75">
            {["See what every conversation uncovered", "Get qualified homeowners to the right rep", "Track every opportunity Mabel recovered"].map((item) => (
              <li className="flex items-center gap-3" key={item}>
                <span className="grid h-6 w-6 place-items-center rounded-full bg-white text-black"><Check className="h-3.5 w-3.5" /></span>
                {item}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs font-semibold text-white/45">Built in Raleigh. Answers anywhere.</p>
      </section>

      <section className="flex items-center justify-center px-5 py-16 sm:px-10">
        <div className="w-full max-w-md">
          <Link className="mb-12 inline-flex items-center gap-2 text-sm font-bold text-black/55 hover:text-black" href="/">
            <ArrowLeft className="h-4 w-4" /> Back home
          </Link>
          <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-black/50">{eyebrow}</p>
          <h1 className="mt-4 text-5xl font-black leading-[0.96] tracking-[-0.055em]">{title}</h1>
          <p className="mt-5 text-base leading-7 text-black/60">{description}</p>
          <div className="mt-9">{children}</div>
        </div>
      </section>
    </main>
  );
}

export function AuthField({ label, name, type = "text", placeholder, autoComplete, required = true }: { label: string; name: string; type?: string; placeholder?: string; autoComplete?: string; required?: boolean }) {
  return (
    <label className="block text-sm font-extrabold">
      {label}
      <input
        className="mt-2 h-13 w-full rounded-none border-2 border-black bg-white px-4 font-semibold outline-none transition-shadow focus:shadow-[5px_5px_0_#000]"
        name={name}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
      />
    </label>
  );
}
