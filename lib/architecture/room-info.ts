import type { FloorId, PlanPoint, PlanRect, Room } from "@/types/architecture";
import { DIMENSIONS } from "./dimensions";
import { pointInPolygon, rectArea, roomArea } from "./geometry";
import { HOUSE } from "./house";

const EPS = 1e-6;

/** The room on `floor` containing plan point (x, z), if any. */
export function findRoomAt(floor: FloorId, x: number, z: number): Room | undefined {
  return HOUSE.rooms.find(
    (r) => r.floor === floor && r.rects.some((q) => x >= q.x0 - EPS && x <= q.x1 + EPS && z >= q.z0 - EPS && z <= q.z1 + EPS),
  );
}

export type Segment = [PlanPoint, PlanPoint];

/**
 * Boundary of the union of a room's rectangles. Every rect edge is split at
 * all breakpoints; pieces shared by two rects are internal and dropped.
 */
export function roomOutline(room: Room): Segment[] {
  const xs = [...new Set(room.rects.flatMap((r) => [r.x0, r.x1]))].sort((a, b) => a - b);
  const zs = [...new Set(room.rects.flatMap((r) => [r.z0, r.z1]))].sort((a, b) => a - b);
  const counts = new Map<string, { seg: Segment; n: number }>();
  const add = (a: PlanPoint, b: PlanPoint) => {
    const key = `${a.x.toFixed(4)},${a.z.toFixed(4)}-${b.x.toFixed(4)},${b.z.toFixed(4)}`;
    const entry = counts.get(key);
    if (entry) entry.n++;
    else counts.set(key, { seg: [a, b], n: 1 });
  };
  for (const r of room.rects) {
    const xb = xs.filter((x) => x >= r.x0 && x <= r.x1);
    const zb = zs.filter((z) => z >= r.z0 && z <= r.z1);
    for (let i = 0; i + 1 < xb.length; i++) {
      add({ x: xb[i], z: r.z0 }, { x: xb[i + 1], z: r.z0 });
      add({ x: xb[i], z: r.z1 }, { x: xb[i + 1], z: r.z1 });
    }
    for (let i = 0; i + 1 < zb.length; i++) {
      add({ x: r.x0, z: zb[i] }, { x: r.x0, z: zb[i + 1] });
      add({ x: r.x1, z: zb[i] }, { x: r.x1, z: zb[i + 1] });
    }
  }
  return [...counts.values()].filter((e) => e.n === 1).map((e) => e.seg);
}

/** True when a rect edge lies on the footprint's outer boundary. */
function onOuterBoundary(a: PlanPoint, b: PlanPoint): boolean {
  const mid = { x: (a.x + b.x) / 2, z: (a.z + b.z) / 2 };
  const dx = b.z - a.z !== 0 ? 0.01 : 0;
  const dz = b.x - a.x !== 0 ? 0.01 : 0;
  return !pointInPolygon({ x: mid.x + dx, z: mid.z + dz }, HOUSE.footprint) ||
    !pointInPolygon({ x: mid.x - dx, z: mid.z - dz }, HOUSE.footprint);
}

/**
 * Approximate clear (internal) area: each rect side is pulled in by the full
 * exterior wall on the outer boundary, or half a partition elsewhere. Sides
 * shared between rects of the same room are not inset.
 */
export function clearArea(room: Room): number {
  const te = DIMENSIONS.exteriorWall;
  const hi = DIMENSIONS.interiorWall / 2;
  const internal = (a: PlanPoint, b: PlanPoint) =>
    room.rects.filter((q) => {
      const mx = (a.x + b.x) / 2;
      const mz = (a.z + b.z) / 2;
      return mx >= q.x0 - EPS && mx <= q.x1 + EPS && mz >= q.z0 - EPS && mz <= q.z1 + EPS;
    }).length > 1;
  const inset = (a: PlanPoint, b: PlanPoint) => (internal(a, b) ? 0 : onOuterBoundary(a, b) ? te : hi);
  return room.rects.reduce((sum, r: PlanRect) => {
    const w = r.x1 - r.x0 - inset({ x: r.x0, z: r.z0 }, { x: r.x0, z: r.z1 }) - inset({ x: r.x1, z: r.z0 }, { x: r.x1, z: r.z1 });
    const d = r.z1 - r.z0 - inset({ x: r.x0, z: r.z0 }, { x: r.x1, z: r.z0 }) - inset({ x: r.x0, z: r.z1 }, { x: r.x1, z: r.z1 });
    return sum + Math.max(0, w) * Math.max(0, d);
  }, 0);
}

export interface RoomSummary {
  room: Room;
  floorName: string;
  /** "W × D m" for rectangles; bounding size plus "L-shaped" otherwise. */
  sizeLabel: string;
  shape: "rectangular" | "L-shaped";
  nominalArea: number;
  clearArea: number;
  /** Clear height above this room's floor (the living room is double height). */
  height: number;
}

export function summarizeRoom(room: Room): RoomSummary {
  const x0 = Math.min(...room.rects.map((r) => r.x0));
  const x1 = Math.max(...room.rects.map((r) => r.x1));
  const z0 = Math.min(...room.rects.map((r) => r.z0));
  const z1 = Math.max(...room.rects.map((r) => r.z1));
  const rectangular = room.rects.length === 1 || Math.abs(rectArea({ x0, x1, z0, z1 }) - roomArea(room)) < EPS;
  const fmt = (n: number) => n.toFixed(2).replace(/\.?0+$/, "");
  const level = HOUSE.levels[room.floor];
  return {
    room,
    floorName: level.name,
    sizeLabel: `${fmt(x1 - x0)} m × ${fmt(z1 - z0)} m`,
    shape: rectangular ? "rectangular" : "L-shaped",
    nominalArea: roomArea(room),
    clearArea: room.kind === "void" || room.kind === "balcony" ? roomArea(room) : clearArea(room),
    height: room.kind === "living" ? HOUSE.levels.first.ffl + HOUSE.levels.first.ceilingHeight : level.ceilingHeight,
  };
}
