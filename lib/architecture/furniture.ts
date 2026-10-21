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

// Bedroom 1 and its attached toilet repeat on both floors (stacked plan).
const bedroomOne = (): Spec[] => [
  item("bed", 1.23, 6.8, 1.6, 2.0, "+x"),
  item("nightstand", 0.43, 5.79, 0.4, 0.4, "+x"),
  item("nightstand", 0.43, 7.81, 0.4, 0.4, "+x"),
  item("wardrobe", 1.1, 9.47, 1.6, 0.6, "-z"),
];

const attachedToilet = (): Spec[] => [
  item("shower", 2.465, 9.365, 0.8, 0.8, "-z", { screens: ["front", "right"] }),
  item("wc", 3.1, 9.445, 0.4, 0.65, "-z"),
  item("basin", 3.21, 8.45, 0.45, 0.35, "-x"),
];

export const FURNITURE: FurnitureItem[] = [
  ...place("ground", {
    "gf-bedroom-1": bedroomOne(),
    "gf-attached-toilet": attachedToilet(),
    "gf-common-toilet": [
      item("shower", 3.065, 5.065, 0.75, 0.75, "-z", { screens: ["front", "left"] }),
      item("wc", 2.4, 5.115, 0.4, 0.65, "-z"),
      item("basin", 2.235, 4.35, 0.45, 0.35, "+x"),
    ],
    "gf-dining": [
      item("diningTable", 5.0, 7.0, 1.6, 0.9, "-z"),
      ...[4.5, 5.0, 5.5].flatMap((x) => [
        item("chair", x, 6.25, 0.45, 0.45, "+z"),
        item("chair", x, 7.75, 0.45, 0.45, "-z"),
      ]),
      item("console", 3.76, 7.6, 1.0, 0.4, "+x"),
      item("plant", 6.18, 8.0, 0.4, 0.4, "-z"),
    ],
    "gf-kitchen": [
      item("counter", 7.665, 7.97, 2.21, 0.6, "-z", { sinkAt: 0.135 }),
      item("counter", 8.47, 6.935, 1.47, 0.6, "-x", { hobAt: 0.035 }),
      item("fridge", 8.42, 5.88, 0.64, 0.7, "-x"),
      item("hood", 8.545, 6.9, 0.7, 0.45, "-x", { elevation: 1.6 }),
      item("upperCabinet", 6.93, 8.095, 0.74, 0.35, "-z", { elevation: 1.5, height: 0.7 }),
    ],
    "gf-bedroom-2": [
      item("bed", 1.23, 1.6, 1.5, 2.0, "+x"),
      item("nightstand", 0.43, 0.6, 0.4, 0.4, "+x"),
      item("nightstand", 0.43, 2.6, 0.4, 0.4, "+x"),
      item("wardrobe", 3.14, 0.9, 1.2, 0.6, "-x"),
    ],
    "gf-living": [
      item("rug", 6.5, 3.0, 3.4, 2.8, "-z"),
      item("sofa", 6.5, 4.4, 2.6, 0.9, "-z"),
      item("sofa", 4.85, 2.9, 1.6, 0.85, "+x"),
      item("coffeeTable", 6.5, 3.0, 1.1, 0.6, "-z"),
      item("armchair", 6.0, 1.5, 0.8, 0.8, "+z"),
      item("armchair", 7.0, 1.5, 0.8, 0.8, "+z"),
      item("plant", 8.45, 0.55, 0.45, 0.45, "-z"),
      item("plant", 8.45, 5.15, 0.45, 0.45, "-z"),
    ],
  }),
  ...place("first", {
    "ff-bedroom-1": bedroomOne(),
    "ff-attached-toilet": attachedToilet(),
    "ff-bedroom-2": [
      item("rug", 6.2, 7.0, 2.6, 2.0, "-z"),
      item("bed", 6.2, 7.22, 1.8, 2.1, "-z"),
      item("nightstand", 5.0, 8.07, 0.45, 0.4, "-z"),
      item("nightstand", 7.4, 8.07, 0.45, 0.4, "-z"),
      item("wardrobe", 3.86, 7.4, 1.6, 0.6, "+x"),
      item("plant", 8.5, 5.85, 0.4, 0.4, "-z"),
    ],
    "ff-sitting": [
      item("rug", 1.75, 1.6, 2.0, 1.8, "-z"),
      item("sofa", 0.655, 1.35, 2.1, 0.85, "+x"),
      item("sofa", 1.85, 0.655, 1.5, 0.85, "+z"),
      item("roundTable", 1.85, 1.85, 0.7, 0.7, "-z"),
      item("plant", 3.15, 0.5, 0.4, 0.4, "-z"),
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
