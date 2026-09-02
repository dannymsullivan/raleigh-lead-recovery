import { LogOut, Send, Settings2, UsersRound } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { logoutAction } from "@/app/actions";

type AdminSection = "customers" | "outreach" | "settings";

export function AdminHeader({ active }: { active: AdminSection }) {
  return (
    <header className="border-b border-[var(--product-line)] bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1320px] items-center justify-between gap-5 px-5 py-4 sm:px-8">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            Founder operations
          </p>
          <h1 className="mt-1 truncate text-lg font-bold tracking-[-0.025em] text-slate-900 sm:text-xl">
            Raleigh Lead Recovery control room
          </h1>
        </div>
        <form action={logoutAction}>
          <button
            className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg border border-[var(--product-line)] bg-white px-3 text-sm font-semibold text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
            type="submit"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </form>
      </div>
      <nav
        aria-label="Admin sections"
        className="mx-auto flex max-w-[1320px] gap-1 overflow-x-auto px-5 sm:px-8"
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
      className={`mb-2 inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg px-4 text-sm font-semibold transition-[background-color,color] duration-150 active:scale-[0.98] ${
        active
          ? "bg-slate-900 text-white shadow-sm"
          : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
      }`}
    >
      {icon}
      {children}
    </Link>
  );
}
