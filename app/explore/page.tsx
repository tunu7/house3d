import type { Metadata } from "next";
import Link from "next/link";
import { ViewerClient } from "@/components/viewer/ViewerClient";
import { PROPERTY } from "@/lib/property";

export const metadata: Metadata = {
  title: "Explore in 3D",
  description: "Walk through every room, switch floors and lighting, and inspect room sizes in the interactive 3D model.",
};

export default function ExplorePage() {
  return (
    <main className="flex h-dvh flex-col bg-stone-100 text-stone-900">
      <header className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-stone-200 bg-white/80 px-4">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/"
            className="shrink-0 rounded-md px-1.5 py-1 text-sm text-stone-500 hover:text-stone-900 focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
          >
            ← Property
          </Link>
          <h1 className="truncate font-display text-base tracking-tight">{PROPERTY.name}</h1>
        </div>
        <p className="hidden text-xs text-stone-500 sm:block">
          Visualisation from a reference plan · not a verified CAD or structural drawing
        </p>
      </header>
      <section className="relative min-h-0 flex-1">
        <ViewerClient />
      </section>
    </main>
  );
}
