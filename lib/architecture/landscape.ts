import type { PlanRect } from "@/types/architecture";
import { GRID } from "./dimensions";
import { PATH, PLANTERS, PORCH, REAR_PATIO, STEPS_FOOT_Z } from "./site";

/**
 * Site context beyond the house (plan metres, same axes as the floor plan):
 * the plot with its boundary hedge, the street in front, trees in the garden,
 * along the street and in the distance, and where the lawn gets 3D grass.
 */

/** The plot: 3 m side yards, the front garden down to the footpath, a rear garden. */
export const PLOT: PlanRect = { x0: GRID.x.left - 3, x1: GRID.x.right + 3, z0: STEPS_FOOT_Z - PATH.length - 0.1, z1: GRID.z.back + 3 };

/** Public footpath, kerbed carriageway and the far footpath, running across the front. */
const STREET_X: [number, number] = [-140, 150];
export const FOOTPATH_NEAR: PlanRect = { x0: STREET_X[0], x1: STREET_X[1], z0: PLOT.z0 - 1.8, z1: PLOT.z0 };
export const ROAD: PlanRect = { x0: STREET_X[0], x1: STREET_X[1], z0: FOOTPATH_NEAR.z0 - 7, z1: FOOTPATH_NEAR.z0 };
export const FOOTPATH_FAR: PlanRect = { x0: STREET_X[0], x1: STREET_X[1], z0: ROAD.z0 - 1.8, z1: ROAD.z0 };
export const KERB_HEIGHT = 0.15;

/** Clipped boundary hedge, and the gap left in it for the front path. */
export const HEDGE = { height: 1.1, width: 0.55, gate: { x0: PATH.x0 - 0.5, x1: PATH.x1 + 0.5 } } as const;

/** Straight hedge runs (centrelines, inset half a hedge width inside the plot); the front run is split at the gate. */
export function hedgeRuns(): { a: { x: number; z: number }; b: { x: number; z: number } }[] {
  const i = HEDGE.width / 2;
  const { x0, x1, z0, z1 } = { x0: PLOT.x0 + i, x1: PLOT.x1 - i, z0: PLOT.z0 + i, z1: PLOT.z1 - i };
  const g = HEDGE.gate;
  const run = (ax: number, az: number, bx: number, bz: number) => ({ a: { x: ax, z: az }, b: { x: bx, z: bz } });
  return [
    run(x0, z0, x0, z1),
    run(x0, z1, x1, z1),
    run(x1, z1, x1, z0),
    run(x1, z0, g.x1 + i, z0),
    run(g.x0 - i, z0, x0, z0),
  ];
}

export type TreeKind = "broadleaf" | "columnar";

export interface Tree {
  x: number;
  z: number;
  kind: TreeKind;
  /** Overall height (m). */
  height: number;
  /** Casts a shadow (near trees only; distant ones sit outside the shadow camera). */
  shadow: boolean;
}

/** Garden trees framing the house, chosen to stay clear of the main views and windows. */
const GARDEN: Tree[] = [
  { x: GRID.x.left - 1.6, z: -4.6, kind: "broadleaf", height: 6.2, shadow: true },
  { x: GRID.x.left - 1.7, z: GRID.z.back + 1.4, kind: "broadleaf", height: 7.4, shadow: true },
  { x: GRID.x.right + 1.6, z: GRID.z.back + 1.6, kind: "broadleaf", height: 6.6, shadow: true },
  { x: GRID.x.right + 1.5, z: 6.2, kind: "columnar", height: 5.2, shadow: true },
  { x: GRID.x.left - 1.5, z: 5.0, kind: "columnar", height: 4.8, shadow: true },
];

/** Deterministic PRNG so the context is identical on every load. */
function rng(seed: number) {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

/** Street trees on the far footpath, regularly spaced with slight variation. */
function streetTrees(): Tree[] {
  const rand = rng(211);
  const z = (FOOTPATH_FAR.z0 + FOOTPATH_FAR.z1) / 2;
  return Array.from({ length: 13 }, (_, i) => ({
    x: -42 + i * 8 + (rand() - 0.5) * 1.5,
    z,
    kind: "broadleaf" as const,
    height: 6 + rand() * 2.5,
    shadow: false,
  }));
}

/** A loose ring of trees 36–86 m out that closes the horizon, skipping the street. */
function distantTrees(): Tree[] {
  const rand = rng(977);
  const out: Tree[] = [];
  while (out.length < 90) {
    const a = rand() * Math.PI * 2;
    const r = 36 + rand() * 50;
    const x = GRID.x.right / 2 + Math.cos(a) * r;
    const z = GRID.z.back / 2 + Math.sin(a) * r;
    if (z > FOOTPATH_FAR.z0 - 3 && z < FOOTPATH_NEAR.z1 + 1) continue;
    out.push({ x, z, kind: rand() > 0.25 ? "broadleaf" : "columnar", height: 7 + rand() * 7, shadow: false });
  }
  return out;
}

export const TREES: Tree[] = [...GARDEN, ...streetTrees(), ...distantTrees()];

/** Hard surfaces and beds inside the plot where no grass grows. */
export function lawnExclusions(): PlanRect[] {
  const grow = (r: PlanRect, m: number): PlanRect => ({ x0: r.x0 - m, x1: r.x1 + m, z0: r.z0 - m, z1: r.z1 + m });
  return [
    grow({ x0: GRID.x.left, x1: GRID.x.right, z0: GRID.z.front, z1: GRID.z.back }, 0.15),
    grow(PORCH, 0.1),
    grow({ x0: PORCH.x0, x1: PORCH.x1, z0: STEPS_FOOT_Z, z1: PORCH.z0 }, 0.1),
    { x0: PATH.x0 - 0.3, x1: PATH.x1 + 0.3, z0: PLOT.z0, z1: STEPS_FOOT_Z },
    grow(REAR_PATIO.rect, 0.1),
    ...PLANTERS.map((p) => grow(p.rect, 0.05)),
  ];
}

/** Lawn inside the plot (inside the hedge) that gets 3D grass. */
export const LAWN: PlanRect = { x0: PLOT.x0 + HEDGE.width, x1: PLOT.x1 - HEDGE.width, z0: PLOT.z0 + HEDGE.width, z1: PLOT.z1 - HEDGE.width };
