import type { Room } from "@/types/architecture";
import { BALCONY_RECT, GRID, VOID_RECTS } from "./dimensions";

const { x, z, wet, gfToiletNorth, ffToiletSouth, bedroomTwoFront, bath, walkway } = GRID;

/**
 * Rooms as nominal grid rectangles (partition centrelines / exterior outer faces).
 *
 * The left column's 1.5 m "wet strip" (x 0–1.5) stacks the plumbing: the common
 * toilet and both Bedroom 1 toilets sit on the west wall, with the stair beside it.
 */
export const ROOMS: Room[] = [
  // ── Ground floor ──────────────────────────────────────────────
  {
    id: "gf-bedroom-1",
    floor: "ground",
    name: "Bedroom 1",
    kind: "bedroom",
    rects: [
      { x0: wet, x1: x.split, z0: z.band2, z1: gfToiletNorth },
      { x0: x.left, x1: x.split, z0: gfToiletNorth, z1: z.back },
    ],
    drawingLabel: "3.5 m × 4.5 m",
    notes: ["L-shaped: the attached toilet takes the front-left corner (R6)."],
  },
  {
    id: "gf-attached-toilet",
    floor: "ground",
    name: "Attached Toilet",
    kind: "toilet",
    rects: [{ x0: x.left, x1: wet, z0: z.band2, z1: gfToiletNorth }],
    drawingLabel: "2.0 m × 1.5 m",
    notes: ["Front-left corner of Bedroom 1, back to back with the common toilet (R6)."],
  },
  {
    id: "gf-dining",
    floor: "ground",
    name: "Dining Area",
    kind: "dining",
    rects: [{ x0: x.split, x1: x.kitchen, z0: z.band2, z1: z.rightRear }],
    drawingLabel: "3.5 m × 3.0 m",
    notes: [
      "Only 3.0 m available between Bedroom 1 and the kitchen; open to living (C5).",
      "No wall to the kitchen: a breakfast table marks the edge (R5).",
      "Sliding grille door at the back opens onto the rear open area (R2).",
    ],
  },
  {
    id: "gf-kitchen",
    floor: "ground",
    name: "Kitchen",
    kind: "kitchen",
    rects: [{ x0: x.kitchen, x1: x.right, z0: z.band2, z1: z.rightRear }],
    drawingLabel: "2.5 m × 3.0 m",
    notes: ["Open to the dining area across a breakfast table (R5)."],
  },
  {
    id: "gf-common-toilet",
    floor: "ground",
    name: "Common Toilet",
    kind: "toilet",
    rects: [{ x0: x.left, x1: wet, z0: z.band1, z1: z.band2 }],
    drawingLabel: "1.5 m × 2.5 m",
    notes: ["Door from Bedroom 2's back-left corner (R6)."],
  },
  {
    id: "gf-stair",
    floor: "ground",
    name: "Staircase",
    kind: "stair",
    rects: [{ x0: wet, x1: x.split, z0: z.band1, z1: z.band2 }],
    notes: ["Rises from the living room and arrives in the first-floor sitting area (R6)."],
  },
  {
    id: "gf-bedroom-2",
    floor: "ground",
    name: "Bedroom 2",
    kind: "bedroom",
    rects: [{ x0: x.left, x1: x.split, z0: z.front, z1: z.band1 }],
    drawingLabel: "3.5 m × 3.0 m",
    notes: ["Has the door to the common toilet in its back-left corner (R6)."],
  },
  {
    id: "gf-living",
    floor: "ground",
    name: "Living Area",
    kind: "living",
    rects: [{ x0: x.split, x1: x.right, z0: z.front, z1: z.band2 }],
    drawingLabel: "5.5 m × 5.5 m",
    notes: [
      "Double height except under the first-floor walkway and the front 1.0 m of Bedroom 2 (R3, R7).",
      "The stair starts from this room.",
    ],
  },

  // ── First floor ───────────────────────────────────────────────
  {
    id: "ff-bedroom-1",
    floor: "first",
    name: "Bedroom 1",
    kind: "bedroom",
    rects: [
      { x0: x.left, x1: x.split, z0: z.band2, z1: ffToiletSouth },
      { x0: wet, x1: x.split, z0: ffToiletSouth, z1: z.back },
    ],
    drawingLabel: "3.5 m × 4.5 m",
    notes: ["L-shaped: the attached toilet takes the back-left corner, on the same wall as the toilets below (R6)."],
  },
  {
    id: "ff-attached-toilet",
    floor: "first",
    name: "Attached Toilet",
    kind: "toilet",
    rects: [{ x0: x.left, x1: wet, z0: ffToiletSouth, z1: z.back }],
    drawingLabel: "2.0 m × 1.5 m",
  },
  {
    id: "ff-bedroom-2",
    floor: "first",
    name: "Bedroom 2",
    kind: "bedroom",
    rects: [
      { x0: x.split, x1: bath.x0, z0: bedroomTwoFront, z1: z.rightRear },
      { x0: bath.x0, x1: x.right, z0: bedroomTwoFront, z1: bath.z0 },
    ],
    drawingLabel: "5.5 m × 3.0 m",
    brief: { label: "5.5 m × 4.0 m", includes: ["ff-bathroom"] },
    notes: [
      "Owner revision: enlarged to 5.5 × 4.0 m by extending 1 m over the living room (R3).",
      "Includes its own 1.5 × 2.0 m bathroom over the kitchen (R4).",
      "Entered from the walkway along the void (R7).",
    ],
  },
  {
    id: "ff-bathroom",
    floor: "first",
    name: "Bedroom 2 Bathroom",
    kind: "toilet",
    rects: [{ x0: bath.x0, x1: x.right, z0: bath.z0, z1: z.rightRear }],
    notes: ["Owner revision (R4). Above the kitchen, so the plumbing stacks over it."],
  },
  {
    id: "ff-stair",
    floor: "first",
    name: "Staircase",
    kind: "stair",
    rects: [{ x0: wet, x1: x.split, z0: z.band1, z1: z.band2 }],
  },
  {
    id: "ff-landing",
    floor: "first",
    name: "Landing",
    kind: "circulation",
    rects: [{ x0: x.left, x1: wet, z0: z.band1, z1: z.band2 }],
    notes: ["Passage from the sitting area to Bedroom 1, over the common toilet."],
  },
  {
    id: "ff-sitting",
    floor: "first",
    name: "Mini Sitting Area",
    kind: "sitting",
    rects: [{ x0: x.left, x1: x.split, z0: z.front, z1: z.band1 }],
    drawingLabel: "3.5 m × 3.0 m",
    notes: [
      "Open on the right (to the void, glass railing) and at the back (to the stair and landing) (R8).",
      "Sliding glass doors to the front balcony (R8).",
    ],
  },
  {
    id: "ff-walkway",
    floor: "first",
    name: "Walkway",
    kind: "circulation",
    rects: [{ x0: x.split, x1: walkway.x1, z0: walkway.z0, z1: bedroomTwoFront }],
    notes: ["1.0 m walkway along the void with glass railings, from the sitting area to Bedroom 2 (R7)."],
  },
  {
    id: "ff-void",
    floor: "first",
    name: "Open to Below",
    kind: "void",
    rects: VOID_RECTS,
    drawingLabel: "Double height",
    notes: ["No slab: this part of the living room is open to the roof."],
  },
  {
    id: "ff-balcony",
    floor: "first",
    name: "Balcony",
    kind: "balcony",
    rects: [BALCONY_RECT],
    notes: ["Cantilevered 1.2 m beyond the front wall, glass railing, timber soffit above (R8)."],
  },
];
