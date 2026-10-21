import type { PlanRect } from "@/types/architecture";
import { DIMENSIONS, GRID } from "./dimensions";

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

/** Covered porch at floor level in front of the main door (plan x 3.8–4.8). */
export const PORCH: PlanRect = { x0: 3.15, x1: 5.45, z0: -1.3, z1: -PLINTH_OVERHANG };

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

/** Entrance path from the foot of the steps, with bollard lights along both edges. */
export const PATH = { x0: PORCH.x0 + 0.15, x1: PORCH.x1 - 0.15, length: 7 } as const;
export const BOLLARDS: { x: number; z: number }[] = [-1.2, -3.6, -6.0].flatMap((dz) => [
  { x: PATH.x0 - 0.35, z: STEPS_FOOT_Z + dz },
  { x: PATH.x1 + 0.35, z: STEPS_FOOT_Z + dz },
]);

/** Paved open area in the footprint's rear notch, one step below the house floor. */
export const REAR_PATIO = {
  rect: { x0: GRID.x.split, x1: GRID.x.right, z0: GRID.z.rightRear, z1: GRID.z.back },
  top: -STEP_RISER,
} as const;
