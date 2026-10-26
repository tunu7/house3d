import type { Facing, FloorId, FurnitureItem, FurnitureType } from "@/types/architecture";

/**
 * Furniture and fixtures, kept separate from structure so they can be hidden
 * independently. Positions follow the reference drawing's arrangement where
 * the reconciled geometry allows; sizes are typical residential defaults.
 *
 * `x`, `z` are plan centres. `w` runs across the item's front, `d` front-to-back.
 */

type Spec = Omit<FurnitureItem, "id" | "floor" | "roomId">;

const item = (type: FurnitureType, x: number, z: number, w: number, d: number, facing: Facing, extra: Partial<Spec> = {}): Spec => ({
  type, x, z, w, d, facing, ...extra,
});

/** Expands `{ roomId: specs[] }` into items with stable ids. */
function place(floor: FloorId, rooms: Record<string, Spec[]>): FurnitureItem[] {
  return Object.entries(rooms).flatMap(([roomId, specs]) => {
    const counts: Partial<Record<FurnitureType, number>> = {};
    return specs.map((spec) => {
      const n = (counts[spec.type] = (counts[spec.type] ?? 0) + 1);
      return { id: `${roomId}-${spec.type}-${n}`, floor, roomId, ...spec };
    });
  });
}

export const FURNITURE: FurnitureItem[] = [
  ...place("ground", {
    // Bed against the back wall; wardrobe on the front wall, clear of both doors.
    "gf-bedroom-1": [
      item("rug", 7.1, 8.5, 2.0, 1.8, "-z"),
      item("bed", 7.1, 8.77, 1.6, 2.0, "-z"),
      item("nightstand", 8.4, 9.55, 0.4, 0.4, "-z"),
      item("nightstand", 5.85, 9.55, 0.4, 0.4, "-z"),
      item("wardrobe", 6.7, 5.86, 1.4, 0.6, "+z"),
    ],
    "gf-attached-toilet": [
      item("shower", 8.385, 5.95, 0.77, 0.77, "-x", { screens: ["front", "left"] }),
      item("wc", 8.445, 6.75, 0.4, 0.65, "-x"),
      item("basin", 8.45, 7.265, 0.45, 0.35, "-z"),
    ],
    "gf-common-toilet": [
      item("shower", 8.385, 5.055, 0.77, 0.77, "-z", { screens: ["front", "left"] }),
      item("wc", 7.885, 3.85, 0.4, 0.65, "+x"),
      item("basin", 8.595, 4.3, 0.45, 0.35, "-x"),
    ],
    "gf-dining": [
      item("diningTable", 4.0, 7.0, 1.6, 0.9, "-z"),
      ...[3.5, 4.0, 4.5].flatMap((x) => [
        item("chair", x, 6.25, 0.45, 0.45, "+z"),
        item("chair", x, 7.75, 0.45, 0.45, "-z"),
      ]),
      item("console", 5.24, 7.6, 1.0, 0.4, "-x"),
      item("art", 5.425, 7.6, 0.8, 0.03, "-x", { elevation: 1.3, height: 0.7 }),
      // Stools at the breakfast table that replaces the kitchen wall (R5).
      item("stool", 2.75, 6.1, 0.35, 0.35, "-x"),
      item("stool", 2.75, 6.8, 0.35, 0.35, "-x"),
      item("plant", 2.82, 8.0, 0.4, 0.4, "-z"),
    ],
    "gf-kitchen": [
      item("barTable", 2.15, 6.45, 1.3, 0.5, "+x"),
      item("counter", 1.335, 7.97, 2.21, 0.6, "-z", { sinkAt: -0.135 }),
      item("counter", 0.53, 6.935, 1.47, 0.6, "+x", { hobAt: -0.035 }),
      item("fridge", 0.58, 5.88, 0.64, 0.7, "+x"),
      item("hood", 0.455, 6.9, 0.7, 0.45, "+x", { elevation: 1.6 }),
      item("upperCabinet", 2.07, 8.095, 0.74, 0.35, "-z", { elevation: 1.5, height: 0.7 }),
    ],
    // One nightstand only: the back-right corner is the way to the common toilet (R6).
    "gf-bedroom-2": [
      item("rug", 7.7, 1.45, 1.8, 2.0, "-x"),
      item("bed", 7.77, 1.45, 1.5, 2.0, "-x"),
      item("nightstand", 8.57, 0.45, 0.4, 0.4, "-x"),
      item("wardrobe", 5.86, 0.9, 1.2, 0.6, "+x"),
    ],
    "gf-living": [
      item("rug", 2.5, 3.0, 3.4, 2.8, "-z"),
      item("sofa", 2.5, 4.4, 2.6, 0.9, "-z"),
      item("sofa", 4.15, 2.9, 1.6, 0.85, "-x"),
      item("coffeeTable", 2.5, 3.0, 1.1, 0.6, "-z"),
      item("armchair", 3.0, 1.5, 0.8, 0.8, "+z"),
      item("armchair", 2.0, 1.5, 0.8, 0.8, "+z"),
      item("floorLamp", 0.85, 4.4, 0.4, 0.4, "-z"),
      item("sideTable", 4.2, 4.3, 0.45, 0.45, "-z"),
      item("art", 5.425, 1.0, 1.0, 0.03, "-x", { elevation: 1.25, height: 0.8 }),
      item("plant", 0.55, 0.55, 0.45, 0.45, "-z"),
      item("plant", 0.55, 5.15, 0.45, 0.45, "-z"),
    ],
  }),
  ...place("first", {
    // Bed against the shared wall with Bedroom 2; wardrobe at the back.
    "ff-bedroom-1": [
      item("rug", 6.8, 7.0, 1.8, 2.2, "+x"),
      item("bed", 6.56, 7.0, 1.6, 2.0, "+x"),
      item("art", 5.575, 7.0, 1.0, 0.03, "+x", { elevation: 1.35, height: 0.7 }),
      item("nightstand", 5.76, 5.8, 0.4, 0.4, "+x"),
      item("wardrobe", 6.55, 9.47, 1.6, 0.6, "-z"),
    ],
    "ff-attached-toilet": [
      item("shower", 8.385, 9.38, 0.77, 0.77, "-z", { screens: ["front", "left"] }),
      item("wc", 7.885, 8.45, 0.4, 0.65, "+x"),
      item("basin", 7.735, 9.2, 0.45, 0.35, "+x"),
    ],
    // Revised 5.5 × 4.0 m room: bed against the Bedroom 1 wall, wardrobe on the
    // void-side wall, reading chair in the alcove beside the bathroom.
    "ff-bedroom-2": [
      item("rug", 4.0, 6.95, 2.4, 2.2, "-z"),
      item("bed", 4.39, 6.95, 1.8, 2.1, "-x"),
      item("art", 5.425, 6.95, 1.2, 0.03, "-x", { elevation: 1.35, height: 0.7 }),
      item("nightstand", 5.24, 5.8, 0.4, 0.4, "-x"),
      item("nightstand", 5.24, 8.065, 0.4, 0.4, "-x"),
      item("wardrobe", 3.1, 4.86, 1.8, 0.6, "+z"),
      item("armchair", 0.7, 5.4, 0.8, 0.8, "+x"),
      item("plant", 2.0, 8.0, 0.4, 0.4, "-z"),
    ],
    "ff-bathroom": [
      item("shower", 0.605, 7.895, 0.75, 0.75, "-z", { screens: ["front", "right"] }),
      item("wc", 1.2, 7.945, 0.4, 0.65, "-z"),
      item("basin", 0.405, 6.975, 0.45, 0.35, "+x"),
    ],
    // Open lounge: sofa on the east wall facing the void, clear path to the balcony doors.
    "ff-sitting": [
      item("rug", 7.4, 1.6, 2.0, 1.8, "-z"),
      item("sofa", 8.345, 1.6, 2.0, 0.85, "-x"),
      item("roundTable", 7.25, 1.6, 0.7, 0.7, "-z"),
      item("armchair", 6.25, 1.6, 0.8, 0.8, "+x"),
      item("plant", 5.9, 2.65, 0.4, 0.4, "-z"),
    ],
    "ff-balcony": [
      item("armchair", 7.95, -0.62, 0.65, 0.65, "-x"),
      item("roundTable", 7.25, -0.62, 0.45, 0.45, "-z"),
      item("armchair", 6.55, -0.62, 0.65, 0.65, "+x"),
      item("plant", 8.7, -0.85, 0.36, 0.36, "-z"),
      item("plant", 5.8, -0.85, 0.36, 0.36, "-z"),
    ],
  }),
];

/** Plan-space footprint of an item (w/d swap when it faces along x). */
export function furnitureFootprint(f: FurnitureItem) {
  const alongX = f.facing === "+x" || f.facing === "-x";
  const sx = alongX ? f.d : f.w;
  const sz = alongX ? f.w : f.d;
  return { x0: f.x - sx / 2, x1: f.x + sx / 2, z0: f.z - sz / 2, z1: f.z + sz / 2 };
}
