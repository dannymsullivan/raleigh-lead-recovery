"use client";

import { useEffect } from "react";

/** Progressive enhancement: content stays visible without JS and with reduced motion. */
export function SalesMotion() {
  useEffect(() => {
    const root = document.getElementById("sales-page");
    if (!root || !window.IntersectionObserver) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (preference.matches) return;
    const elements = [...root.querySelectorAll<HTMLElement>(".sales-section-title, .sales-product-grid > article, .sales-owner-work, .sales-industry-grid > article, .rlr-summary-card, .rlr-flow-steps li, .sales-guarantee, .sales-plan, .sales-trial, .rlr-founder")];
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-revealed");
          observer.unobserve(entry.target);
        }
      }
    }, { threshold: 0.08, rootMargin: "0px 0px -20px 0px" });
    for (const [index, element] of elements.entries()) {
      element.dataset.salesReveal = "";
      element.style.setProperty("--reveal-delay", `${(index % 3) * 65}ms`);
      if (element.getBoundingClientRect().top < window.innerHeight * .95) element.classList.add("is-revealed");
      else observer.observe(element);
    }
    root.classList.add("sales-motion-ready");
    const reduce = () => { if (preference.matches) { observer.disconnect(); root.classList.remove("sales-motion-ready"); } };
    preference.addEventListener("change", reduce);
    return () => { observer.disconnect(); preference.removeEventListener("change", reduce); root.classList.remove("sales-motion-ready"); };
  }, []);
  return null;
}
