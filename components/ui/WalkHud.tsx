"use client";

import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, LogOut } from "lucide-react";
import type { ComponentType } from "react";
import { HOUSE } from "@/lib/architecture/house";
import { useViewerStore } from "@/lib/store/viewer-store";
import { walkInput } from "@/lib/viewer/walk-input";
import { Panel } from "./Panel";

type Axis = "forward" | "strafe";

/** Hold-to-move button that feeds the walk controller directly (no React state). */
function PadButton({ axis, value, label, icon: Icon }: { axis: Axis; value: number; label: string; icon: ComponentType<{ className?: string }> }) {
  const release = () => {
    if (walkInput[axis] === value) walkInput[axis] = 0;
  };
  return (
    <button
      type="button"
      aria-label={label}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        walkInput[axis] = value;
      }}
      onPointerUp={release}
      onPointerCancel={release}
      onLostPointerCapture={release}
      onContextMenu={(e) => e.preventDefault()}
      className="flex size-12 touch-none items-center justify-center rounded-xl bg-white/90 text-stone-700 shadow-sm select-none active:bg-stone-200"
    >
      <Icon className="size-5" aria-hidden />
    </button>
  );
}

/** Walkthrough overlay: instructions, current room, move pad and exit. */
export function WalkHud() {
  const roomId = useViewerStore((s) => s.walkRoomId);
  const setWalkMode = useViewerStore((s) => s.setWalkMode);
  const room = HOUSE.rooms.find((r) => r.id === roomId);

  return (
    <>
      <div className="flex justify-center">
        <Panel className="flex items-center gap-3 py-1.5 pr-1.5 pl-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-stone-900">{room ? room.name : "Outside"}</p>
            <p className="text-[11px] text-stone-500">
              {room ? HOUSE.levels[room.floor].name : "Site"}
              <span className="hidden sm:inline"> · Drag to look · WASD or arrows to move · Shift to run</span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => setWalkMode(false)}
            className="flex min-h-10 items-center gap-1.5 rounded-lg bg-stone-900 px-3 text-xs font-medium text-white hover:bg-stone-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          >
            <LogOut className="size-3.5" aria-hidden />
            Exit walk
          </button>
        </Panel>
      </div>
      <div className="pointer-events-auto absolute bottom-4 left-4 grid grid-cols-3 gap-1.5" aria-label="Move" role="group">
        <span />
        <PadButton axis="forward" value={1} label="Move forward" icon={ArrowUp} />
        <span />
        <PadButton axis="strafe" value={-1} label="Step left" icon={ArrowLeft} />
        <PadButton axis="forward" value={-1} label="Move back" icon={ArrowDown} />
        <PadButton axis="strafe" value={1} label="Step right" icon={ArrowRight} />
      </div>
    </>
  );
}
