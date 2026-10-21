"use client";

import { Box, Footprints, House, Layers, Layers2, Scissors } from "lucide-react";
import type { ComponentType } from "react";
import { useViewerStore, type ViewMode } from "@/lib/store/viewer-store";
import { Panel } from "@/components/ui/Panel";

const MODES: { id: ViewMode; label: string; icon: ComponentType<{ className?: string }> }[] = [
  { id: "full", label: "Full 3D", icon: Box },
  { id: "exterior", label: "Exterior", icon: House },
  { id: "ground", label: "Ground", icon: Layers },
  { id: "first", label: "First", icon: Layers2 },
  { id: "cutaway", label: "Cutaway", icon: Scissors },
];

export function ViewModeControls() {
  const viewMode = useViewerStore((s) => s.viewMode);
  const walkMode = useViewerStore((s) => s.walkMode);
  const setViewMode = useViewerStore((s) => s.setViewMode);
  const setWalkMode = useViewerStore((s) => s.setWalkMode);
  const itemClass = (active: boolean) =>
    `flex min-h-10 min-w-10 items-center justify-center gap-1.5 rounded-lg px-2.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--accent)] md:min-h-8 ${
      active ? "bg-stone-900 text-white" : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
    }`;
  return (
    <Panel className="p-1">
      <div role="group" aria-label="View mode" className="flex gap-0.5">
        {MODES.map(({ id, label, icon: Icon }) => {
          const active = !walkMode && viewMode === id;
          return (
            <button key={id} type="button" aria-pressed={active} onClick={() => setViewMode(id)} className={itemClass(active)}>
              <Icon className="size-3.5" aria-hidden />
              <span className="hidden sm:inline">{label}</span>
              <span className="sr-only sm:hidden">{label}</span>
            </button>
          );
        })}
        <button type="button" aria-pressed={walkMode} onClick={() => setWalkMode(!walkMode)} className={itemClass(walkMode)}>
          <Footprints className="size-3.5" aria-hidden />
          <span className="hidden sm:inline">Walk</span>
          <span className="sr-only sm:hidden">Walkthrough</span>
        </button>
      </div>
    </Panel>
  );
}
