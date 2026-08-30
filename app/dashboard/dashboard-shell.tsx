import Link from "next/link";
import type { ReactNode } from "react";
import { Bot, ChevronRight, LogOut, PhoneCall, Settings2, Sparkles } from "lucide-react";
import { logoutCustomerAction } from "../auth-actions";
import { BrandMark } from "../components/brand-mark";
import { contactHref } from "@/lib/contact";
import type { Client } from "@/lib/types";

const navItems = [
  { key: "inbox", href: "/dashboard", label: "Lead inbox", icon: PhoneCall },
  { key: "reactivation", href: "/dashboard/reactivation", label: "Reactivation", icon: Sparkles },
  { key: "agents", href: "/dashboard/agents", label: "Agents", icon: Bot },
  { key: "settings", href: "/dashboard/settings", label: "Settings", icon: Settings2 }
] as const;

export type DashboardSection = (typeof navItems)[number]["key"];

export function trialDaysLeft(value: string): number {
  const date = value.includes("T") ? new Date(value) : new Date(`${value}T23:59:59`);
  return Math.max(0, Math.ceil((date.getTime() - Date.now()) / 86_400_000));
}

export function DashboardShell({ active, client, children }: { active: DashboardSection; client: Client; children: ReactNode }) {
  const daysLeft = trialDaysLeft(client.trial_ends_at ?? client.pilot_end);
  return (
    <main className="product-ui min-h-screen bg-[#f4f1e8] text-black">
      <header className="border-b-2 border-black bg-[#f4f1e8]">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-5 sm:px-8">
          <BrandMark />
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-black">{client.business_name}</p>
              <p className="font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-black/40">{client.account_status ?? "trialing"} · {daysLeft} days left</p>
            </div>
            <form action={logoutCustomerAction}>
              <button className="inline-flex h-10 items-center gap-2 border-2 border-black px-3 text-sm font-extrabold hover:bg-black hover:text-white" type="submit">
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      <nav className="flex overflow-x-auto border-b-2 border-black bg-white px-3 lg:hidden" aria-label="Dashboard navigation">
        {navItems.map(({ key, href, label, icon: Icon }) => (
          <Link
            className={`flex h-12 flex-none items-center gap-2 px-3 text-xs font-black ${active === key ? "border-b-4 border-black" : "text-black/55"}`}
            aria-current={active === key ? "page" : undefined}
            href={href}
            key={key}
          >
            <Icon className="h-4 w-4" /> {label}
          </Link>
        ))}
      </nav>

      <div className="mx-auto grid max-w-[1440px] lg:grid-cols-[230px_1fr]">
        <aside className="hidden min-h-[calc(100vh-82px)] border-r-2 border-black p-5 lg:flex lg:flex-col">
          <nav className="grid gap-1 text-sm font-extrabold" aria-label="Dashboard navigation">
            {navItems.map(({ key, href, label, icon: Icon }) => (
              <Link
                className={`flex items-center gap-3 px-3 py-3 ${active === key ? "bg-black text-white" : "hover:bg-black/5"}`}
                aria-current={active === key ? "page" : undefined}
                href={href}
                key={key}
              >
                <Icon className="h-4 w-4" /> {label}
              </Link>
            ))}
          </nav>
          <div className="mt-auto border-2 border-black bg-white p-4">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-black/45">Need a hand?</p>
            <p className="mt-3 text-sm font-extrabold">Setup is human. Support is too.</p>
            <a className="mt-4 inline-flex items-center gap-2 text-xs font-extrabold underline decoration-2 underline-offset-4" href={contactHref}>
              Email support <ChevronRight className="h-3 w-3" />
            </a>
          </div>
        </aside>

        <section className="min-w-0 px-5 py-8 sm:px-8 sm:py-10">{children}</section>
      </div>
    </main>
  );
}
