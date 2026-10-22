"use client";

import { ArrowRight, Footprints, Moon, Sun } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useViewerStore } from "@/lib/store/viewer-store";
import { hasWebGL } from "@/lib/viewer/webgl";

const ShowcaseScene = dynamic(() => import("./ShowcaseScene"), { ssr: false });

let webgl: boolean | undefined;
const useWebGL = () =>
  useSyncExternalStore(
    () => () => {},
    () => (webgl ??= hasWebGL()),
    () => null,
  );

/**
 * Full-bleed live 3D hero. Starts at dusk (the mood of the owner's reference
 * photo), pauses rendering when scrolled out of view, and falls back to a
 * still render where WebGL is unavailable.
 */
export function ShowcaseHero({ children }: { children: React.ReactNode }) {
  const root = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(true);
  const supported = useWebGL();
  const time = useViewerStore((s) => s.timeOfDay);
  const ready = useViewerStore((s) => s.ready);
  const setTime = useViewerStore((s) => s.setTimeOfDay);

  useEffect(() => {
    useViewerStore.getState().setTimeOfDay("dusk");
  }, []);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.05 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section ref={root} className="relative h-[100svh] min-h-[560px] overflow-hidden bg-[#1b1d24] text-white">
      {/* Still render underneath: shown until the live scene is ready, and as the fallback. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/gallery/exterior-dusk.jpg"
        alt=""
        aria-hidden
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${supported && ready ? "opacity-0" : "opacity-100"}`}
      />
      {supported && (
        <div className="absolute inset-0" aria-label="Live 3D view of the house, slowly rotating" role="img">
          <ShowcaseScene active={inView} />
        </div>
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-black/30" />

      <div className="pointer-events-none relative mx-auto flex h-full max-w-6xl flex-col justify-end px-5 pb-10 sm:px-8 sm:pb-14">
        {children}
        <div className="pointer-events-auto mt-8 flex flex-wrap items-center gap-3">
          <Link
            href="/explore"
            className="group inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-6 text-sm font-medium text-stone-900 transition hover:bg-stone-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Explore in 3D
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </Link>
          <Link
            href="/explore?walk=1"
            className="inline-flex min-h-12 items-center gap-2 rounded-full border border-white/40 px-6 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <Footprints className="size-4" aria-hidden />
            Walk through
          </Link>
          {supported && (
            <div role="group" aria-label="Lighting" className="ml-auto flex rounded-full border border-white/30 p-1 backdrop-blur-sm">
              {(
                [
                  ["day", "Day", Sun],
                  ["dusk", "Dusk", Moon],
                ] as const
              ).map(([id, label, Icon]) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={time === id}
                  onClick={() => setTime(id)}
                  className={`inline-flex min-h-10 items-center gap-1.5 rounded-full px-4 text-xs font-medium transition focus-visible:outline-2 focus-visible:outline-white ${
                    time === id ? "bg-white text-stone-900" : "text-white/80 hover:text-white"
                  }`}
                >
                  <Icon className="size-3.5" aria-hidden />
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
