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
      item("rug", 1.9, 8.5, 2.0, 1.8, "-z"),
      item("bed", 1.9, 8.77, 1.6, 2.0, "-z"),
      item("nightstand", 0.6, 9.55, 0.4, 0.4, "-z"),
      item("nightstand", 3.15, 9.55, 0.4, 0.4, "-z"),
      item("wardrobe", 2.3, 5.86, 1.4, 0.6, "+z"),
    ],
    "gf-attached-toilet": [
      item("shower", 0.615, 5.95, 0.77, 0.77, "+x", { screens: ["front", "right"] }),
      item("wc", 0.555, 6.75, 0.4, 0.65, "+x"),
      item("basin", 0.55, 7.265, 0.45, 0.35, "-z"),
    ],
    "gf-common-toilet": [
      item("shower", 0.615, 5.055, 0.77, 0.77, "-z", { screens: ["front", "right"] }),
      item("wc", 1.115, 3.85, 0.4, 0.65, "-x"),
      item("basin", 0.405, 4.3, 0.45, 0.35, "+x"),
    ],
    "gf-dining": [
      item("diningTable", 5.0, 7.0, 1.6, 0.9, "-z"),
      ...[4.5, 5.0, 5.5].flatMap((x) => [
        item("chair", x, 6.25, 0.45, 0.45, "+z"),
        item("chair", x, 7.75, 0.45, 0.45, "-z"),
      ]),
      item("console", 3.76, 7.6, 1.0, 0.4, "+x"),
      item("art", 3.575, 7.6, 0.8, 0.03, "+x", { elevation: 1.3, height: 0.7 }),
      // Stools at the breakfast table that replaces the kitchen wall (R5).
      item("stool", 6.25, 6.1, 0.35, 0.35, "+x"),
      item("stool", 6.25, 6.8, 0.35, 0.35, "+x"),
      item("plant", 6.18, 8.0, 0.4, 0.4, "-z"),
    ],
    "gf-kitchen": [
      item("barTable", 6.85, 6.45, 1.3, 0.5, "-x"),
      item("counter", 7.665, 7.97, 2.21, 0.6, "-z", { sinkAt: 0.135 }),
      item("counter", 8.47, 6.935, 1.47, 0.6, "-x", { hobAt: 0.035 }),
      item("fridge", 8.42, 5.88, 0.64, 0.7, "-x"),
      item("hood", 8.545, 6.9, 0.7, 0.45, "-x", { elevation: 1.6 }),
      item("upperCabinet", 6.93, 8.095, 0.74, 0.35, "-z", { elevation: 1.5, height: 0.7 }),
    ],
    // One nightstand only: the back-left corner is the way to the common toilet (R6).
    "gf-bedroom-2": [
      item("rug", 1.3, 1.45, 1.8, 2.0, "+x"),
      item("bed", 1.23, 1.45, 1.5, 2.0, "+x"),
      item("nightstand", 0.43, 0.45, 0.4, 0.4, "+x"),
      item("wardrobe", 3.14, 0.9, 1.2, 0.6, "-x"),
    ],
    "gf-living": [
      item("rug", 6.5, 3.0, 3.4, 2.8, "-z"),
      item("sofa", 6.5, 4.4, 2.6, 0.9, "-z"),
      item("sofa", 4.85, 2.9, 1.6, 0.85, "+x"),
      item("coffeeTable", 6.5, 3.0, 1.1, 0.6, "-z"),
      item("armchair", 6.0, 1.5, 0.8, 0.8, "+z"),
      item("armchair", 7.0, 1.5, 0.8, 0.8, "+z"),
      item("floorLamp", 8.15, 4.4, 0.4, 0.4, "-z"),
      item("sideTable", 4.8, 4.3, 0.45, 0.45, "-z"),
      item("art", 3.575, 1.0, 1.0, 0.03, "+x", { elevation: 1.25, height: 0.8 }),
      item("plant", 8.45, 0.55, 0.45, 0.45, "-z"),
      item("plant", 8.45, 5.15, 0.45, 0.45, "-z"),
    ],
  }),
  ...place("first", {
    // Bed against the shared wall with Bedroom 2; wardrobe at the back.
    "ff-bedroom-1": [
      item("rug", 2.2, 7.0, 1.8, 2.2, "-x"),
      item("bed", 2.44, 7.0, 1.6, 2.0, "-x"),
      item("art", 3.425, 7.0, 1.0, 0.03, "-x", { elevation: 1.35, height: 0.7 }),
      item("nightstand", 3.24, 5.8, 0.4, 0.4, "-x"),
      item("wardrobe", 2.45, 9.47, 1.6, 0.6, "-z"),
    ],
    "ff-attached-toilet": [
      item("shower", 0.615, 9.38, 0.77, 0.77, "-z", { screens: ["front", "right"] }),
      item("wc", 1.115, 8.45, 0.4, 0.65, "-x"),
      item("basin", 1.265, 9.2, 0.45, 0.35, "-x"),
    ],
    // Revised 5.5 × 4.0 m room: bed against the Bedroom 1 wall, wardrobe on the
    // void-side wall, reading chair in the alcove beside the bathroom.
    "ff-bedroom-2": [
      item("rug", 5.0, 6.95, 2.4, 2.2, "-z"),
      item("bed", 4.61, 6.95, 1.8, 2.1, "+x"),
      item("art", 3.575, 6.95, 1.2, 0.03, "+x", { elevation: 1.35, height: 0.7 }),
      item("nightstand", 3.76, 5.8, 0.4, 0.4, "+x"),
      item("nightstand", 3.76, 8.065, 0.4, 0.4, "+x"),
      item("wardrobe", 5.9, 4.86, 1.8, 0.6, "+z"),
      item("armchair", 8.3, 5.4, 0.8, 0.8, "-x"),
      item("plant", 7.0, 8.0, 0.4, 0.4, "-z"),
    ],
    "ff-bathroom": [
      item("shower", 8.395, 7.895, 0.75, 0.75, "-z", { screens: ["front", "left"] }),
      item("wc", 7.8, 7.945, 0.4, 0.65, "-z"),
      item("basin", 8.595, 6.975, 0.45, 0.35, "-x"),
    ],
    // Open lounge: sofa on the west wall facing the void, clear path to the balcony doors.
    "ff-sitting": [
      item("rug", 1.6, 1.6, 2.0, 1.8, "-z"),
      item("sofa", 0.655, 1.6, 2.0, 0.85, "+x"),
      item("roundTable", 1.75, 1.6, 0.7, 0.7, "-z"),
      item("armchair", 2.75, 1.6, 0.8, 0.8, "-x"),
      item("plant", 3.1, 2.65, 0.4, 0.4, "-z"),
    ],
    "ff-balcony": [
      item("armchair", 1.05, -0.62, 0.65, 0.65, "+x"),
      item("roundTable", 1.75, -0.62, 0.45, 0.45, "-z"),
      item("armchair", 2.45, -0.62, 0.65, 0.65, "-x"),
      item("plant", 0.3, -0.85, 0.36, 0.36, "-z"),
      item("plant", 3.2, -0.85, 0.36, 0.36, "-z"),
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
