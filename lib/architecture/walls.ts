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
const { x, z, stairEast, nib } = GRID;
const TE = D.exteriorWall;
const TI = D.interiorWall;
const HE = TE / 2;
const HI = TI / 2;

const GF_EXT_HEIGHT = D.floorToFloor;
/** First-floor exterior walls rise through the roof slab to the parapet top. */
const FF_EXT_HEIGHT = D.ceilingHeight + D.slabThickness + D.parapetHeight;
const KITCHEN_SILL = 1.05;
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

type ExteriorOpenings = Record<
  "front" | "west" | "backLeft" | "step" | "rearRight" | "east",
  Opening[]
>;

function exteriorWalls(floor: FloorId, height: number, o: ExteriorOpenings): Wall[] {
  const p = floor === "ground" ? "gf" : "ff";
  const base = { floor, kind: "exterior" as const, thickness: TE, height };
  return [
    { ...base, id: `${p}-ext-front`, axis: "x", at: z.front + HE, from: x.left, to: x.right, openings: o.front },
    { ...base, id: `${p}-ext-west`, axis: "z", at: x.left + HE, from: z.front + TE, to: z.back - TE, openings: o.west },
    { ...base, id: `${p}-ext-back-left`, axis: "x", at: z.back - HE, from: x.left, to: x.split + HE, openings: o.backLeft },
    { ...base, id: `${p}-ext-step`, axis: "z", at: x.split, from: z.rightRear, to: z.back - TE, openings: o.step },
    { ...base, id: `${p}-ext-rear-right`, axis: "x", at: z.rightRear - HE, from: x.split - HE, to: x.right, openings: o.rearRight },
    { ...base, id: `${p}-ext-east`, axis: "z", at: x.right - HE, from: z.front + TE, to: z.rightRear - TE, openings: o.east },
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

/** Stair window sits above the stair's west flight (treads reach ≈ 1.8 m there). */
const STAIR_WINDOW_SILL = { ground: 2.0, first: D.windowSill } as const;
const STAIR_WINDOW_HEAD = { ground: 2.8, first: D.windowHead } as const;

/** Walls shared by both floors at the same plan position (Bedroom 1 + attached toilet). */
function bedroomOneWalls(floor: FloorId): Wall[] {
  const p = floor === "ground" ? "gf" : "ff";
  return [
    interior(floor, `${p}-toilet-west`, "z", stairEast, z.toilet - HI, z.back - TE),
    interior(floor, `${p}-toilet-south`, "x", z.toilet, stairEast - HI, x.split - HI, [
      // Hinged on the west jamb so the open leaf clears the basin on the east wall.
      door(`${p}-toilet-door`, 2.6, 3.3, "start", 1),
    ]),
  ];
}

const GROUND_WALLS: Wall[] = [
  ...exteriorWalls("ground", GF_EXT_HEIGHT, {
    front: [
      win("gf-w-bed2-front", 0.9, 2.1),
      door("gf-d-entrance", 3.8, 4.8, "start", 1, "Main entrance"),
      win("gf-w-living-front", 5.6, 7.6),
    ],
    west: [
      win("gf-w-bed2-side", 1.4, 2.4),
      opening("gf-w-stair", "window", 3.8, 4.6, STAIR_WINDOW_SILL.ground, STAIR_WINDOW_HEAD.ground),
      win("gf-w-bed1-side", 7.4, 8.6),
    ],
    backLeft: [win("gf-w-bed1-rear", 0.6, 1.8), opening("gf-v-toilet", "vent", 2.4, 3.0)],
    step: [],
    rearRight: [win("gf-w-dining-rear", 4.6, 5.4), win("gf-w-kitchen-rear", 7.4, 8.2, KITCHEN_SILL)],
    east: [
      win("gf-w-living-side-1", 0.8, 2.0),
      win("gf-w-living-side-2", 4.2, 5.2),
      win("gf-w-kitchen-side", 7.3, 8.0, KITCHEN_SILL),
    ],
  }),
  ...bedroomOneWalls("ground"),
  interior("ground", "gf-bed1-south", "x", z.band2, x.left + TE, x.split + HI),
  interior("ground", "gf-bed1-east", "z", x.split, z.band2 - HI, z.rightRear - TE, [
    door("gf-d-bed1", 6.0, 6.9, "end", -1),
  ]),
  interior("ground", "gf-ct-west", "z", stairEast, z.lobby - HI, z.band2 - HI),
  interior("ground", "gf-ct-south", "x", z.lobby, stairEast - HI, x.split - HI, [
    door("gf-d-common-toilet", 2.6, 3.3, "end", 1),
  ]),
  interior("ground", "gf-ct-east", "z", x.split, z.lobby - HI, z.band2 - HI),
  interior("ground", "gf-bed2-north", "x", z.band1, x.left + TE, x.split + HI),
  interior("ground", "gf-bed2-east", "z", x.split, z.front + TE, z.band1 - HI, [
    door("gf-d-bed2", 1.9, 2.8, "end", -1),
  ]),
  interior("ground", "gf-kitchen-west", "z", x.kitchen, z.band2 + HI, z.rightRear - TE, [
    door("gf-d-kitchen", 5.8, 6.7, "start", 1),
  ]),
  interior("ground", "gf-kitchen-south", "x", z.band2, x.kitchen - HI, x.right - TE),
];

const FIRST_WALLS: Wall[] = [
  ...exteriorWalls("first", FF_EXT_HEIGHT, {
    front: [win("ff-w-sitting-front", 0.9, 2.1), win("ff-w-void-front", 5.6, 7.6)],
    west: [
      win("ff-w-sitting-side", 1.4, 2.4),
      opening("ff-w-stair", "window", 3.8, 4.6, STAIR_WINDOW_SILL.first, STAIR_WINDOW_HEAD.first),
      win("ff-w-bed1-side", 7.4, 8.6),
    ],
    backLeft: [win("ff-w-bed1-rear", 0.6, 1.8), opening("ff-v-toilet", "vent", 2.4, 3.0)],
    step: [],
    rearRight: [win("ff-w-bed2-rear-1", 4.6, 5.6), win("ff-w-bed2-rear-2", 6.9, 7.9)],
    east: [
      win("ff-w-void-side-1", 0.8, 2.0),
      win("ff-w-void-side-2", 4.2, 5.2),
      win("ff-w-bed2-side", 6.6, 7.6),
    ],
  }),
  ...bedroomOneWalls("first"),
  interior("first", "ff-bed1-south", "x", z.band2, x.left + TE, x.split + HI, [
    door("ff-d-bed1", 2.5, 3.4, "end", 1),
  ]),
  interior("first", "ff-bed1-east", "z", x.split, z.band2 - HI, z.rightRear - TE),
  interior("first", "ff-bed2-south", "x", z.band2, x.split + HI, x.right - TE, [
    door("ff-d-bed2", x.split + 0.15, nib.x1 - 0.1, "start", 1),
  ]),
  interior("first", "ff-sitting-north", "x", z.band1, x.left + TE, x.split + HI, [
    door("ff-d-sitting", 2.5, 3.4, "end", -1),
  ]),
  interior("first", "ff-sitting-east", "z", x.split, z.front + TE, z.band1 - HI),
];

export const WALLS: Wall[] = [...GROUND_WALLS, ...FIRST_WALLS];
