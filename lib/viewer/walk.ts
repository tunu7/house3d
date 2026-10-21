import { DIMENSIONS } from "@/lib/architecture/dimensions";
import { pointInPolygon } from "@/lib/architecture/geometry";
import { HOUSE } from "@/lib/architecture/house";
import type { FloorId, PlanPoint, PlanRect } from "@/types/architecture";

/**
 * First-person walkthrough physics in plan coordinates: 2D collision against
 * wall, railing and handrail footprints, and a walking surface height that
 * follows the floors and stair treads. Deliberately simple — no furniture
 * collision, no ceilings.
 */

export const EYE_HEIGHT = 1.6;
export const PLAYER_RADIUS = 0.22;
/** Largest rise or drop the walker will step across in one move. */
export const MAX_STEP = 0.4;
/** Feet below this are treated as the ground floor for collision. */
const UPPER_THRESHOLD = 1.6;
const GROUND_OUTSIDE = -DIMENSIONS.plinthHeight;
const RAIL_THICKNESS = 0.06;
const SITE_LIMIT = 20;

/** Start pose: just inside the main door, looking into the house (yaw 0 faces plan +z). */
export const WALK_START = { x: 4.3, z: 1.0, yaw: 0, feet: HOUSE.levels.ground.ffl };

const lineRect = (a: PlanPoint, b: PlanPoint, t: number): PlanRect => ({
  x0: Math.min(a.x, b.x) - t / 2,
  x1: Math.max(a.x, b.x) + t / 2,
  z0: Math.min(a.z, b.z) - t / 2,
  z1: Math.max(a.z, b.z) + t / 2,
});

/** Wall footprints that reach the floor: every solid span except door openings. */
function wallColliders(floor: FloorId): PlanRect[] {
  return HOUSE.walls
    .filter((w) => w.floor === floor)
    .flatMap((w) => {
      const doors = w.openings.filter((o) => o.kind === "door").sort((a, b) => a.from - b.from);
      const spans: [number, number][] = [];
      let cursor = w.from;
      for (const d of doors) {
        if (d.from > cursor) spans.push([cursor, d.from]);
        cursor = Math.max(cursor, d.to);
      }
      if (cursor < w.to) spans.push([cursor, w.to]);
      const h = w.thickness / 2;
      return spans.map(([a, b]) =>
        w.axis === "x" ? { x0: a, x1: b, z0: w.at - h, z1: w.at + h } : { x0: w.at - h, x1: w.at + h, z0: a, z1: b },
      );
    });
}

const stairRails: PlanRect[] = HOUSE.stair.handrails.map((r) =>
  lineRect({ x: r.from[0], z: r.from[2] }, { x: r.to[0], z: r.to[2] }, RAIL_THICKNESS),
);

export const COLLIDERS: Record<FloorId, PlanRect[]> = {
  ground: [...wallColliders("ground"), ...stairRails],
  first: [
    ...wallColliders("first"),
    ...stairRails,
    ...HOUSE.railings.map((r) =>
      r.axis === "x"
        ? lineRect({ x: r.from, z: r.at }, { x: r.to, z: r.at }, RAIL_THICKNESS)
        : lineRect({ x: r.at, z: r.from }, { x: r.at, z: r.to }, RAIL_THICKNESS),
    ),
  ],
};

export const collisionFloor = (feet: number): FloorId => (feet < UPPER_THRESHOLD ? "ground" : "first");

export function collides(x: number, z: number, rects: PlanRect[], r = PLAYER_RADIUS): boolean {
  if (Math.abs(x - 4.5) > SITE_LIMIT || Math.abs(z - 5) > SITE_LIMIT) return true;
  return rects.some((q) => x > q.x0 - r && x < q.x1 + r && z > q.z0 - r && z < q.z1 + r);
}

const firstSlab = HOUSE.slabs.find((s) => s.id === "first-floor");
const inRect = (p: PlanPoint, r: PlanRect) => p.x >= r.x0 && p.x <= r.x1 && p.z >= r.z0 && p.z <= r.z1;

/**
 * Height of the walking surface at (x, z) for someone whose feet are at
 * `feet`: a stair tread, the first-floor slab (when already upstairs), the
 * ground-floor slab, or the site outside the footprint.
 */
export function surfaceAt(x: number, z: number, feet: number): number {
  const p = { x, z };
  if (inRect(p, HOUSE.stair.bounds)) {
    const tread = HOUSE.stair.treads.find((t) => pointInPolygon(p, t.outline));
    return tread ? tread.top : HOUSE.levels.ground.ffl;
  }
  if (
    feet >= UPPER_THRESHOLD &&
    firstSlab &&
    pointInPolygon(p, firstSlab.outline) &&
    !firstSlab.holes.some((h) => inRect(p, h))
  ) {
    return HOUSE.levels.first.ffl;
  }
  return pointInPolygon(p, HOUSE.footprint) ? HOUSE.levels.ground.ffl : GROUND_OUTSIDE;
}

/**
 * Attempt a move, sliding along obstacles by resolving each axis separately.
 * Returns the new position and feet height.
 */
export function step(
  pos: { x: number; z: number; feet: number },
  dx: number,
  dz: number,
): { x: number; z: number; feet: number } {
  let { x, z, feet } = pos;
  const tryMove = (nx: number, nz: number) => {
    const rects = COLLIDERS[collisionFloor(feet)];
    if (collides(nx, nz, rects)) return false;
    const surface = surfaceAt(nx, nz, feet);
    if (Math.abs(surface - feet) > MAX_STEP) return false;
    x = nx;
    z = nz;
    feet = surface;
    return true;
  };
  tryMove(x + dx, z);
  tryMove(x, z + dz);
  return { x, z, feet };
}
