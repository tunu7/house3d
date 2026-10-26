"use client";

import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { furnitureFootprint } from "@/lib/architecture/furniture";
import { HOUSE } from "@/lib/architecture/house";
import { summarizeRoom } from "@/lib/architecture/room-info";
import { PLANTERS, PORCH, REAR_PATIO, STEP_TREADS } from "@/lib/architecture/site";
import { ROOM_COPY } from "@/lib/property";
import type { FloorId, Opening, PlanPoint, PlanRect, Room, RoomKind, Wall } from "@/types/architecture";

/**
 * Architectural floor plan drawn from the same data model as the 3D scene:
 * walls with their real openings, door swings, sliding doors, windows, the
 * stair, railings, furniture outlines, dimensions and room labels. Plan z
 * runs front → back, so the drawing flips it (front at the bottom).
 */

const Y = (z: number) => HOUSE.dimensions.overallDepth - z;
const INK = "#26241f";
const LINE = "#8c857a";
const ACCENT = "#b8673a";

const FILL: Record<RoomKind, string> = {
  bedroom: "#efe5d7",
  sitting: "#efe5d7",
  balcony: "#efe5d7",
  toilet: "#e2e8eb",
  kitchen: "#ebe5da",
  dining: "#f3ede3",
  living: "#f5f0e7",
  circulation: "#f1ede6",
  stair: "#eae6df",
  void: "transparent",
};

const rectProps = (r: PlanRect) => ({ x: r.x0, y: Y(r.z1), width: r.x1 - r.x0, height: r.z1 - r.z0 });
const pts = (ps: PlanPoint[]) => ps.map((p) => `${p.x},${Y(p.z)}`).join(" ");

function wallRect(w: Wall, a: number, b: number, thickness = w.thickness): PlanRect {
  const h = thickness / 2;
  return w.axis === "x" ? { x0: a, x1: b, z0: w.at - h, z1: w.at + h } : { x0: w.at - h, x1: w.at + h, z0: a, z1: b };
}

/** Solid spans of a wall between all its openings. */
function solidSpans(w: Wall): [number, number][] {
  const spans: [number, number][] = [];
  let cursor = w.from;
  for (const o of [...w.openings].sort((a, b) => a.from - b.from)) {
    if (o.from > cursor) spans.push([cursor, o.from]);
    cursor = Math.max(cursor, o.to);
  }
  if (cursor < w.to) spans.push([cursor, w.to]);
  return spans;
}

const along = (w: Wall, a: number, off = 0): PlanPoint => (w.axis === "x" ? { x: a, z: w.at + off } : { x: w.at + off, z: a });

/** Window: thin frame across the wall with a centre line for the glass. */
function WindowMark({ w, o }: { w: Wall; o: Opening }) {
  const r = wallRect(w, o.from, o.to);
  const a = along(w, o.from);
  const b = along(w, o.to);
  return (
    <g>
      <rect {...rectProps(r)} fill="#fff" stroke={INK} strokeWidth={0.015} />
      <line x1={a.x} y1={Y(a.z)} x2={b.x} y2={Y(b.z)} stroke={INK} strokeWidth={0.012} />
    </g>
  );
}

/** Hinged door: leaf drawn open 90° with its swing arc; sliding door: two offset panels. */
function DoorMark({ w, o }: { w: Wall; o: Opening }) {
  if (o.operation === "sliding") {
    const half = (o.from + o.to) / 2;
    // Panels drawn over the parked half; `dir` points from the parked end toward the open half.
    const [end, dir] = o.parked === "end" ? [o.to, -1] : [o.from, 1];
    const p1 = [along(w, end, -0.04), along(w, half + dir * 0.05, -0.04)];
    const p2 = [along(w, end + dir * 0.05, 0.04), along(w, half + dir * 0.1, 0.04)];
    return (
      <g stroke={INK} strokeWidth={0.03}>
        {[p1, p2].map(([a, b], i) => (
          <line key={i} x1={a.x} y1={Y(a.z)} x2={b.x} y2={Y(b.z)} />
        ))}
      </g>
    );
  }
  const width = o.to - o.from;
  const atStart = (o.hinge ?? "start") === "start";
  const swing = o.swing ?? 1;
  const hingeAlong = atStart ? o.from : o.to;
  const face = swing * (w.thickness / 2);
  const hinge = along(w, hingeAlong, face);
  const dir = atStart ? 1 : -1;
  const arc: PlanPoint[] = Array.from({ length: 13 }, (_, i) => {
    const t = (i / 12) * (Math.PI / 2);
    const da = Math.cos(t) * width * dir;
    const dn = Math.sin(t) * width * swing;
    return w.axis === "x" ? { x: hinge.x + da, z: hinge.z + dn } : { x: hinge.x + dn, z: hinge.z + da };
  });
  const leafEnd = arc[arc.length - 1];
  return (
    <g fill="none">
      <polyline points={pts(arc)} stroke={LINE} strokeWidth={0.012} strokeDasharray="0.05 0.04" />
      <line x1={hinge.x} y1={Y(hinge.z)} x2={leafEnd.x} y2={Y(leafEnd.z)} stroke={INK} strokeWidth={0.03} />
    </g>
  );
}

function Dimension({ x1, y1, x2, y2, label, vertical }: { x1: number; y1: number; x2: number; y2: number; label: string; vertical?: boolean }) {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const tick = 0.08;
  return (
    <g stroke={LINE} strokeWidth={0.012}>
      <line x1={x1} y1={y1} x2={x2} y2={y2} />
      {[
        [x1, y1],
        [x2, y2],
      ].map(([x, y], i) => (
        <line key={i} x1={x - tick} y1={y + tick} x2={x + tick} y2={y - tick} />
      ))}
      <text
        x={vertical ? mx - 0.12 : mx}
        y={vertical ? my : my - 0.1}
        fontSize={0.2}
        fill={LINE}
        stroke="none"
        textAnchor="middle"
        transform={vertical ? `rotate(-90 ${mx - 0.12} ${my})` : undefined}
      >
        {label}
      </text>
    </g>
  );
}

const largestRect = (room: Room) =>
  room.rects.reduce((a, b) => ((a.x1 - a.x0) * (a.z1 - a.z0) >= (b.x1 - b.x0) * (b.z1 - b.z0) ? a : b));

interface PlanProps {
  floor: FloorId;
  selected: string | null;
  onSelect: (id: string) => void;
}

function PlanDrawing({ floor, selected, onSelect }: PlanProps) {
  const [hover, setHover] = useState<string | null>(null);
  const rooms = HOUSE.rooms.filter((r) => r.floor === floor);
  const walls = HOUSE.walls.filter((w) => w.floor === floor);
  const furniture = HOUSE.furniture.filter((f) => f.floor === floor && f.type !== "rug");
  const stair = HOUSE.stair;
  const treadEdges = useMemo(() => stair.treads.map((t) => pts(t.outline)), [stair]);

  return (
    <svg viewBox="-1.3 -1.0 11.6 13.9" className="h-auto w-full" role="group" aria-label={`${HOUSE.levels[floor].name} plan`}>
      {/* Site: porch, steps, planters and rear patio (ground floor only). */}
      {floor === "ground" && (
        <g>
          <rect {...rectProps(REAR_PATIO.rect)} fill="#ece8e0" />
          <rect {...rectProps(PORCH)} fill="#ece8e0" />
          {STEP_TREADS.map((t, i) => (
            <rect key={i} {...rectProps(t.rect)} fill="#e4dfd5" stroke={LINE} strokeWidth={0.01} />
          ))}
          {PLANTERS.map((p, i) => (
            <rect key={i} {...rectProps(p.rect)} fill="#d6e0c8" stroke="#8fa070" strokeWidth={0.012} />
          ))}
        </g>
      )}

      {/* Rooms. */}
      {rooms.map((room) => {
        const active = hover === room.id || selected === room.id;
        const interactive = room.kind !== "stair";
        return (
          <g
            key={room.id}
            role={interactive ? "button" : undefined}
            tabIndex={interactive ? 0 : undefined}
            aria-label={interactive ? `${room.name}, ${summarizeRoom(room).nominalArea.toFixed(1)} square metres` : undefined}
            aria-pressed={interactive ? selected === room.id : undefined}
            onClick={interactive ? () => onSelect(room.id) : undefined}
            onKeyDown={
              interactive
                ? (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelect(room.id);
                    }
                  }
                : undefined
            }
            onPointerEnter={() => setHover(room.id)}
            onPointerLeave={() => setHover(null)}
            className={interactive ? "cursor-pointer outline-none [&:focus-visible>rect]:stroke-[var(--accent)]" : undefined}
          >
            {room.rects.map((r, i) => (
              <rect
                key={i}
                {...rectProps(r)}
                fill={active && room.kind !== "void" ? "#f3dccb" : FILL[room.kind]}
                stroke={active ? ACCENT : "none"}
                strokeWidth={0.04}
                className="transition-[fill] duration-200"
              />
            ))}
          </g>
        );
      })}

      {/* Void: dashed cross. */}
      {rooms
        .filter((r) => r.kind === "void")
        .flatMap((r) => r.rects)
        .map((r, i) => (
          <g key={i} stroke={LINE} strokeWidth={0.012} strokeDasharray="0.12 0.08" pointerEvents="none">
            <line x1={r.x0} y1={Y(r.z0)} x2={r.x1} y2={Y(r.z1)} />
            <line x1={r.x0} y1={Y(r.z1)} x2={r.x1} y2={Y(r.z0)} />
          </g>
        ))}

      {/* Furniture outlines. */}
      <g fill="none" stroke="#b9b1a4" strokeWidth={0.012} pointerEvents="none">
        {furniture.map((f) => {
          const r = furnitureFootprint(f);
          return f.type === "roundTable" || f.type === "plant" || f.type === "stool" ? (
            <circle key={f.id} cx={(r.x0 + r.x1) / 2} cy={Y((r.z0 + r.z1) / 2)} r={(r.x1 - r.x0) / 2} />
          ) : (
            <rect key={f.id} {...rectProps(r)} rx={0.03} />
          );
        })}
      </g>

      {/* Stair treads, with direction of travel. */}
      <g fill="none" stroke={LINE} strokeWidth={0.012} strokeDasharray={floor === "first" ? "0.06 0.05" : undefined} pointerEvents="none">
        {treadEdges.map((p, i) => (
          <polygon key={i} points={p} />
        ))}
      </g>
      <text x={6.0} y={Y(3.3)} fontSize={0.16} fill={LINE} textAnchor="middle" pointerEvents="none">
        {floor === "ground" ? "UP" : "DN"}
      </text>

      {/* Railings. */}
      {floor === "first" &&
        HOUSE.railings.map((r) => {
          const a = r.axis === "x" ? { x: r.from, z: r.at } : { x: r.at, z: r.from };
          const b = r.axis === "x" ? { x: r.to, z: r.at } : { x: r.at, z: r.to };
          return <line key={r.id} x1={a.x} y1={Y(a.z)} x2={b.x} y2={Y(b.z)} stroke={INK} strokeWidth={0.025} pointerEvents="none" />;
        })}

      {/* Walls, then openings. */}
      <g fill={INK} pointerEvents="none">
        {walls.flatMap((w) => solidSpans(w).map(([a, b], i) => <rect key={`${w.id}-${i}`} {...rectProps(wallRect(w, a, b))} />))}
      </g>
      <g pointerEvents="none">
        {walls.flatMap((w) =>
          w.openings.map((o) => (o.kind === "door" ? <DoorMark key={o.id} w={w} o={o} /> : <WindowMark key={o.id} w={w} o={o} />)),
        )}
      </g>

      {/* Room labels. */}
      <g pointerEvents="none" textAnchor="middle" fontFamily="var(--font-geist-sans)">
        {rooms
          .filter((r) => r.kind !== "stair")
          .map((room) => {
            const r = largestRect(room);
            const s = summarizeRoom(room);
            const small = s.nominalArea < 4.5;
            const cx = (r.x0 + r.x1) / 2;
            const cy = Y((r.z0 + r.z1) / 2);
            const name = room.kind === "void" ? "Open to below" : room.name.replace("Bedroom 2 Bathroom", "Bath");
            return (
              <g key={room.id}>
                <text x={cx} y={cy - (small ? 0.02 : 0.05)} fontSize={small ? 0.15 : 0.22} fill={INK} fontWeight={500}>
                  {name}
                </text>
                {room.kind !== "void" && (
                  <text x={cx} y={cy + (small ? 0.17 : 0.24)} fontSize={small ? 0.12 : 0.16} fill={LINE}>
                    {s.nominalArea.toFixed(1)} m²
                  </text>
                )}
              </g>
            );
          })}
      </g>

      {/* Dimensions. */}
      <Dimension x1={0} y1={-0.55} x2={3.5} y2={-0.55} label="3.5 m" />
      <Dimension x1={3.5} y1={-0.55} x2={9} y2={-0.55} label="5.5 m" />
      <Dimension x1={-0.55} y1={Y(10)} x2={-0.55} y2={Y(5.5)} label="4.5 m" vertical />
      <Dimension x1={-0.55} y1={Y(5.5)} x2={-0.55} y2={Y(3)} label="2.5 m" vertical />
      <Dimension x1={-0.55} y1={Y(3)} x2={-0.55} y2={Y(0)} label="3.0 m" vertical />
      <text x={4.5} y={12.7} fontSize={0.2} fill={LINE} textAnchor="middle" letterSpacing={0.04}>
        FRONT · ENTRANCE
      </text>
    </svg>
  );
}

const FLOORS: { id: FloorId; label: string }[] = [
  { id: "ground", label: "Ground floor" },
  { id: "first", label: "First floor" },
];

/** Floor plan with floor tabs and a details card for the selected room. */
export function FloorPlan() {
  const [floor, setFloor] = useState<FloorId>("ground");
  const [selected, setSelected] = useState<string | null>("gf-living");
  const room = HOUSE.rooms.find((r) => r.id === selected && r.floor === floor);
  const s = room ? summarizeRoom(room) : null;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-12">
      <div>
        <div role="tablist" aria-label="Floor" className="mb-6 inline-flex rounded-full border border-stone-300 p-1">
          {FLOORS.map((f) => (
            <button
              key={f.id}
              role="tab"
              type="button"
              aria-selected={floor === f.id}
              onClick={() => {
                setFloor(f.id);
                setSelected(f.id === "ground" ? "gf-living" : "ff-sitting");
              }}
              className={`min-h-10 rounded-full px-5 text-sm transition focus-visible:outline-2 focus-visible:outline-[var(--accent)] ${
                floor === f.id ? "bg-stone-900 text-white" : "text-stone-600 hover:text-stone-900"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="rounded-2xl bg-white p-3 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_40px_rgba(60,50,30,0.08)] sm:p-6">
          <PlanDrawing floor={floor} selected={selected} onSelect={setSelected} />
        </div>
        <p className="mt-3 text-xs text-stone-500">Select a room for details. Sizes are to wall centrelines.</p>
      </div>

      <aside aria-live="polite" className="lg:sticky lg:top-24 lg:self-start">
        {room && s ? (
          <div className="rounded-2xl border border-stone-200 bg-white p-6">
            <p className="text-[11px] font-semibold tracking-[0.16em] text-[var(--accent)] uppercase">{s.floorName}</p>
            <h3 className="mt-1 font-display text-3xl tracking-tight text-stone-900">{room.name}</h3>
            <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
              <div>
                <dt className="text-xs text-stone-500">Size</dt>
                <dd className="mt-0.5 text-stone-900 tabular-nums">{s.sizeLabel}</dd>
              </div>
              <div>
                <dt className="text-xs text-stone-500">Area</dt>
                <dd className="mt-0.5 text-stone-900 tabular-nums">{s.nominalArea.toFixed(2)} m²</dd>
              </div>
              {room.kind !== "void" && room.kind !== "balcony" && (
                <div>
                  <dt className="text-xs text-stone-500">Clear area ≈</dt>
                  <dd className="mt-0.5 text-stone-900 tabular-nums">{s.clearArea.toFixed(2)} m²</dd>
                </div>
              )}
              <div>
                <dt className="text-xs text-stone-500">Ceiling</dt>
                <dd className="mt-0.5 text-stone-900 tabular-nums">{s.height.toFixed(1)} m</dd>
              </div>
            </dl>
            {ROOM_COPY[room.id] && (
              <p className="mt-5 border-t border-stone-100 pt-4 text-sm leading-relaxed text-stone-600">{ROOM_COPY[room.id]}</p>
            )}
            <Link
              href={`/explore?room=${room.id}`}
              className="mt-6 inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-stone-900 underline decoration-stone-300 underline-offset-4 hover:decoration-stone-900 focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
            >
              See it in 3D
              <ArrowUpRight className="size-4" aria-hidden />
            </Link>
          </div>
        ) : (
          <p className="text-sm text-stone-500">Select a room on the plan.</p>
        )}
      </aside>
    </div>
  );
}
