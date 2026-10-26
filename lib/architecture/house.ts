import type { HouseModel, PlanPoint, Slab } from "@/types/architecture";
import { BALCONY_RECT, DIMENSIONS, FOOTPRINT, GRID, LEVELS, ROOF_TOP, STAIR_OPENING } from "./dimensions";
import { FURNITURE } from "./furniture";
import { offsetOrthoPolygon } from "./geometry";
import { RAILINGS } from "./railings";
import { ROOMS } from "./rooms";
import { STAIR } from "./stair";
import { WALLS } from "./walls";

const D = DIMENSIONS;
const { x, z, bedroomTwoFront, walkway } = GRID;
const HI = D.interiorWall / 2;

/** Slab edges are pulled 1 cm inside exterior wall faces to avoid coplanar z-fighting. */
const SLAB_INSET = 0.01;

/**
 * First-floor slab: footprint minus the L-shaped void. The edge along Bedroom
 * 2's front wall follows the wall face so the wall bears fully on the slab;
 * the sitting area and walkway edges are open, with glass railings.
 */
const FIRST_SLAB_OUTLINE: PlanPoint[] = [
  { x: x.split, z: z.front },
  { x: x.right, z: z.front },
  { x: x.right, z: z.back },
  { x: x.split, z: z.back },
  { x: x.split, z: z.leftRear },
  { x: x.left, z: z.leftRear },
  { x: x.left, z: bedroomTwoFront - HI },
  { x: walkway.x0, z: bedroomTwoFront - HI },
  { x: walkway.x0, z: walkway.z0 },
  { x: x.split, z: walkway.z0 },
];

const rectOutline = (r: { x0: number; x1: number; z0: number; z1: number }): PlanPoint[] => [
  { x: r.x0, z: r.z0 },
  { x: r.x1, z: r.z0 },
  { x: r.x1, z: r.z1 },
  { x: r.x0, z: r.z1 },
];

const SLABS: Slab[] = [
  {
    id: "plinth",
    top: LEVELS.ground.ffl,
    thickness: D.plinthHeight,
    outline: offsetOrthoPolygon(FOOTPRINT, 0.05),
    holes: [],
  },
  {
    id: "first-floor",
    top: LEVELS.first.ffl,
    thickness: D.slabThickness,
    outline: offsetOrthoPolygon(FIRST_SLAB_OUTLINE, -SLAB_INSET),
    holes: [STAIR_OPENING],
  },
  {
    // Cantilevered balcony (R8): its back edge stops at the wall face.
    id: "balcony",
    top: LEVELS.first.ffl,
    thickness: D.slabThickness,
    outline: rectOutline({ ...BALCONY_RECT, z1: BALCONY_RECT.z1 - SLAB_INSET }),
    holes: [],
  },
];

const ROOF: Slab = {
  id: "roof",
  top: ROOF_TOP,
  thickness: D.slabThickness,
  outline: offsetOrthoPolygon(FOOTPRINT, -SLAB_INSET),
  holes: [],
};

export const HOUSE: HouseModel = {
  dimensions: D,
  levels: LEVELS,
  footprint: FOOTPRINT,
  rooms: ROOMS,
  walls: WALLS,
  slabs: SLABS,
  roof: ROOF,
  stair: STAIR,
  railings: RAILINGS,
  furniture: FURNITURE,
};
