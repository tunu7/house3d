import type { FloorId, Opening, PlanRect, Room, Wall } from "@/types/architecture";
import { DIMENSIONS, LEVELS } from "./dimensions";
import { type BoxPiece, exteriorNormal, wallPieces } from "./geometry";
import { HOUSE } from "./house";

/**
 * Construction and finish details derived from the walls and rooms, so they
 * always follow the plan: skirting, bathroom wall tiling, kitchen backsplash,
 * window sills and sun hoods, the first-floor band, curtains and light
 * fittings. All values are typical residential practice, not specifications.
 */

const EPS = 1e-3;
const MIN_SPAN = 0.05;

export type Finish = "skirting" | "wallTile" | "backsplash";

/** Finish height bands above floor level. */
const FINISH_BANDS: Record<Finish, { y0: number; y1: number; thickness: number }> = {
  skirting: { y0: 0, y1: 0.1, thickness: 0.012 },
  // Bathroom dado tiling to door-head height.
  wallTile: { y0: 0, y1: 2.1, thickness: 0.01 },
  // Between the 0.9 m worktop and the 1.5 m wall cabinets.
  backsplash: { y0: 0.9, y1: 1.5, thickness: 0.01 },
};

/**
 * A thin layer on one face of a wall, between heights y0 and y1 (relative to
 * the floor), over [from, to] along the wall, with the wall's openings cut out.
 */
function faceLayer(wall: Wall, side: 1 | -1, from: number, to: number, y0: number, y1: number, thickness: number): BoxPiece[] {
  const openings: Opening[] = wall.openings
    .map((o) => ({ ...o, from: Math.max(o.from, from), to: Math.min(o.to, to), sill: Math.max(0, o.sill - y0), head: Math.min(y1 - y0, o.head - y0) }))
    .filter((o) => o.to - o.from > EPS && o.head > EPS && o.sill < y1 - y0 - EPS);
  const layer: Wall = {
    ...wall,
    at: wall.at + side * (wall.thickness / 2 + thickness / 2),
    from,
    to,
    thickness,
    height: y1 - y0,
    openings,
  };
  return wallPieces(layer, LEVELS[wall.floor].ffl + y0).filter((p) => p.size[1] > EPS);
}

interface RoomEdge {
  axis: "x" | "z";
  /** Fixed coordinate of the edge. */
  line: number;
  from: number;
  to: number;
  /** Direction from the edge into the room along the fixed axis. */
  inward: 1 | -1;
}

const edges = (r: PlanRect): RoomEdge[] => [
  { axis: "x", line: r.z0, from: r.x0, to: r.x1, inward: 1 },
  { axis: "x", line: r.z1, from: r.x0, to: r.x1, inward: -1 },
  { axis: "z", line: r.x0, from: r.z0, to: r.z1, inward: 1 },
  { axis: "z", line: r.x1, from: r.z0, to: r.z1, inward: -1 },
];

/** Finish pieces on every wall face bounding `room`, grouped by wall id. */
function roomFinish(room: Room, finish: Finish, onWall?: (w: Wall) => boolean): Map<string, BoxPiece[]> {
  const band = FINISH_BANDS[finish];
  const out = new Map<string, BoxPiece[]>();
  const walls = HOUSE.walls.filter((w) => w.floor === room.floor && (!onWall || onWall(w)));
  for (const r of room.rects) {
    for (const e of edges(r)) {
      for (const w of walls) {
        if (w.axis !== e.axis || Math.abs(w.at - e.line) > w.thickness / 2 + EPS) continue;
        const from = Math.max(e.from, w.from);
        const to = Math.min(e.to, w.to);
        if (to - from < MIN_SPAN) continue;
        const pieces = faceLayer(w, e.inward, from, to, band.y0, band.y1, band.thickness);
        out.set(w.id, [...(out.get(w.id) ?? []), ...pieces]);
      }
    }
  }
  return out;
}

const merge = (into: Map<string, BoxPiece[]>, from: Map<string, BoxPiece[]>) => {
  for (const [k, v] of from) into.set(k, [...(into.get(k) ?? []), ...v]);
};

const NO_SKIRTING = new Set<Room["kind"]>(["void", "stair", "balcony", "toilet"]);

/** Interior finishes for a floor, by wall id: skirting, bathroom tiling, kitchen backsplash. */
export function interiorFinishes(floor: FloorId): Record<Finish, Map<string, BoxPiece[]>> {
  const result: Record<Finish, Map<string, BoxPiece[]>> = { skirting: new Map(), wallTile: new Map(), backsplash: new Map() };
  for (const room of HOUSE.rooms.filter((r) => r.floor === floor)) {
    if (!NO_SKIRTING.has(room.kind)) merge(result.skirting, roomFinish(room, "skirting"));
    if (room.kind === "toilet") merge(result.wallTile, roomFinish(room, "wallTile"));
    // Backsplash only along the walls with base cabinets (rear and west walls).
    if (room.kind === "kitchen") merge(result.backsplash, roomFinish(room, "backsplash", (w) => w.kind === "exterior"));
  }
  return result;
}

// ── Exterior trim ─────────────────────────────────────────────────────────

/** Openings already sheltered by a balcony, canopy, planter or portal frame: no hood above them. */
const SHELTERED = new Set(["gf-w-bed2-front", "gf-w-living-front", "gf-d-entrance", "ff-w-void-front", "ff-d-balcony"]);

const SILL = { projection: 0.06, depth: 0.05, overhang: 0.05 };
const HOOD = { projection: 0.4, thickness: 0.08, overhang: 0.15, gap: 0.15 };
const BAND = { projection: 0.04, y0: -0.2, y1: 0.02 };

export interface ExteriorTrim {
  sills: BoxPiece[];
  hoods: BoxPiece[];
  band: BoxPiece[];
}

/** A box on the outside face of an exterior wall, projecting `projection` outward. */
function outward(wall: Wall, from: number, to: number, y0: number, y1: number, projection: number): BoxPiece {
  const out = exteriorNormal(wall, HOUSE.footprint);
  const sign = (wall.axis === "x" ? out.z : out.x) as 1 | -1;
  const layer: Wall = { ...wall, at: wall.at + sign * (wall.thickness / 2 + projection / 2), from, to, thickness: projection, height: y1 - y0, openings: [] };
  return wallPieces(layer, LEVELS[wall.floor].ffl + y0)[0];
}

/** Stone sills under every window, slim concrete hoods over unsheltered ones, and the first-floor band. */
export function exteriorTrim(wall: Wall): ExteriorTrim {
  const trim: ExteriorTrim = { sills: [], hoods: [], band: [] };
  if (wall.kind !== "exterior") return trim;
  for (const o of wall.openings) {
    const isWindow = o.kind !== "door";
    if (isWindow) trim.sills.push(outward(wall, o.from - SILL.overhang, o.to + SILL.overhang, o.sill - SILL.depth, o.sill, SILL.projection));
    if (!SHELTERED.has(o.id) && (isWindow || o.operation === "sliding")) {
      const y = o.head + HOOD.gap;
      const projection = o.kind === "vent" ? HOOD.projection * 0.6 : HOOD.projection;
      trim.hoods.push(outward(wall, o.from - HOOD.overhang, o.to + HOOD.overhang, y, y + HOOD.thickness, projection));
    }
  }
  // A band at first-floor slab level on the side and rear elevations (the front has the balcony and frame).
  if (wall.floor === "ground" && !wall.id.endsWith("-front")) {
    trim.band.push(outward(wall, wall.from, wall.to, DIMENSIONS.floorToFloor + BAND.y0, DIMENSIONS.floorToFloor + BAND.y1, BAND.projection));
  }
  return trim;
}

// ── Curtains ──────────────────────────────────────────────────────────────

const CURTAIN_ROOMS = new Set<Room["kind"]>(["bedroom", "living", "sitting", "dining"]);
/** Clerestory windows (high sills) sit above furniture and are left bare. */
const MIN_CURTAIN_HEIGHT = 1.0;

export interface CurtainSpec {
  id: string;
  wall: Wall;
  /** Plan direction from the wall into the room, along the wall's fixed axis. */
  side: 1 | -1;
  panels: { from: number; to: number }[];
  rod: { from: number; to: number };
  /** Heights above the floor. */
  top: number;
  bottom: number;
}

/** Sheer curtains, drawn open, on the room side of living-space windows and glazed doors. */
export function curtains(floor: FloorId): CurtainSpec[] {
  const specs: CurtainSpec[] = [];
  const rooms = HOUSE.rooms.filter((r) => r.floor === floor && CURTAIN_ROOMS.has(r.kind));
  for (const wall of HOUSE.walls.filter((w) => w.floor === floor && w.kind === "exterior")) {
    const out = exteriorNormal(wall, HOUSE.footprint);
    const side = -(wall.axis === "x" ? out.z : out.x) as 1 | -1;
    for (const o of wall.openings) {
      const glazedDoor = o.kind === "door" && o.panel === "glass";
      if (!(o.kind === "window" || glazedDoor) || o.head - o.sill < MIN_CURTAIN_HEIGHT) continue;
      // The room just inside the middle of the opening.
      const mid = (o.from + o.to) / 2;
      const probe = wall.at + side * (wall.thickness / 2 + 0.3);
      const [px, pz] = wall.axis === "x" ? [mid, probe] : [probe, mid];
      const inRoom = rooms.some((r) => r.rects.some((q) => px >= q.x0 && px <= q.x1 && pz >= q.z0 && pz <= q.z1));
      if (!inRoom) continue;
      const stack = Math.min(0.5, (o.to - o.from) * 0.22);
      specs.push({
        id: `curtain-${o.id}`,
        wall,
        side,
        panels: [
          { from: o.from - 0.2, to: o.from - 0.2 + stack },
          { from: o.to + 0.2 - stack, to: o.to + 0.2 },
        ],
        rod: { from: o.from - 0.3, to: o.to + 0.3 },
        top: Math.min(o.head + 0.25, LEVELS[floor].ceilingHeight - 0.08),
        bottom: 0.02,
      });
    }
  }
  return specs;
}

// ── Light fittings ────────────────────────────────────────────────────────

export type FixtureKind = "flush" | "pendant" | "linear";

export interface Fixture {
  id: string;
  floor: FloorId;
  roomId: string;
  kind: FixtureKind;
  x: number;
  z: number;
  /** Height of the light source above floor level. */
  y: number;
  /** Ceiling height it hangs from, above floor level. */
  ceiling: number;
  /** Lamp output when lights are on (relative). */
  intensity: number;
}

const largest = (room: Room) =>
  room.rects.reduce((a, b) => ((a.x1 - a.x0) * (a.z1 - a.z0) >= (b.x1 - b.x0) * (b.z1 - b.z0) ? a : b));

const LIT = new Set<Room["kind"]>(["bedroom", "kitchen", "sitting", "circulation", "toilet"]);

/**
 * Ceiling fittings: a flush light in each room, a linear pendant over the
 * dining table, and a cluster of globe pendants dropping into the
 * double-height living room from the roof.
 */
export const FIXTURES: Fixture[] = (() => {
  const list: Fixture[] = [];
  const ceiling = DIMENSIONS.ceilingHeight;
  for (const room of HOUSE.rooms) {
    if (!LIT.has(room.kind)) continue;
    const r = largest(room);
    list.push({
      id: `${room.id}-light`,
      floor: room.floor,
      roomId: room.id,
      kind: "flush",
      x: (r.x0 + r.x1) / 2,
      z: (r.z0 + r.z1) / 2,
      y: ceiling - 0.06,
      ceiling,
      intensity: room.kind === "toilet" ? 3 : room.kind === "circulation" ? 3 : 5,
    });
  }
  const table = HOUSE.furniture.find((f) => f.type === "diningTable");
  if (table) {
    list.push({ id: "dining-pendant", floor: "ground", roomId: table.roomId, kind: "linear", x: table.x, z: table.z, y: 2.0, ceiling, intensity: 6 });
  }
  // Living room: three globes at staggered drops from the roof slab (double height).
  const doubleHeight = DIMENSIONS.floorToFloor + ceiling;
  [
    [2.8, 2.4, 4.0],
    [2.2, 2.9, 4.4],
    [3.2, 3.0, 4.7],
  ].forEach(([x, z, y], i) =>
    list.push({ id: `living-globe-${i}`, floor: "ground", roomId: "gf-living", kind: "pendant", x, z, y, ceiling: doubleHeight, intensity: 5 }),
  );
  return list;
})();

// ── Rainwater ─────────────────────────────────────────────────────────────

/** Downpipes at the rear corners, plan positions just outside the wall face. */
export const DOWNPIPES: { x: number; z: number }[] = [
  { x: 8.65, z: DIMENSIONS.overallDepth + 0.07 },
  { x: 5.2, z: 8.5 + 0.07 },
  { x: 0.3, z: 8.5 + 0.07 },
];
