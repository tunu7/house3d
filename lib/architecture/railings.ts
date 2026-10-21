import type { Railing } from "@/types/architecture";
import { DIMENSIONS, GRID, STAIR_OPENING } from "./dimensions";

/**
 * First-floor guard rails. Each sits just inside the slab edge it protects:
 * the landing and nib edges over the double-height void, and the side of the
 * stair opening that the stair does not arrive on.
 */

const { x, z, nib } = GRID;
const HI = DIMENSIONS.interiorWall / 2;
const GUARD_HEIGHT = 1.0;
/** Rail centreline set back from the slab edge. */
const SETBACK = 0.03;
/** Width of the stair's top flight, where the stair arrives and no rail is needed. */
const STAIR_ARRIVAL = 0.8;

const rail = (id: string, axis: "x" | "z", at: number, from: number, to: number): Railing => ({
  id, floor: "first", axis, at, from, to, height: GUARD_HEIGHT,
});

const edgeX = x.split + HI - SETBACK;
const nibZ = nib.z0 + SETBACK;
const nibX = nib.x1 - SETBACK;

export const RAILINGS: Railing[] = [
  rail("ff-rail-landing", "z", edgeX, z.band1 + HI, nibZ),
  rail("ff-rail-nib-south", "x", nibZ, edgeX, nibX),
  rail("ff-rail-nib-east", "z", nibX, nibZ, z.band2 - HI),
  rail("ff-rail-stair", "z", STAIR_OPENING.x1 + SETBACK, STAIR_OPENING.z0, STAIR_OPENING.z1 - STAIR_ARRIVAL),
];
