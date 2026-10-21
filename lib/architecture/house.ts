import type { HouseModel, PlanPoint, Slab } from "@/types/architecture";
import { DIMENSIONS, FOOTPRINT, GRID, LEVELS, ROOF_TOP, STAIR_OPENING } from "./dimensions";
import { FURNITURE } from "./furniture";
import { offsetOrthoPolygon } from "./geometry";
import { RAILINGS } from "./railings";
import { ROOMS } from "./rooms";
import { STAIR } from "./stair";
import { WALLS } from "./walls";

const D = DIMENSIONS;
const { x, z, nib } = GRID;
const HI = D.interiorWall / 2;

/** Slab edges are pulled 1 cm inside exterior wall faces to avoid coplanar z-fighting. */
const SLAB_INSET = 0.01;

/**
 * First-floor slab: footprint minus the void. Void edges follow the face of the
 * walls that bound it (mini sitting east wall, Bedroom 2 south wall) so those
 * walls bear fully on the slab; the landing nib stays.
 */
const FIRST_SLAB_OUTLINE: PlanPoint[] = [
  { x: x.left, z: z.front },
  { x: x.split + HI, z: z.front },
  { x: x.split + HI, z: nib.z0 },
  { x: nib.x1, z: nib.z0 },
  { x: nib.x1, z: z.band2 - HI },
  { x: x.right, z: z.band2 - HI },
  { x: x.right, z: z.rightRear },
  { x: x.split, z: z.rightRear },
  { x: x.split, z: z.back },
  { x: x.left, z: z.back },
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
