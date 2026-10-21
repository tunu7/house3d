import type { Room } from "@/types/architecture";
import { GRID } from "./dimensions";

const { x, z, stairEast, nib } = GRID;

/** Rooms as nominal grid rectangles (partition centrelines / exterior outer faces). */
export const ROOMS: Room[] = [
  // ── Ground floor ──────────────────────────────────────────────
  {
    id: "gf-bedroom-1",
    floor: "ground",
    name: "Bedroom 1",
    kind: "bedroom",
    rects: [
      { x0: x.left, x1: x.split, z0: z.band2, z1: z.toilet },
      { x0: x.left, x1: stairEast, z0: z.toilet, z1: z.back },
    ],
    drawingLabel: "3.5 m × 4.5 m",
    notes: ["L-shaped: the attached toilet occupies the rear-right corner (C3)."],
  },
  {
    id: "gf-attached-toilet",
    floor: "ground",
    name: "Attached Toilet",
    kind: "toilet",
    rects: [{ x0: stairEast, x1: x.split, z0: z.toilet, z1: z.back }],
    drawingLabel: "2.0 m × 1.5 m",
    notes: ["Drawn 1.5 m wide × 2.0 m deep; drawn shape followed (C4)."],
  },
  {
    id: "gf-dining",
    floor: "ground",
    name: "Dining Area",
    kind: "dining",
    rects: [{ x0: x.split, x1: x.kitchen, z0: z.band2, z1: z.rightRear }],
    drawingLabel: "3.5 m × 3.0 m",
    notes: ["Only 3.0 m available between Bedroom 1 and the kitchen; open to living (C5)."],
  },
  {
    id: "gf-kitchen",
    floor: "ground",
    name: "Kitchen",
    kind: "kitchen",
    rects: [{ x0: x.kitchen, x1: x.right, z0: z.band2, z1: z.rightRear }],
    drawingLabel: "2.5 m × 3.0 m",
  },
  {
    id: "gf-stair",
    floor: "ground",
    name: "Staircase",
    kind: "stair",
    rects: [{ x0: x.left, x1: stairEast, z0: z.band1, z1: z.band2 }],
    notes: ["Moved to stack with the first-floor stair (C6)."],
  },
  {
    id: "gf-lobby",
    floor: "ground",
    name: "Stair Lobby",
    kind: "circulation",
    rects: [{ x0: stairEast, x1: x.split, z0: z.band1, z1: z.lobby }],
    notes: ["Added to reach the stair foot from the living area (C6)."],
  },
  {
    id: "gf-common-toilet",
    floor: "ground",
    name: "Common Toilet",
    kind: "toilet",
    rects: [{ x0: stairEast, x1: x.split, z0: z.lobby, z1: z.band2 }],
    drawingLabel: "1.5 m × 2.5 m",
    notes: [
      "Reduced to 1.5 × 1.5 m and relocated to stack the stair (C6).",
      "No exterior wall: mechanical exhaust required.",
    ],
  },
  {
    id: "gf-bedroom-2",
    floor: "ground",
    name: "Bedroom 2",
    kind: "bedroom",
    rects: [{ x0: x.left, x1: x.split, z0: z.front, z1: z.band1 }],
    drawingLabel: "3.5 m × 3.0 m",
  },
  {
    id: "gf-living",
    floor: "ground",
    name: "Living Area",
    kind: "living",
    rects: [{ x0: x.split, x1: x.right, z0: z.front, z1: z.band2 }],
    drawingLabel: "5.5 m × 5.5 m",
    notes: ["Double height: open to the first floor above."],
  },

  // ── First floor ───────────────────────────────────────────────
  {
    id: "ff-bedroom-1",
    floor: "first",
    name: "Bedroom 1",
    kind: "bedroom",
    rects: [
      { x0: x.left, x1: x.split, z0: z.band2, z1: z.toilet },
      { x0: x.left, x1: stairEast, z0: z.toilet, z1: z.back },
    ],
    drawingLabel: "3.5 m × 4.5 m",
    notes: ["L-shaped: the attached toilet occupies the rear-right corner (C3)."],
  },
  {
    id: "ff-attached-toilet",
    floor: "first",
    name: "Attached Toilet",
    kind: "toilet",
    rects: [{ x0: stairEast, x1: x.split, z0: z.toilet, z1: z.back }],
    drawingLabel: "2.0 m × 1.5 m",
    notes: ["Drawn 1.5 m wide × 2.0 m deep; drawn shape followed (C4)."],
  },
  {
    id: "ff-bedroom-2",
    floor: "first",
    name: "Bedroom 2",
    kind: "bedroom",
    rects: [{ x0: x.split, x1: x.right, z0: z.band2, z1: z.rightRear }],
    drawingLabel: "5.5 m × 3.0 m",
  },
  {
    id: "ff-stair",
    floor: "first",
    name: "Staircase",
    kind: "stair",
    rects: [{ x0: x.left, x1: stairEast, z0: z.band1, z1: z.band2 }],
  },
  {
    id: "ff-landing",
    floor: "first",
    name: "Landing",
    kind: "circulation",
    rects: [
      { x0: stairEast, x1: x.split, z0: z.band1, z1: z.band2 },
      { x0: x.split, x1: nib.x1, z0: nib.z0, z1: z.band2 },
    ],
    notes: ["Includes a 1.1 × 1.1 m nib into the void for Bedroom 2 access (C7)."],
  },
  {
    id: "ff-sitting",
    floor: "first",
    name: "Mini Sitting Area",
    kind: "sitting",
    rects: [{ x0: x.left, x1: x.split, z0: z.front, z1: z.band1 }],
    drawingLabel: "3.5 m × 3.0 m",
  },
  {
    id: "ff-void",
    floor: "first",
    name: "Open to Below",
    kind: "void",
    rects: [
      { x0: x.split, x1: x.right, z0: z.front, z1: nib.z0 },
      { x0: nib.x1, x1: x.right, z0: nib.z0, z1: z.band2 },
    ],
    drawingLabel: "Double height",
    notes: ["No slab: the living area is open to the roof."],
  },
];
