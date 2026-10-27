import type { PlanRect } from "@/types/architecture";
import { DIMENSIONS, GRID } from "./dimensions";
import { PLOT_BOUNDS, SITE_PLAN } from "./plot";

/**
 * Site elements outside the building, styled after the owner's reference
 * photo (R9): a covered entrance porch on stone-clad pillars, wide steps,
 * long stone planters across the facade, a lit path, and the paved open area
 * behind the dining room and kitchen (R2). Plan coordinates; negative z is in
 * front of the house.
 */

const D = DIMENSIONS;
/** Plinth overhang beyond the outer wall face (matches the plinth slab offset). */
export const PLINTH_OVERHANG = 0.05;
export const GROUND_LEVEL = -D.plinthHeight;

/** Covered porch at floor level in front of the main door (plan x 4.2–5.2). */
export const PORCH: PlanRect = { x0: 3.55, x1: 5.85, z0: -1.3, z1: -PLINTH_OVERHANG };

/** Entrance steps down from the porch, full porch width. */
export const ENTRANCE_STEPS = { x0: PORCH.x0, x1: PORCH.x1, risers: 3, going: 0.3 } as const;
export const STEP_RISER = D.plinthHeight / ENTRANCE_STEPS.risers;

export interface StepTread {
  rect: PlanRect;
  /** Top of the tread (world Y). */
  top: number;
}

/** Treads between the porch (top 0) and the ground, stepping down away from the door. */
export const STEP_TREADS: StepTread[] = Array.from({ length: ENTRANCE_STEPS.risers - 1 }, (_, i) => {
  const z1 = PORCH.z0 - i * ENTRANCE_STEPS.going;
  return {
    rect: { x0: ENTRANCE_STEPS.x0, x1: ENTRANCE_STEPS.x1, z0: z1 - ENTRANCE_STEPS.going, z1 },
    top: -(i + 1) * STEP_RISER,
  };
});

/** Where the steps meet the path. */
export const STEPS_FOOT_Z = PORCH.z0 - (ENTRANCE_STEPS.risers - 1) * ENTRANCE_STEPS.going;

/** Stone-clad porch pillars at the porch's front corners. */
const PILLAR = 0.38;
export const PILLARS: PlanRect[] = [
  { x0: PORCH.x0, x1: PORCH.x0 + PILLAR, z0: PORCH.z0, z1: PORCH.z0 + PILLAR },
  { x0: PORCH.x1 - PILLAR, x1: PORCH.x1, z0: PORCH.z0, z1: PORCH.z0 + PILLAR },
];

/** Porch canopy: underside height, thickness and overhang beyond the pillars. */
export const CANOPY = { bottom: 2.85, thickness: 0.25, overhang: 0.2 } as const;

const PLANTER_GAP = 0.15;
const PLANTER_DEPTH = 0.95;

/** Long raised stone planters across the facade either side of the porch. */
export const PLANTERS: { rect: PlanRect; height: number }[] = [
  {
    rect: { x0: GRID.x.left + PLINTH_OVERHANG, x1: PORCH.x0 - PLANTER_GAP, z0: -PLINTH_OVERHANG - PLANTER_DEPTH, z1: -PLINTH_OVERHANG },
    height: 0.6,
  },
  {
    rect: { x0: PORCH.x1 + PLANTER_GAP, x1: GRID.x.right - PLINTH_OVERHANG, z0: -PLINTH_OVERHANG - PLANTER_DEPTH, z1: -PLINTH_OVERHANG },
    height: 0.6,
  },
];

/** Compound wall thickness (the plot outline is its outer face). */
export const BOUNDARY_WALL = { thickness: 0.23, height: 1.8, frontHeight: 1.2 } as const;

/** Entrance path from the foot of the steps to the pedestrian gate in the front wall, bollards along both edges. */
export const PATH = {
  x0: PORCH.x0 + 0.15,
  x1: PORCH.x1 - 0.15,
  length: STEPS_FOOT_Z - (PLOT_BOUNDS.z0 + BOUNDARY_WALL.thickness),
} as const;
const BOLLARD_SPACING = 2.4;
export const BOLLARDS: { x: number; z: number }[] = Array.from({ length: Math.floor((PATH.length - 1) / BOLLARD_SPACING) }, (_, i) => [
  { x: PATH.x0 - 0.35, z: STEPS_FOOT_Z - 1.2 - i * BOLLARD_SPACING },
  { x: PATH.x1 + 0.35, z: STEPS_FOOT_Z - 1.2 - i * BOLLARD_SPACING },
]).flat();

/**
 * Driveway from the vehicle gate up the left of the house to the parking
 * beside it (R11), clear of the left planter and a planting strip along the
 * west wall.
 */
export const DRIVEWAY: PlanRect = { x0: GRID.x.left - 5, x1: GRID.x.left - 1, z0: PLOT_BOUNDS.z0 + BOUNDARY_WALL.thickness, z1: 7 };

/** Openings in the front wall: a sliding vehicle gate at the driveway and a pedestrian gate at the path. */
export const GATES = {
  vehicle: { x0: DRIVEWAY.x0, x1: DRIVEWAY.x1 },
  pedestrian: { x0: PATH.x0 - 0.25, x1: PATH.x1 + 0.25 },
} as const;

/** Paved open area in the footprint's rear notch, one step below the house floor. */
export const REAR_PATIO = {
  rect: { x0: GRID.x.left, x1: GRID.x.split, z0: GRID.z.leftRear, z1: GRID.z.back },
  top: -STEP_RISER,
} as const;

/**
 * Attached pool and gym across the back of the house (R11), on a deck level
 * with the rear patio: the pool deck behind the dining room and kitchen, the
 * open-air gym behind Bedroom 1. The pool is sunk into the ground.
 */
const BACK_ZONE = { z0: GRID.z.back, z1: GRID.z.back + SITE_PLAN.poolGymDepth };
export const POOL_DECK: PlanRect = { x0: GRID.x.left - 1.5, x1: 4.5, ...BACK_ZONE };
export const POOL: PlanRect = { x0: -0.9, x1: 3.9, z0: 12.1, z1: 14.4 };
export const POOL_DEPTH = 1.4;
export const GYM: PlanRect = { x0: POOL_DECK.x1, x1: GRID.x.right, ...BACK_ZONE };
export const DECK_TOP = REAR_PATIO.top;
/** Low walls closing the gym's back and right sides (rendered plaster, height above the deck). */
const GYM_WALL = 0.2;
export const GYM_WALLS: { rect: PlanRect; height: number }[] = [
  { rect: { x0: GYM.x0, x1: GYM.x1, z0: GYM.z1 - GYM_WALL, z1: GYM.z1 }, height: 1.0 },
  { rect: { x0: GYM.x1 - GYM_WALL, x1: GYM.x1, z0: GYM.z0, z1: GYM.z1 - GYM_WALL }, height: 1.0 },
];
