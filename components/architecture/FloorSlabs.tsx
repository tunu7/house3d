"use client";

import { HOUSE } from "@/lib/architecture/house";
import type { FloorId } from "@/types/architecture";
import { MATERIALS } from "./materials";
import { SlabMesh } from "./SlabMesh";

/** The slab a floor stands on: the plinth for the ground floor, the suspended slab for the first. */
export function FloorSlab({ floor }: { floor: FloorId }) {
  const slab = floor === "ground"
    ? HOUSE.slabs.find((s) => s.id === "plinth")
    : HOUSE.slabs.find((s) => s.id === "first-floor");
  if (!slab) return null;
  return <SlabMesh slab={slab} material={floor === "ground" ? MATERIALS.plinth : MATERIALS.slab} />;
}
