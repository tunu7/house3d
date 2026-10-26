import type { FloorId, Opening, OpeningKind, Wall } from "@/types/architecture";
import { DIMENSIONS, GRID } from "./dimensions";

/**
 * Walls are defined by centreline. Exterior walls sit inside the outer-face
 * footprint (centreline offset by half thickness); interior partitions are
 * centred on grid lines. Front/back walls run the full outer length and side
 * walls stop at their inner faces, so corners never overlap coplanar faces.
 *
 * Opening positions are scaled from the reference drawing, which does not
 * dimension them — treat them as approximate.
 */

const D = DIMENSIONS;
const { x, z, wet, gfToiletNorth, ffToiletSouth, bedroomTwoFront, bath, walkway } = GRID;
const TE = D.exteriorWall;
const TI = D.interiorWall;
const HE = TE / 2;
const HI = TI / 2;

const GF_EXT_HEIGHT = D.floorToFloor;
/** First-floor exterior walls rise through the roof slab to the parapet top. */
const FF_EXT_HEIGHT = D.ceilingHeight + D.slabThickness + D.parapetHeight;
const KITCHEN_SILL = 1.05;
/** Clerestory sill for windows behind a bed headboard: light and air without a window at pillow height. */
const CLERESTORY_SILL = 1.5;
const VENT_SILL = 1.6;

/**
 * Door opening. `swing` is the side of the wall the leaf opens to (+1 toward
 * increasing plan coordinate on the wall's fixed axis); `hinge` is the span end.
 */
const door = (
  id: string,
  from: number,
  to: number,
  hinge: "start" | "end",
  swing: 1 | -1,
  label?: string,
): Opening => ({ id, kind: "door", from, to, sill: 0, head: D.doorHeight, hinge, swing, label });

const opening = (
  id: string,
  kind: OpeningKind,
  from: number,
  to: number,
  sill: number = kind === "vent" ? VENT_SILL : D.windowSill,
  head: number = D.windowHead,
): Opening => ({ id, kind, from, to, sill, head });

const win = (id: string, from: number, to: number, sill?: number) =>
  opening(id, "window", from, to, sill);

/** Two-panel sliding door (grille or glass); no hinge or swing. Panels park over the `parked` end. */
const sliding = (
  id: string,
  from: number,
  to: number,
  panel: "grille" | "glass",
  label?: string,
  head = D.doorHeight,
  parked: "start" | "end" = "start",
): Opening => ({
  id, kind: "door", operation: "sliding", panel, from, to, sill: 0, head, label, parked,
});

type ExteriorOpenings = Record<
  "front" | "west" | "rearLeft" | "step" | "backRight" | "east",
  Opening[]
>;

function exteriorWalls(floor: FloorId, height: number, o: ExteriorOpenings): Wall[] {
  const p = floor === "ground" ? "gf" : "ff";
  const base = { floor, kind: "exterior" as const, thickness: TE, height };
  return [
    { ...base, id: `${p}-ext-front`, axis: "x", at: z.front + HE, from: x.left, to: x.right, openings: o.front },
    { ...base, id: `${p}-ext-west`, axis: "z", at: x.left + HE, from: z.front + TE, to: z.leftRear - TE, openings: o.west },
    { ...base, id: `${p}-ext-rear-left`, axis: "x", at: z.leftRear - HE, from: x.left, to: x.split + HE, openings: o.rearLeft },
    { ...base, id: `${p}-ext-step`, axis: "z", at: x.split, from: z.leftRear, to: z.back - TE, openings: o.step },
    { ...base, id: `${p}-ext-back-right`, axis: "x", at: z.back - HE, from: x.split - HE, to: x.right, openings: o.backRight },
    { ...base, id: `${p}-ext-east`, axis: "z", at: x.right - HE, from: z.front + TE, to: z.back - TE, openings: o.east },
  ];
}

function interior(
  floor: FloorId,
  id: string,
  axis: "x" | "z",
  at: number,
  from: number,
  to: number,
  openings: Opening[] = [],
): Wall {
  return { id, floor, kind: "interior", axis, at, from, to, thickness: TI, height: D.ceilingHeight, openings };
}

/** The stair entrance from the living room: the open south-west corner of the stair well. */
const STAIR_ENTRY_NORTH = z.band1 + (wet - x.split) / 2;
/** Large front glazing in the void, framed on the facade (R9). */
const VOID_GLAZING = { from: 0.7, to: 4.1, sill: 0.3, head: 2.7 } as const;

const GROUND_WALLS: Wall[] = [
  ...exteriorWalls("ground", GF_EXT_HEIGHT, {
    front: [
      win("gf-w-living-front", 0.6, 3.4),
      door("gf-d-entrance", 4.2, 5.2, "end", 1, "Main entrance"),
      win("gf-w-bed2-front", 6.1, 8.4),
    ],
    west: [
      win("gf-w-living-side-1", 0.8, 2.0),
      win("gf-w-living-side-2", 3.6, 4.8),
      win("gf-w-kitchen-side", 7.3, 8.0, KITCHEN_SILL),
    ],
    rearLeft: [
      win("gf-w-kitchen-rear", 0.8, 1.6, KITCHEN_SILL),
      // Owner revision R2: dining back door onto the rear open area.
      sliding("gf-d-dining-back", 3.1, 4.9, "grille", "Back door (sliding grille)", D.doorHeight, "end"),
    ],
    step: [],
    backRight: [win("gf-w-bed1-rear", 6.4, 8.2, CLERESTORY_SILL)],
    east: [
      win("gf-w-bed2-side", 1.2, 2.4, CLERESTORY_SILL),
      opening("gf-v-common-toilet", "vent", 4.0, 4.6),
      opening("gf-v-bed1-toilet", "vent", 6.3, 6.9),
      win("gf-w-bed1-side", 7.9, 9.1),
    ],
  }),
  // Bedroom 2 ↔ common toilet / stair. Toilet door in Bedroom 2's back-right corner (R6).
  interior("ground", "gf-bed2-north", "x", z.band1, x.split - HI, x.right - TE, [
    door("gf-d-common-toilet", 7.95, 8.65, "end", 1),
  ]),
  interior("ground", "gf-bed2-west", "z", x.split, z.front + TE, z.band1 - HI, [
    door("gf-d-bed2", 1.9, 2.8, "end", 1),
  ]),
  // Wet strip ↔ stair, and the stair's side to the living room above its entry.
  interior("ground", "gf-ct-west", "z", wet, z.band1 + HI, z.band2 - HI),
  interior("ground", "gf-stair-west", "z", x.split, STAIR_ENTRY_NORTH, z.band2 - HI),
  // Bedroom 1 front wall (shared with the common toilet and the stair).
  interior("ground", "gf-bed1-south", "x", z.band2, x.split + HI, x.right - TE),
  // Bedroom 1 toilet in the room's front-right corner (R6).
  interior("ground", "gf-toilet-west", "z", wet, z.band2 + HI, gfToiletNorth - HI, [
    door("gf-d-bed1-toilet", 6.6, 7.3, "end", 1),
  ]),
  interior("ground", "gf-toilet-north", "x", gfToiletNorth, wet - HI, x.right - TE),
  interior("ground", "gf-bed1-west", "z", x.split, z.band2 - HI, z.leftRear - TE, [
    door("gf-d-bed1", 6.0, 6.9, "end", 1),
  ]),
  // Kitchen ↔ living. No kitchen ↔ dining wall: a breakfast table marks the edge (R5).
  interior("ground", "gf-kitchen-south", "x", z.band2, x.left + TE, x.kitchen + HI),
];

const FIRST_WALLS: Wall[] = [
  ...exteriorWalls("first", FF_EXT_HEIGHT, {
    front: [
      opening("ff-w-void-front", "window", VOID_GLAZING.from, VOID_GLAZING.to, VOID_GLAZING.sill, VOID_GLAZING.head),
      // Sliding glass doors from the sitting area onto the balcony (R8).
      sliding("ff-d-balcony", 5.9, 8.6, "glass", "Balcony doors", 2.4, "end"),
    ],
    west: [
      win("ff-w-void-side-1", 0.8, 2.0),
      win("ff-w-void-side-2", 2.8, 4.0),
      win("ff-w-bed2-side", 5.0, 6.2),
    ],
    rearLeft: [
      opening("ff-v-bath", "vent", 0.4, 0.9),
      win("ff-w-bed2-rear-2", 1.8, 2.8),
      win("ff-w-bed2-rear-1", 3.6, 4.6),
    ],
    step: [],
    backRight: [win("ff-w-bed1-rear", 5.9, 7.1)],
    east: [
      win("ff-w-sitting-side", 1.0, 2.2),
      win("ff-w-landing", 3.8, 4.8),
      win("ff-w-bed1-side", 6.0, 7.4),
      opening("ff-v-toilet", "vent", 8.6, 9.2),
    ],
  }),
  // Bedroom 1 front wall: door from the landing in its front-right corner.
  interior("first", "ff-bed1-south", "x", z.band2, x.split + HI, x.right - TE, [
    door("ff-d-bed1", 7.8, 8.7, "end", 1),
  ]),
  // Bedroom 1 toilet in the room's back-right corner (R6).
  interior("first", "ff-toilet-south", "x", ffToiletSouth, wet - HI, x.right - TE, [
    door("ff-d-bed1-toilet", 7.9, 8.6, "end", 1),
  ]),
  interior("first", "ff-toilet-west", "z", wet, ffToiletSouth + HI, z.back - TE),
  // Bedroom 1 ↔ Bedroom 2.
  interior("first", "ff-bed2-east", "z", x.split, bedroomTwoFront - HI, z.leftRear - TE),
  // Bedroom 2 front wall to the void; its door opens off the walkway (R7).
  interior("first", "ff-bed2-front", "x", bedroomTwoFront, x.left + TE, x.split - HI, [
    door("ff-d-bed2", walkway.x0 + 0.1, x.split - 0.15, "end", 1),
  ]),
  interior("first", "ff-bath-east", "z", bath.x1, bath.z0 - HI, z.leftRear - TE),
  interior("first", "ff-bath-south", "x", bath.z0, x.left + TE, bath.x1 + HI, [
    door("ff-d-bath", 0.6, 1.3, "end", 1),
  ]),
  // The mini sitting area has no walls on its left or back (R8).
];

export const WALLS: Wall[] = [...GROUND_WALLS, ...FIRST_WALLS];
