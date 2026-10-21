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
  plinthHeight: 0.3,
  parapetHeight: 0.9,
};

const D = DIMENSIONS;

/** Planning grid. Exterior lines are outer faces; interior lines are partition centrelines. */
export const GRID = {
  x: { left: 0, split: 3.5, kitchen: 6.5, right: D.overallWidth },
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
    /** Rear wall of the right block (derived: kitchen depth 3.0 from band2). */
    rightRear: 8.5,
    back: D.overallDepth,
  },
  /** Stair / landing split on the left column. */
  stairEast: 2.0,
  /** Landing nib projecting into the void (user-approved addition, conflict C7). */
  nib: { x1: 4.6, z0: 4.4 },
} as const;

export const LEVELS: Record<FloorId, FloorLevel> = {
  ground: { id: "ground", name: "Ground Floor", ffl: 0, ceilingHeight: D.ceilingHeight },
  first: { id: "first", name: "First Floor", ffl: D.floorToFloor, ceilingHeight: D.ceilingHeight },
};

export const ROOF_TOP = LEVELS.first.ffl + D.ceilingHeight + D.slabThickness;

/** Outer-face footprint (L-shape: right block is set back at the rear). */
export const FOOTPRINT: PlanPoint[] = [
  { x: GRID.x.left, z: GRID.z.front },
  { x: GRID.x.right, z: GRID.z.front },
  { x: GRID.x.right, z: GRID.z.rightRear },
  { x: GRID.x.split, z: GRID.z.rightRear },
  { x: GRID.x.split, z: GRID.z.back },
  { x: GRID.x.left, z: GRID.z.back },
];

/** Double-height void over the living room, excluding the landing nib. */
export const VOID_OUTLINE: PlanPoint[] = [
  { x: GRID.x.split, z: GRID.z.front },
  { x: GRID.x.right, z: GRID.z.front },
  { x: GRID.x.right, z: GRID.z.band2 },
  { x: GRID.nib.x1, z: GRID.z.band2 },
  { x: GRID.nib.x1, z: GRID.nib.z0 },
  { x: GRID.x.split, z: GRID.nib.z0 },
];

/** Clear stair well (inner wall faces), open through the first-floor slab. */
export const STAIR_OPENING: PlanRect = {
  x0: GRID.x.left + D.exteriorWall,
  x1: GRID.stairEast,
  z0: GRID.z.band1 + D.interiorWall / 2,
  z1: GRID.z.band2 - D.interiorWall / 2,
};
