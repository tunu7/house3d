"use client";

import { ChevronUp, List, X } from "lucide-react";
import { useState } from "react";
import { useViewerStore } from "@/lib/store/viewer-store";
import { Panel } from "./Panel";
import { RoomDetails, RoomList, useSelectedRoomSummary } from "./RoomInfoPanel";

/**
 * Collapsible bottom sheet for small screens. Collapsed it shows the selected
 * room's name and area (or a "Rooms" button); expanded it shows full details
 * or the room list, capped at half the viewport height.
 */
export function MobileRoomSheet() {
  const summary = useSelectedRoomSummary();
  const walkMode = useViewerStore((s) => s.walkMode);
  const selectRoom = useViewerStore((s) => s.selectRoom);
  const [expanded, setExpanded] = useState(false);
  const [listOpen, setListOpen] = useState(false);

  if (!summary) {
    if (walkMode) return null;
    return listOpen ? (
      <Panel className="max-h-[50dvh] w-full overflow-y-auto">
        <div className="flex items-center justify-between px-3 pt-2">
          <span className="text-sm font-semibold text-stone-800">Rooms</span>
          <button type="button" onClick={() => setListOpen(false)} className="min-h-11 px-2 text-sm text-stone-500">
            Close
          </button>
        </div>
        <RoomList onPick={() => setListOpen(false)} />
      </Panel>
    ) : (
      <Panel>
        <button
          type="button"
          onClick={() => setListOpen(true)}
          className="flex min-h-11 items-center gap-2 px-4 text-sm font-medium text-stone-700"
        >
          <List className="size-4" aria-hidden />
          Rooms
        </button>
      </Panel>
    );
  }

  return (
    <Panel className="w-full">
      <div className="flex items-center">
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((e) => !e)}
          className="flex min-h-12 min-w-0 flex-1 items-center justify-between gap-3 pl-4 text-left"
        >
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-stone-900">{summary.room.name}</span>
            <span className="block text-xs text-stone-500">
              {summary.floorName} · {summary.sizeLabel} · {summary.nominalArea.toFixed(2)} m²
            </span>
          </span>
          <ChevronUp className={`size-5 shrink-0 text-stone-400 transition-transform ${expanded ? "" : "rotate-180"}`} aria-hidden />
          <span className="sr-only">{expanded ? "Hide details" : "Show details"}</span>
        </button>
        <button
          type="button"
          onClick={() => selectRoom(null)}
          aria-label="Clear room selection"
          className="flex size-12 shrink-0 items-center justify-center text-stone-400"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
      {expanded && (
        <div className="max-h-[45dvh] overflow-y-auto border-t border-stone-100">
          <RoomDetails summary={summary} showHeader={false} />
        </div>
      )}
    </Panel>
  );
}
