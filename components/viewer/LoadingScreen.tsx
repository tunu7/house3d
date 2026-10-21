"use client";

import { useFrame } from "@react-three/fiber";
import { House } from "lucide-react";
import { useRef } from "react";
import { useViewerStore } from "@/lib/store/viewer-store";

/** Marks the viewer ready once a couple of frames have rendered (shaders compiled, shadows built). */
export function ReadySignal() {
  const frames = useRef(0);
  useFrame(({ invalidate }) => {
    if (frames.current > 2) return;
    frames.current += 1;
    if (frames.current === 2) useViewerStore.getState().setReady();
    else invalidate();
  });
  return null;
}

/** Full-viewer overlay shown until the first frames render, then faded out. */
export function LoadingScreen({ visible = true }: { visible?: boolean }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-hidden={!visible}
      className={`absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-stone-100 transition-opacity duration-500 ${
        visible ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      <House className="size-8 text-stone-400" aria-hidden />
      <p className="text-sm font-medium text-stone-600">Preparing the 3D model…</p>
      <div className="h-1 w-40 overflow-hidden rounded-full bg-stone-200">
        <div className="h-full w-1/3 animate-[loading_1.2s_ease-in-out_infinite] rounded-full bg-[var(--accent)]" />
      </div>
    </div>
  );
}

/** Loading overlay bound to the store's ready flag. */
export function ViewerLoadingOverlay() {
  const ready = useViewerStore((s) => s.ready);
  return <LoadingScreen visible={!ready} />;
}
