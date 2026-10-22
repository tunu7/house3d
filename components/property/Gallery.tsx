"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { GALLERY } from "@/lib/property";

/** Editorial image grid with a keyboard- and swipe-friendly lightbox (native <dialog>). */
export function Gallery() {
  const dialog = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState(0);
  const touchX = useRef<number | null>(null);

  const open = (i: number) => {
    setIndex(i);
    dialog.current?.showModal();
  };
  const step = useCallback((d: number) => setIndex((i) => (i + d + GALLERY.length) % GALLERY.length), []);

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    const onKey = (e: KeyboardEvent) => {
      if (!el.open) return;
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step]);

  const item = GALLERY[index];
  return (
    <>
      <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
        {GALLERY.map((g, i) => (
          <li key={g.src} className={i === 0 ? "col-span-2 row-span-2" : i === 3 ? "md:row-span-2" : ""}>
            <button
              type="button"
              onClick={() => open(i)}
              className="group relative block h-full min-h-40 w-full overflow-hidden rounded-xl bg-stone-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
              aria-label={`Open image: ${g.caption}`}
            >
              <Image
                src={g.src}
                alt={g.alt}
                fill
                sizes={i === 0 ? "(min-width: 768px) 50vw, 100vw" : "(min-width: 768px) 25vw, 50vw"}
                className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                priority={i === 0}
              />
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-4 pt-10 pb-3 text-left text-sm text-white">
                {g.caption}
              </span>
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialog}
        aria-label="Image viewer"
        className="m-auto h-dvh max-h-none w-screen max-w-none bg-transparent p-0 backdrop:bg-black/90"
        onClick={(e) => e.target === dialog.current && dialog.current?.close()}
        onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
          touchX.current = null;
        }}
      >
        <figure className="flex h-full flex-col items-center justify-center gap-3 p-4 sm:p-10">
          <div className="relative h-full max-h-[80dvh] w-full">
            <Image src={item.src} alt={item.alt} fill sizes="100vw" className="object-contain" />
          </div>
          <figcaption className="text-sm text-white/80">
            {item.caption} <span className="text-white/40">· {index + 1} / {GALLERY.length}</span>
          </figcaption>
        </figure>
        <button
          type="button"
          onClick={() => dialog.current?.close()}
          aria-label="Close"
          className="absolute top-4 right-4 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-white"
        >
          <X className="size-5" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => step(-1)}
          aria-label="Previous image"
          className="absolute top-1/2 left-3 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-white"
        >
          <ChevronLeft className="size-5" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => step(1)}
          aria-label="Next image"
          className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-white"
        >
          <ChevronRight className="size-5" aria-hidden />
        </button>
      </dialog>
    </>
  );
}
