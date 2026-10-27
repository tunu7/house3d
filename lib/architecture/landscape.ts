import type { PlanPoint, PlanRect } from "@/types/architecture";
import { GRID } from "./dimensions";
import { insidePlot, PLOT_BOUNDS, PLOT_OUTLINE, plotLeftX } from "./plot";
import { BOUNDARY_WALL, DRIVEWAY, GATES, GYM, PATH, PLANTERS, POOL_DECK, PORCH, REAR_PATIO, STEPS_FOOT_Z } from "./site";

/**
 * The grounds beyond the house (plan metres, same axes as the floor plan),
 * after the owner's site plan (R11): the walled plot with its gates, the
 * street in front, garden features (gazebo, vegetable beds, stepping
 * stones), trees and palms along the boundary and the driveway, the woodland
 * around, and where the lawn gets 3D grass.
 */

/** Public footpath, kerbed carriageway and the far footpath, running across the front. */
const STREET_X: [number, number] = [-140, 150];
export const FOOTPATH_NEAR: PlanRect = { x0: STREET_X[0], x1: STREET_X[1], z0: PLOT_BOUNDS.z0 - 1.8, z1: PLOT_BOUNDS.z0 };
export const ROAD: PlanRect = { x0: STREET_X[0], x1: STREET_X[1], z0: FOOTPATH_NEAR.z0 - 7, z1: FOOTPATH_NEAR.z0 };
export const FOOTPATH_FAR: PlanRect = { x0: STREET_X[0], x1: STREET_X[1], z0: ROAD.z0 - 1.8, z1: ROAD.z0 };
export const KERB_HEIGHT = 0.15;

/** A straight run of compound wall (centreline), with its height. */
export interface WallRun {
  a: PlanPoint;
  b: PlanPoint;
  height: number;
}

/**
 * Compound wall runs along the plot outline, centred half a wall inside it.
 * The front run is lower and split at the two gates.
 */
export function boundaryWallRuns(): WallRun[] {
  const h = BOUNDARY_WALL.thickness / 2;
  const [fl, fr, , bl] = PLOT_OUTLINE;
  const z0 = fl.z + h;
  const z1 = bl.z - h;
  const xr = fr.x - h;
  const left = (z: number) => plotLeftX(z) + h;
  const run = (ax: number, az: number, bx: number, bz: number, height: number = BOUNDARY_WALL.height): WallRun => ({
    a: { x: ax, z: az },
    b: { x: bx, z: bz },
    height,
  });
  const front = BOUNDARY_WALL.frontHeight;
  return [
    run(left(z0), z0, left(z1), z1),
    run(left(z1), z1, xr, z1),
    run(xr, z1, xr, z0),
    run(xr, z0, GATES.pedestrian.x1, z0, front),
    run(GATES.pedestrian.x0, z0, GATES.vehicle.x1, z0, front),
    run(GATES.vehicle.x0, z0, left(z0), z0, front),
  ].filter((r) => Math.hypot(r.b.x - r.a.x, r.b.z - r.a.z) > 0.05);
}

/** Low clipped hedge along the outer edge of the driveway, from the gate to the front of the house. */
export const DRIVEWAY_HEDGE = {
  height: 0.7,
  width: 0.5,
  a: { x: DRIVEWAY.x0 - 0.4, z: DRIVEWAY.z0 + 0.6 },
  b: { x: DRIVEWAY.x0 - 0.4, z: GRID.z.front - 1 },
} as const;

/** Gazebo in the left garden, on the stepping-stone path (centre, side, eaves height). */
export const GAZEBO = { x: -12.7, z: 20.5, size: 3.6, height: 2.6 } as const;

/** Raised timber vegetable beds: one beside the house, one in the far garden. */
export const VEGETABLE_BEDS: PlanRect[] = [
  { x0: -14, x1: -8, z0: 1, z1: 6 },
  { x0: -13.5, x1: -9, z0: 29, z1: 33.5 },
];

/** Stepping stones from the front garden past the vegetable bed to the gazebo. */
export const STEPPING_STONES: PlanPoint[] = Array.from({ length: 29 }, (_, i) => ({ x: -7, z: -6 + i * 0.85 })).concat(
  Array.from({ length: 5 }, (_, i) => ({ x: -7.9 - i * 0.85, z: GAZEBO.z })),
);

export type TreeKind = "broadleaf" | "columnar" | "palm";

export interface Tree {
  x: number;
  z: number;
  kind: TreeKind;
  /** Overall height (m). */
  height: number;
  /** Casts a shadow (trees in the plot; the woodland beyond is too far for the shadow map). */
  shadow: boolean;
}

/** Deterministic PRNG so the planting is identical on every load. */
function rng(seed: number) {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

const HEIGHT: Record<TreeKind, [number, number]> = { broadleaf: [6, 8.5], columnar: [4.5, 6], palm: [6.5, 9.5] };
const tree = (x: number, z: number, kind: TreeKind, rand: () => number, shadow = true): Tree => ({
  x,
  z,
  kind,
  height: HEIGHT[kind][0] + rand() * (HEIGHT[kind][1] - HEIGHT[kind][0]),
  shadow,
});

/** Keep-clear zones for trees: the house, the pool and gym, the driveway, the path and the garden features. */
function clearOfFeatures(x: number, z: number): boolean {
  const near = (r: PlanRect, m: number) => x > r.x0 - m && x < r.x1 + m && z > r.z0 - m && z < r.z1 + m;
  const g = GAZEBO.size / 2;
  return !(
    near({ x0: GRID.x.left, x1: GRID.x.right, z0: GRID.z.front - 1.5, z1: GYM.z1 }, 2) ||
    near(POOL_DECK, 2) ||
    near({ ...DRIVEWAY, x0: DRIVEWAY_HEDGE.a.x - DRIVEWAY_HEDGE.width }, 0.6) ||
    near({ x0: PATH.x0, x1: PATH.x1, z0: PLOT_BOUNDS.z0, z1: STEPS_FOOT_Z }, 0.9) ||
    near({ x0: GAZEBO.x - g, x1: GAZEBO.x + g, z0: GAZEBO.z - g, z1: GAZEBO.z + g }, 1.5) ||
    VEGETABLE_BEDS.some((b) => near(b, 1)) ||
    STEPPING_STONES.some((s) => Math.abs(s.x - x) < 0.9 && Math.abs(s.z - z) < 0.9)
  );
}

/** A planted row inside the compound wall, about every 4 m, mixing palms, broadleaf trees and columnar ones. */
function boundaryRows(): Tree[] {
  const rand = rng(1301);
  const out: Tree[] = [];
  const inset = 1.6;
  const pick = (): TreeKind => {
    const r = rand();
    return r < 0.45 ? "palm" : r < 0.8 ? "broadleaf" : "columnar";
  };
  const along = (a: PlanPoint, b: PlanPoint) => {
    const len = Math.hypot(b.x - a.x, b.z - a.z);
    for (let d = 2; d < len - 1; d += 3.6 + rand() * 1.2) {
      const t = d / len;
      const x = a.x + (b.x - a.x) * t + (rand() - 0.5) * 0.8;
      const z = a.z + (b.z - a.z) * t + (rand() - 0.5) * 0.8;
      if (clearOfFeatures(x, z)) out.push(tree(x, z, pick(), rand));
    }
  };
  const { z0, z1 } = PLOT_BOUNDS;
  const xr = PLOT_BOUNDS.x1 - inset;
  along({ x: plotLeftX(z0 + inset) + inset, z: z0 + inset }, { x: plotLeftX(z1 - inset) + inset, z: z1 - inset });
  along({ x: plotLeftX(z1 - inset) + inset, z: z1 - inset }, { x: xr, z: z1 - inset });
  // The 4 m strip right of the house only takes palms (narrow crowns, clear of the windows).
  for (let z = z0 + 2; z < z1 - 2; z += 4 + rand()) {
    if (clearOfFeatures(xr, z)) out.push(tree(xr + (rand() - 0.5) * 0.4, z, "palm", rand));
  }
  along({ x: xr, z: z0 + inset }, { x: plotLeftX(z0 + inset) + inset, z: z0 + inset });
  return out;
}

/**
 * Palms lining the driveway: the outer side from the gate to the house, the
 * inner side only near the gate so the front of the house stays open to view.
 */
function drivewayPalms(): Tree[] {
  const rand = rng(733);
  const out: Tree[] = [];
  for (let z = DRIVEWAY.z0 + 2.5; z < -2; z += 4.2) {
    out.push(tree(DRIVEWAY.x0 - 1.5, z, "palm", rand));
    if (z + 2.1 < -9) out.push(tree(DRIVEWAY.x1 + 0.7, z + 2.1, "palm", rand));
  }
  return out.filter((t) => t.z < GRID.z.front - 1.5);
}

/** A few specimen trees in the open lawns. */
function gardenTrees(): Tree[] {
  const rand = rng(419);
  const spots: [number, number, TreeKind][] = [
    [-15, -12, "broadleaf"],
    [-10.5, 12, "broadleaf"],
    [-4, 25, "palm"],
    [3, 24, "broadleaf"],
    [9, 30, "palm"],
    [-6, 37, "broadleaf"],
    [6, 38, "columnar"],
  ];
  return spots.filter(([x, z]) => clearOfFeatures(x, z)).map(([x, z, kind]) => tree(x, z, kind, rand));
}

/** Woodland pressing up to the walls on the sides and back, as around the plot in the site plan. */
function woodland(): Tree[] {
  const rand = rng(587);
  const out: Tree[] = [];
  while (out.length < 220) {
    const x = PLOT_BOUNDS.x0 - 18 + rand() * (PLOT_BOUNDS.x1 - PLOT_BOUNDS.x0 + 36);
    const z = PLOT_BOUNDS.z0 + rand() * (PLOT_BOUNDS.z1 - PLOT_BOUNDS.z0 + 18);
    if (insidePlot(x, z, -2.5)) continue;
    const r = rand();
    out.push(tree(x, z, r < 0.25 ? "palm" : r < 0.85 ? "broadleaf" : "columnar", rand, false));
  }
  return out;
}

/** Street trees on the far footpath, regularly spaced with slight variation. */
function streetTrees(): Tree[] {
  const rand = rng(211);
  const z = (FOOTPATH_FAR.z0 + FOOTPATH_FAR.z1) / 2;
  return Array.from({ length: 13 }, (_, i) => tree(-46 + i * 8 + (rand() - 0.5) * 1.5, z, "broadleaf", rand, false));
}

/** A loose ring of trees 60–110 m out that closes the horizon, skipping the street. */
function distantTrees(): Tree[] {
  const rand = rng(977);
  const out: Tree[] = [];
  const cx = (PLOT_BOUNDS.x0 + PLOT_BOUNDS.x1) / 2;
  const cz = (PLOT_BOUNDS.z0 + PLOT_BOUNDS.z1) / 2;
  while (out.length < 90) {
    const a = rand() * Math.PI * 2;
    const r = 60 + rand() * 50;
    const x = cx + Math.cos(a) * r;
    const z = cz + Math.sin(a) * r;
    if (z > FOOTPATH_FAR.z0 - 3 && z < FOOTPATH_NEAR.z1 + 1) continue;
    out.push({ x, z, kind: rand() > 0.25 ? "broadleaf" : "columnar", height: 7 + rand() * 7, shadow: false });
  }
  return out;
}

export const TREES: Tree[] = [...boundaryRows(), ...drivewayPalms(), ...gardenTrees(), ...woodland(), ...streetTrees(), ...distantTrees()];

/** Hard surfaces and beds where no grass grows. */
export function lawnExclusions(): PlanRect[] {
  const grow = (r: PlanRect, m: number): PlanRect => ({ x0: r.x0 - m, x1: r.x1 + m, z0: r.z0 - m, z1: r.z1 + m });
  return [
    grow({ x0: GRID.x.left, x1: GRID.x.right, z0: GRID.z.front, z1: GRID.z.back }, 0.15),
    grow(PORCH, 0.1),
    grow({ x0: PORCH.x0, x1: PORCH.x1, z0: STEPS_FOOT_Z, z1: PORCH.z0 }, 0.1),
    { x0: PATH.x0 - 0.3, x1: PATH.x1 + 0.3, z0: PLOT_BOUNDS.z0, z1: STEPS_FOOT_Z },
    grow(REAR_PATIO.rect, 0.1),
    grow(POOL_DECK, 0.1),
    grow(GYM, 0.1),
    grow(DRIVEWAY, 0.1),
    ...VEGETABLE_BEDS.map((b) => grow(b, 0.1)),
    ...PLANTERS.map((p) => grow(p.rect, 0.05)),
  ];
}

/**
 * Lawn that gets 3D grass: the front garden and the strips around the house,
 * where the camera usually is, bounded by the driveway hedge and the walls so
 * the change to the textured lawn beyond falls on a natural edge. Only the
 * back edge, out in the open, fades (`fadeBack` metres).
 */
export const LAWN: PlanRect & { fadeBack: number } = {
  x0: DRIVEWAY_HEDGE.a.x + DRIVEWAY_HEDGE.width / 2,
  x1: PLOT_BOUNDS.x1 - BOUNDARY_WALL.thickness,
  z0: PLOT_BOUNDS.z0 + BOUNDARY_WALL.thickness,
  z1: GYM.z1 + 3,
  fadeBack: 4,
};
