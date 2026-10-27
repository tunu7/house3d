import type { PlanPoint, PlanRect } from "@/types/architecture";
import { GRID } from "./dimensions";

/**
 * The land, from the owner's site plan (R11), in plan metres (same axes as
 * the house: x left → right seen from the street, z front → back; south, the
 * street, is −z).
 *
 * The plan's figures: 30 m along the street, 33 m at the back, 63 m deep;
 * the house 20 m back from the street and 4 m off the right boundary, with
 * an attached 5 m pool / gym zone behind it and 28 m of open garden beyond.
 * The right boundary is taken square to the street, so the extra 3 m of the
 * back width falls on the left: the left side space beside the house comes to
 * 18–18.5 m (the plan's "20 m" is approximate and doesn't close with the
 * other figures).
 */
export const SITE_PLAN = {
  frontWidth: 30,
  backWidth: 33,
  depth: 63,
  frontSetback: 20,
  rightSetback: 4,
  poolGymDepth: 5,
  openBack: 28,
} as const;

const S = SITE_PLAN;
const right = GRID.x.right + S.rightSetback;
const front = GRID.z.front - S.frontSetback;
const back = GRID.z.back + S.poolGymDepth + S.openBack;

/** Boundary (outer face of the compound wall): front-left, front-right, back-right, back-left. */
export const PLOT_OUTLINE: PlanPoint[] = [
  { x: right - S.frontWidth, z: front },
  { x: right, z: front },
  { x: right, z: back },
  { x: right - S.backWidth, z: back },
];

/** Bounding rectangle of the plot. */
export const PLOT_BOUNDS: PlanRect = { x0: right - S.backWidth, x1: right, z0: front, z1: back };

/** The left boundary is the only slanted one: its x at depth z. */
export function plotLeftX(z: number): number {
  const t = (z - front) / (back - front);
  return right - S.frontWidth - t * (S.backWidth - S.frontWidth);
}

/** Whether a plan point lies inside the plot, at least `margin` from every boundary. */
export function insidePlot(x: number, z: number, margin = 0): boolean {
  return z > front + margin && z < back - margin && x < right - margin && x > plotLeftX(z) + margin;
}
