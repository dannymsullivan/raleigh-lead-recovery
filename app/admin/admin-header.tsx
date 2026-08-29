import { LogOut, Send, Settings2, UsersRound } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { logoutAction } from "@/app/actions";

type AdminSection = "customers" | "outreach" | "settings";

export function AdminHeader({ active }: { active: AdminSection }) {
  return (
    <header className="border-b border-[var(--product-line-strong)] bg-[var(--product-canvas)]">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-5 px-5 py-4 sm:px-8 sm:py-5">
        <div className="min-w-0">
          <p className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-black/45">
            Founder operations
          </p>
          <h1 className="mt-1 truncate text-xl font-black tracking-[-0.04em] sm:text-2xl">
            Raleigh Lead Recovery control room
          </h1>
        </div>
        <form action={logoutAction}>
          <button
            className="inline-flex min-h-11 shrink-0 items-center gap-2 border border-[var(--product-line-strong)] bg-white px-3 text-sm font-extrabold hover:border-black hover:bg-black hover:text-white"
            type="submit"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </form>
      </div>
      <nav
        aria-label="Admin sections"
        className="mx-auto flex max-w-[1440px] gap-1 overflow-x-auto px-5 sm:px-8"
      >
        <AdminTab
          href="/admin"
          active={active === "customers"}
          icon={<UsersRound className="h-4 w-4" aria-hidden="true" />}
        >
          Customers
        </AdminTab>
        <AdminTab
          href="/admin/outreach"
          active={active === "outreach"}
          icon={<Send className="h-4 w-4" aria-hidden="true" />}
        >
          Outreach
        </AdminTab>
        <AdminTab
          href="/admin?view=settings"
          active={active === "settings"}
          icon={<Settings2 className="h-4 w-4" aria-hidden="true" />}
        >
          System &amp; costs
        </AdminTab>
      </nav>
    </header>
  );
}

function AdminTab({
  href,
  active,
  icon,
  children,
}: {
  href: string;
  active: boolean;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`inline-flex min-h-11 shrink-0 items-center gap-2 border-x border-t px-4 text-sm font-black transition-[background-color,color] duration-150 active:scale-[0.98] ${
        active
          ? "border-[var(--product-line-strong)] bg-[var(--product-accent)] text-black"
          : "border-transparent text-black/50 hover:border-[var(--product-line)] hover:bg-black/5 hover:text-black"
      }`}
    >
      {icon}
      {children}
    </Link>
  );
}
