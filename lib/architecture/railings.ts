import type { Railing } from "@/types/architecture";
import { BALCONY_RECT, DIMENSIONS, GRID, STAIR_OPENING } from "./dimensions";

/**
 * First-floor guard rails, each set just inside the slab edge it protects:
 * the sitting area and walkway edges over the double-height void, the stair
 * well (except where the stair arrives), and the balcony.
 */

const { x, z, walkway, bedroomTwoFront } = GRID;
const HI = DIMENSIONS.interiorWall / 2;
const GUARD_HEIGHT = 1.0;
/** Rail centreline set back from the slab edge. */
const SETBACK = 0.03;
const S = STAIR_OPENING;
/** The stair arrives along the east half of the well's south edge. */
const STAIR_ARRIVAL_X0 = (S.x0 + S.x1) / 2;

const rail = (id: string, axis: "x" | "z", at: number, from: number, to: number): Railing => ({
  id, floor: "first", axis, at, from, to, height: GUARD_HEIGHT,
});

export const RAILINGS: Railing[] = [
  // Void edges.
  rail("ff-rail-sitting-west", "z", x.split + SETBACK, z.front + DIMENSIONS.exteriorWall, walkway.z0 + SETBACK),
  rail("ff-rail-walkway-south", "x", walkway.z0 + SETBACK, walkway.x0 + SETBACK, x.split + SETBACK),
  rail("ff-rail-walkway-west", "z", walkway.x0 + SETBACK, walkway.z0 + SETBACK, bedroomTwoFront - HI),
  // Stair well: landing side, walkway side, and the half of the sitting-area side the stair doesn't use.
  rail("ff-rail-stair-east", "z", S.x1 + SETBACK, S.z0, S.z1),
  rail("ff-rail-stair-west", "z", S.x0 - SETBACK, S.z0, bedroomTwoFront - HI),
  rail("ff-rail-stair-south", "x", S.z0 - SETBACK, S.x0 - SETBACK, STAIR_ARRIVAL_X0),
  // Balcony.
  rail("ff-rail-balcony-front", "x", BALCONY_RECT.z0 + SETBACK, BALCONY_RECT.x0 + SETBACK, BALCONY_RECT.x1 - SETBACK),
  rail("ff-rail-balcony-west", "z", BALCONY_RECT.x0 + SETBACK, BALCONY_RECT.z0 + SETBACK, BALCONY_RECT.z1 - 2 * SETBACK),
  rail("ff-rail-balcony-east", "z", BALCONY_RECT.x1 - SETBACK, BALCONY_RECT.z0 + SETBACK, BALCONY_RECT.z1 - 2 * SETBACK),
];
