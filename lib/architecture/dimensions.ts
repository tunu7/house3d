import type { Dimensions, FloorId, FloorLevel, PlanPoint, PlanRect } from "@/types/architecture";

/**
 * Provisional construction values. These are assumptions for visualisation,
 * not verified structural specifications. See docs/architecture-spec.md.
 */
export const DIMENSIONS: Dimensions = {
  overallWidth: 9.0,
  overallDepth: 10.0,
  exteriorWall: 0.23,
  interiorWall: 0.115,
  slabThickness: 0.2,
  floorToFloor: 3.2,
  ceilingHeight: 3.0,
  doorHeight: 2.1,
  windowSill: 0.9,
  windowHead: 2.1,
  plinthHeight: 0.45,
  parapetHeight: 0.9,
};

const D = DIMENSIONS;

/** Planning grid. Exterior lines are outer faces; interior lines are partition centrelines. */
export const GRID = {
  /** Mirrored layout (R10): bedroom column on the right, living / kitchen block on the left. */
  x: { left: 0, kitchen: 2.5, split: 5.5, right: D.overallWidth },
  z: {
    front: 0,
    /** Bedroom 2 / mini sitting ↔ stair band. */
    band1: 3.0,
    /** Common toilet ↔ stair lobby (ground floor only). */
    lobby: 4.0,
    /** Stair band ↔ rear rooms. */
    band2: 5.5,
    /** Attached toilet south wall. */
    toilet: 8.0,
    /** Rear wall of the left block (derived: kitchen depth 3.0 from band2). */
    leftRear: 8.5,
    back: D.overallDepth,
  },
  /** Inner line of the 1.5 m wet strip on the right column (common toilet, both Bedroom 1 toilets, FF landing). */
  wet: D.overallWidth - 1.5,
  /** Ground-floor Bedroom 1 toilet north wall (toilet in the room's front-right corner, R6). */
  gfToiletNorth: 7.5,
  /** First-floor Bedroom 1 toilet south wall (toilet in the room's back-right corner, R6). */
  ffToiletSouth: 8.0,
  /** First-floor walkway along the void's east edge, from the sitting area to Bedroom 2 (R7). */
  walkway: { x0: 4.5, z0: 2.0 },
  /** Cantilevered balcony in front of the first-floor sitting area (R8). */
  balconyDepth: 1.2,
  /** First-floor Bedroom 2 front wall: extended 1 m into the void (owner revision R3). */
  bedroomTwoFront: 4.5,
  /** First-floor Bedroom 2 bathroom, rear-west corner over the kitchen (owner revision R4). */
  bath: { x1: 1.5, z0: 6.5 },
} as const;

export const LEVELS: Record<FloorId, FloorLevel> = {
  ground: { id: "ground", name: "Ground Floor", ffl: 0, ceilingHeight: D.ceilingHeight },
  first: { id: "first", name: "First Floor", ffl: D.floorToFloor, ceilingHeight: D.ceilingHeight },
};

export const ROOF_TOP = LEVELS.first.ffl + D.ceilingHeight + D.slabThickness;

/** Outer-face footprint (L-shape: left block is set back at the rear). */
export const FOOTPRINT: PlanPoint[] = [
  { x: GRID.x.left, z: GRID.z.front },
  { x: GRID.x.right, z: GRID.z.front },
  { x: GRID.x.right, z: GRID.z.back },
  { x: GRID.x.split, z: GRID.z.back },
  { x: GRID.x.split, z: GRID.z.leftRear },
  { x: GRID.x.left, z: GRID.z.leftRear },
];

/** Double-height void over the living room: L-shaped around the first-floor walkway. */
export const VOID_RECTS: PlanRect[] = [
  { x0: GRID.walkway.x0, x1: GRID.x.split, z0: GRID.z.front, z1: GRID.walkway.z0 },
  { x0: GRID.x.left, x1: GRID.walkway.x0, z0: GRID.z.front, z1: GRID.bedroomTwoFront },
];

/** Balcony outside the first-floor front wall, the width of the sitting area. */
export const BALCONY_RECT: PlanRect = {
  x0: GRID.x.split,
  x1: GRID.x.right,
  z0: GRID.z.front - GRID.balconyDepth,
  z1: GRID.z.front,
};

/** Clear stair well between the wet strip and the living room, open through the first-floor slab. */
export const STAIR_OPENING: PlanRect = {
  x0: GRID.x.split + D.interiorWall / 2,
  x1: GRID.wet - D.interiorWall / 2,
  z0: GRID.z.band1 + D.interiorWall / 2,
  z1: GRID.z.band2 - D.interiorWall / 2,
};
