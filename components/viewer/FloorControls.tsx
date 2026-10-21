"use client";

import type { ReactNode } from "react";
import { Panel, PanelHeading } from "@/components/ui/Panel";
import { useViewerStore } from "@/lib/store/viewer-store";

function Toggle({ label, checked, onChange, hint }: { label: string; checked: boolean; onChange: () => void; hint?: ReactNode }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-1.5 text-sm text-stone-700 hover:bg-stone-100/80">
      <span className="flex flex-col">
        {label}
        {hint && <span className="text-[11px] text-stone-400">{hint}</span>}
      </span>
      <input type="checkbox" role="switch" checked={checked} onChange={onChange} className="peer sr-only" />
      <span
        aria-hidden
        className="relative h-5 w-9 shrink-0 rounded-full bg-stone-300 transition-colors peer-checked:bg-[var(--accent)] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--accent)] after:absolute after:top-0.5 after:left-0.5 after:size-4 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-4"
      />
    </label>
  );
}

/** Floor visibility, layer toggles, and exploded / cutaway switches. */
export function FloorControls({ solid = false }: { solid?: boolean }) {
  const floors = useViewerStore((s) => s.floors);
  const layers = useViewerStore((s) => s.layers);
  const exploded = useViewerStore((s) => s.exploded);
  const cutaway = useViewerStore((s) => s.cutaway);
  const toggleFloor = useViewerStore((s) => s.toggleFloor);
  const toggleLayer = useViewerStore((s) => s.toggleLayer);
  const setExploded = useViewerStore((s) => s.setExploded);
  const setCutaway = useViewerStore((s) => s.setCutaway);

  return (
    <Panel className="w-56 pb-2" solid={solid}>
      <PanelHeading>Floors</PanelHeading>
      <Toggle label="Ground floor" checked={floors.ground} onChange={() => toggleFloor("ground")} />
      <Toggle label="First floor" checked={floors.first} onChange={() => toggleFloor("first")} />
      <PanelHeading>Layers</PanelHeading>
      <Toggle label="Roof" checked={layers.roof} onChange={() => toggleLayer("roof")} />
      <Toggle label="Walls" checked={layers.walls} onChange={() => toggleLayer("walls")} />
      <Toggle label="Furniture" checked={layers.furniture} onChange={() => toggleLayer("furniture")} />
      <PanelHeading>View</PanelHeading>
      <Toggle label="Exploded floors" checked={exploded} onChange={() => setExploded(!exploded)} />
      <Toggle label="Cutaway" hint="Hides walls facing you" checked={cutaway} onChange={() => setCutaway(!cutaway)} />
    </Panel>
  );
}
