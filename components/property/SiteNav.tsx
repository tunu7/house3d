"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const LINKS = [
  { href: "#overview", label: "Overview" },
  { href: "#gallery", label: "Gallery" },
  { href: "#plans", label: "Floor plans" },
  { href: "#specification", label: "Specification" },
];

/** Fixed top bar: transparent over the hero, solid once the page scrolls. */
export function SiteNav({ name }: { name: string }) {
  const [solid, setSolid] = useState(false);
  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > window.innerHeight * 0.6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-colors duration-300 ${
        solid ? "border-b border-stone-200 bg-[#f7f4ef]/90 text-stone-900 backdrop-blur-md" : "text-white"
      }`}
    >
      <nav aria-label="Main" className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-5 sm:px-8">
        <a href="#top" className="font-display text-lg tracking-tight">
          {name}
        </a>
        <ul className="hidden items-center gap-7 text-sm md:flex">
          {LINKS.map((l) => (
            <li key={l.href}>
              <a href={l.href} className={`transition-opacity hover:opacity-100 ${solid ? "opacity-70" : "opacity-80"}`}>
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <Link
          href="/explore"
          className={`inline-flex min-h-10 items-center rounded-full px-4 text-sm font-medium transition ${
            solid ? "bg-stone-900 text-white hover:bg-stone-700" : "bg-white/15 text-white backdrop-blur-sm hover:bg-white/25"
          }`}
        >
          3D tour
        </Link>
      </nav>
    </header>
  );
}
