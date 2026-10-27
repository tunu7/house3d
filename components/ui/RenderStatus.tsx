"use client";

import { Sparkles, X } from "lucide-react";
import { usePathTraceStatus } from "@/lib/store/path-trace-status";
import { useViewerStore } from "@/lib/store/viewer-store";
import { Panel } from "./Panel";

/** Samples after which the render reads as finished (refinement continues quietly). */
const CONVERGED = 300;

/** Progress of the photoreal render mode, with a way out. Shown only while it is on. */
export function RenderStatus() {
  const renderMode = useViewerStore((s) => s.renderMode);
  const setRenderMode = useViewerStore((s) => s.setRenderMode);
  const { samples, preparing } = usePathTraceStatus();
  if (!renderMode) return null;
  const message = preparing
    ? "Preparing render…"
    : samples === 0
      ? "Rendering when the camera rests"
      : samples < CONVERGED
        ? `Rendering · ${samples} samples`
        : `Rendered · ${samples} samples`;
  return (
    <Panel className="flex items-center gap-2 py-1 pr-1 pl-3">
      <Sparkles className="size-3.5 text-[var(--accent)]" aria-hidden />
      <span role="status" aria-live="polite" className="text-xs font-medium tabular-nums text-stone-700">
        {message}
      </span>
      <div aria-hidden className="h-1 w-16 overflow-hidden rounded-full bg-stone-200">
        <div className="h-full rounded-full bg-[var(--accent)] transition-[width]" style={{ width: `${Math.min(100, (samples / CONVERGED) * 100)}%` }} />
      </div>
      <button
        type="button"
        onClick={() => setRenderMode(false)}
        aria-label="Leave photoreal render"
        className="flex size-7 items-center justify-center rounded-lg text-stone-500 hover:bg-stone-100 hover:text-stone-900 focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
      >
        <X className="size-3.5" aria-hidden />
      </button>
    </Panel>
  );
}
