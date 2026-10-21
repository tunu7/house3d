"use client";

import { useViewerStore } from "@/lib/store/viewer-store";
import { Panel } from "./Panel";

const OPTIONS = [
  { id: "all", label: "Both" },
  { id: "ground", label: "Ground" },
  { id: "first", label: "First" },
] as const;

/** Touch-friendly floor switcher (44 px targets). */
export function FloorSwitcher() {
  const floors = useViewerStore((s) => s.floors);
  const showFloors = useViewerStore((s) => s.showFloors);
  const current = floors.ground && floors.first ? "all" : floors.ground ? "ground" : floors.first ? "first" : null;
  return (
    <Panel className="p-1">
      <div role="group" aria-label="Floors" className="flex gap-0.5">
        {OPTIONS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            aria-pressed={current === id}
            onClick={() => showFloors(id)}
            className={`min-h-11 min-w-16 rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--accent)] ${
              current === id ? "bg-stone-900 text-white" : "text-stone-600 active:bg-stone-100"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </Panel>
  );
}
