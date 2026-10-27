"use client";

import Link from "next/link";
import { ArrowRight, Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BrandMark } from "./brand-mark";

type NavItem = {
  href: string;
  label: string;
};

type PublicSiteNavProps = {
  cta: NavItem;
};

const items = [
  { href: "/", label: "Chatbots" },
  { href: "/voice", label: "Voice agents" },
  { href: "/login", label: "Sign in" },
] as const;

export function PublicSiteNav({ cta }: PublicSiteNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  function isActive(href: string): boolean {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <header className="site-header public-site-header">
      <nav className="page-shell nav-row" aria-label="Primary navigation">
        <BrandMark />

        <div className="nav-links public-nav-desktop">
          {items.map((item) => (
            <Link
              aria-current={isActive(item.href) ? "page" : undefined}
              className="public-nav-link"
              key={item.href}
              href={item.href}
            >
              {item.label}
            </Link>
          ))}
          <Link className="button button-accent button-small public-nav-primary" href={cta.href}>
            {cta.label} <ArrowRight aria-hidden="true" />
          </Link>
        </div>

        <div className={`public-mobile-nav ${open ? "is-open" : ""}`}>
          <button
            className="public-mobile-nav-toggle"
            type="button"
            aria-expanded={open}
            aria-controls="public-mobile-nav-panel"
            onClick={() => setOpen((current) => !current)}
          >
            <span>{open ? "Close" : "Menu"}</span>
            {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
          <div className="public-mobile-nav-panel" id="public-mobile-nav-panel" hidden={!open}>
            {items.map((item) => (
              <Link
                aria-current={isActive(item.href) ? "page" : undefined}
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Link className="public-mobile-nav-cta" href={cta.href} onClick={() => setOpen(false)}>
              {cta.label} <ArrowRight aria-hidden="true" />
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
}
