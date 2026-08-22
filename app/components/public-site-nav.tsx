"use client";

import Link from "next/link";
import { ArrowRight, Menu, X } from "lucide-react";
import { useState } from "react";
import { BrandMark } from "./brand-mark";

type NavItem = {
  href: string;
  label: string;
};

type PublicSiteNavProps = {
  items: NavItem[];
  cta: NavItem;
  variant?: "standard" | "hvac";
};

export function PublicSiteNav({ items, cta, variant = "standard" }: PublicSiteNavProps) {
  const [open, setOpen] = useState(false);
  const isHvac = variant === "hvac";

  return (
    <header className={isHvac ? "hvac-header" : "site-header public-site-header"}>
      <nav className={`page-shell ${isHvac ? "hvac-nav" : "nav-row"}`} aria-label="Primary navigation">
        <BrandMark accent="#d8ff57" />

        <div className={isHvac ? "hvac-nav-links public-nav-desktop" : "nav-links public-nav-desktop"}>
          {items.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}
          <Link className={isHvac ? "hvac-button hvac-button-accent" : "button button-accent button-small"} href={cta.href}>
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
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>{item.label}</Link>
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
