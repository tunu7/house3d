"use client";

import type { ReactElement } from "react";
import { MergeStatic } from "@/components/architecture/MergeStatic";
import { planToWorld } from "@/lib/architecture/geometry";
import { HOUSE } from "@/lib/architecture/house";
import type { Facing, FloorId, FurnitureItem, FurnitureType } from "@/types/architecture";
import { Basin, Shower, WC } from "./BathroomFixtures";
import { Bed, Nightstand, Wardrobe } from "./BedroomFurniture";
import { Chair, Console, DiningTable } from "./DiningFurniture";
import { Counter, Fridge, Hood, UpperCabinet } from "./KitchenFurniture";
import { CoffeeTable, Plant, RoundTable, Rug, Sofa } from "./LivingRoomFurniture";

/** Rotation about world Y that turns local +Z toward the item's plan facing. */
const ROTATION: Record<Facing, number> = {
  "-z": 0,
  "+z": Math.PI,
  "+x": Math.PI / 2,
  "-x": -Math.PI / 2,
};

const RENDER: Record<FurnitureType, (f: FurnitureItem) => ReactElement> = {
  bed: (f) => <Bed w={f.w} d={f.d} />,
  nightstand: (f) => <Nightstand w={f.w} d={f.d} />,
  wardrobe: (f) => <Wardrobe w={f.w} d={f.d} />,
  sofa: (f) => <Sofa w={f.w} d={f.d} />,
  armchair: (f) => <Sofa w={f.w} d={f.d} />,
  coffeeTable: (f) => <CoffeeTable w={f.w} d={f.d} />,
  roundTable: (f) => <RoundTable w={f.w} d={f.d} />,
  rug: (f) => <Rug w={f.w} d={f.d} />,
  plant: (f) => <Plant w={f.w} d={f.d} />,
  diningTable: (f) => <DiningTable w={f.w} d={f.d} />,
  chair: (f) => <Chair w={f.w} d={f.d} />,
  console: (f) => <Console w={f.w} d={f.d} />,
  counter: (f) => <Counter w={f.w} d={f.d} sinkAt={f.sinkAt} hobAt={f.hobAt} />,
  upperCabinet: (f) => <UpperCabinet w={f.w} d={f.d} elevation={f.elevation} height={f.height} />,
  hood: (f) => <Hood w={f.w} d={f.d} elevation={f.elevation} />,
  fridge: (f) => <Fridge w={f.w} d={f.d} />,
  wc: (f) => <WC w={f.w} d={f.d} />,
  basin: (f) => <Basin w={f.w} d={f.d} />,
  shower: (f) => <Shower w={f.w} d={f.d} screens={f.screens} />,
};

/** All furniture on one floor, placed from the central furniture model and baked into a few meshes. */
export function Furniture({ floor }: { floor: FloorId }) {
  const y = HOUSE.levels[floor].ffl;
  return (
    <MergeStatic key={floor}>
      {HOUSE.furniture
        .filter((f) => f.floor === floor)
        .map((f) => {
          const [x, z] = planToWorld(f.x, f.z);
          return (
            <group key={f.id} position={[x, y, z]} rotation-y={ROTATION[f.facing]}>
              {RENDER[f.type](f)}
            </group>
          );
        })}
    </MergeStatic>
  );
}
