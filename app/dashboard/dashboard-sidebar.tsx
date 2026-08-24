import Link from "next/link";
import type { ReactNode } from "react";
import { Bot, PhoneCall, Settings2, Sparkles } from "lucide-react";

export function DashboardSidebar({ active }: { active: "board" | "reactivation" | "agents" | "settings" }) {
  const item = (key: typeof active, href: string, label: string, icon: ReactNode) => (
    <Link className={`flex items-center gap-3 px-3 py-3 text-sm font-extrabold ${active === key ? "bg-[#d8ff57] text-black" : "hover:bg-black/5"}`} href={href}>{icon}{label}</Link>
  );
  return <aside className="hidden min-h-[calc(100vh-82px)] border-r-2 border-black p-5 lg:block">
    <nav className="grid gap-1" aria-label="Dashboard navigation">
      {item("reactivation", "/dashboard/reactivation", "Lead reactivation", <Sparkles className="h-4 w-4" />)}
      {item("agents", "/dashboard/agents", "Agents", <Bot className="h-4 w-4" />)}
      {item("board", "/dashboard", "Lead board", <PhoneCall className="h-4 w-4" />)}
      {item("settings", "/dashboard/settings", "Call-flow settings", <Settings2 className="h-4 w-4" />)}
    </nav>
  </aside>;
}
