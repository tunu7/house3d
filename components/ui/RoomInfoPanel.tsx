"use client";

import { Crosshair, X } from "lucide-react";
import { useMemo } from "react";
import { HOUSE } from "@/lib/architecture/house";
import { type RoomSummary, summarizeRoom } from "@/lib/architecture/room-info";
import { useViewerStore } from "@/lib/store/viewer-store";
import type { FloorId } from "@/types/architecture";
import { Panel, PanelHeading } from "./Panel";

const m2 = (n: number) => `${n.toFixed(2)} m²`;

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <dt className="text-xs text-stone-500">{label}</dt>
      <dd className="text-right text-sm font-medium text-stone-800 tabular-nums">{children}</dd>
    </div>
  );
}

/** Keyboard-accessible room list: an alternative to clicking in the 3D view. */
export function RoomList({ onPick }: { onPick?: () => void } = {}) {
  const selectRoom = useViewerStore((s) => s.selectRoom);
  const byFloor = (floor: FloorId) => HOUSE.rooms.filter((r) => r.floor === floor);
  return (
    <div className="pb-2">
      <p className="px-3 pb-2 text-xs text-stone-500">Click a room in the model, or choose one below.</p>
      {(["ground", "first"] as const).map((floor) => (
        <div key={floor}>
          <PanelHeading>{HOUSE.levels[floor].name}</PanelHeading>
          <ul>
            {byFloor(floor).map((room) => (
              <li key={room.id}>
                <button
                  type="button"
                  onClick={() => {
                    selectRoom(room.id);
                    onPick?.();
                  }}
                  className="flex min-h-9 w-full items-center justify-between rounded-lg px-3 py-1 text-left text-sm text-stone-700 hover:bg-stone-100 focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
                >
                  {room.name}
                  <span className="text-xs text-stone-400 tabular-nums">{summarizeRoom(room).nominalArea.toFixed(1)} m²</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

/** Details for one room: sizes, areas, height, drawing label and reconciliation notes. */
export function RoomDetails({ summary, showHeader = true }: { summary: RoomSummary; showHeader?: boolean }) {
  const selectRoom = useViewerStore((s) => s.selectRoom);
  const walkMode = useViewerStore((s) => s.walkMode);
  const { room } = summary;
  return (
    <section aria-live="polite" aria-label={`${room.name} details`} className="p-3">
      {showHeader && (
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--accent)]">{summary.floorName}</p>
            <h2 className="text-lg font-semibold tracking-tight text-stone-900">{room.name}</h2>
          </div>
          <button
            type="button"
            onClick={() => selectRoom(null)}
            aria-label="Close room details"
            className="-m-1 rounded-md p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-700 focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
      )}
      <dl className={`divide-y divide-stone-100 ${showHeader ? "mt-2" : ""}`}>
        <Row label="Size (grid)">{summary.sizeLabel}</Row>
        {summary.shape !== "rectangular" && <Row label="Shape">{summary.shape}</Row>}
        <Row label="Area (grid)">{m2(summary.nominalArea)}</Row>
        {room.kind !== "void" && <Row label="Clear area ≈">{m2(summary.clearArea)}</Row>}
        <Row label="Ceiling height">{summary.height.toFixed(1)} m</Row>
        {room.drawingLabel && <Row label="On drawing">{room.drawingLabel}</Row>}
      </dl>
      {room.notes && room.notes.length > 0 && (
        <ul className="mt-2 space-y-1 rounded-lg bg-stone-50 p-2 text-xs leading-relaxed text-stone-600">
          {room.notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      )}
      {!walkMode && (
        <button
          type="button"
          onClick={() => selectRoom(room.id)}
          className="mt-3 flex min-h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-stone-200 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50 focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
        >
          <Crosshair className="size-3.5" aria-hidden />
          Focus camera
        </button>
      )}
      <p className="mt-2 text-[11px] leading-snug text-stone-400">
        Grid sizes are to wall centrelines. Clear area is estimated after wall thicknesses.
      </p>
    </section>
  );
}

/** Selected room summary, recomputed only when the selection changes. */
export function useSelectedRoomSummary(): RoomSummary | null {
  const selectedId = useViewerStore((s) => s.selectedRoomId);
  return useMemo(() => {
    const room = HOUSE.rooms.find((r) => r.id === selectedId);
    return room ? summarizeRoom(room) : null;
  }, [selectedId]);
}

/** Desktop right-hand panel: room details, or the room list when nothing is selected. */
export function RoomInfoPanel() {
  const summary = useSelectedRoomSummary();
  if (!summary) {
    return (
      <Panel className="flex max-h-full w-64 flex-col overflow-y-auto">
        <PanelHeading>Rooms</PanelHeading>
        <RoomList />
      </Panel>
    );
  }
  return (
    <Panel className="max-h-full w-64 overflow-y-auto">
      <RoomDetails summary={summary} />
    </Panel>
  );
}
