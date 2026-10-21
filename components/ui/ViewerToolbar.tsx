"use client";

import { RotateCcw } from "lucide-react";
import type { PresetName } from "@/lib/viewer/camera";
import { useViewerStore } from "@/lib/store/viewer-store";
import { Panel } from "./Panel";

const PRESETS: { id: PresetName; label: string }[] = [
  { id: "front", label: "Front" },
  { id: "rear", label: "Rear" },
  { id: "left", label: "Left" },
  { id: "right", label: "Right" },
  { id: "top", label: "Top" },
];

const button =
  "min-h-10 rounded-lg px-2.5 text-xs font-medium text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-900 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--accent)] md:min-h-8";

/** Camera preset buttons (no panel chrome), reused in the mobile menu. */
export function CameraPresets() {
  const goToPreset = useViewerStore((s) => s.goToPreset);
  return (
    <div role="group" aria-label="Camera presets" className="flex flex-wrap items-center gap-0.5">
      {PRESETS.map(({ id, label }) => (
        <button key={id} type="button" className={button} onClick={() => goToPreset(id)}>
          {label}
        </button>
      ))}
    </div>
  );
}

export function ResetButton({ compact = false }: { compact?: boolean }) {
  const resetCamera = useViewerStore((s) => s.resetCamera);
  return (
    <button type="button" className={`${button} flex items-center gap-1.5`} onClick={resetCamera} aria-label="Reset view">
      <RotateCcw className="size-3.5" aria-hidden />
      {!compact && "Reset"}
    </button>
  );
}

/** Desktop bottom bar: camera presets and reset. */
export function ViewerToolbar() {
  return (
    <Panel className="flex items-center p-1">
      <CameraPresets />
      <span aria-hidden className="mx-1 h-5 w-px bg-stone-200" />
      <ResetButton />
    </Panel>
  );
}
