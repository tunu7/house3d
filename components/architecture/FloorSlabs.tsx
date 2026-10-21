"use client";

import { HOUSE } from "@/lib/architecture/house";
import type { FloorId } from "@/types/architecture";
import { MATERIALS } from "./materials";
import { SlabMesh } from "./SlabMesh";

/** The slabs a floor stands on: the plinth for the ground floor; the suspended slab and balcony for the first. */
export function FloorSlab({ floor }: { floor: FloorId }) {
  const slabs = floor === "ground"
    ? HOUSE.slabs.filter((s) => s.id === "plinth")
    : HOUSE.slabs.filter((s) => s.top === HOUSE.levels.first.ffl);
  return (
    <>
      {slabs.map((slab) => (
        <SlabMesh
          key={slab.id}
          slab={slab}
          // The balcony's exposed edge reads as a white band, as in the reference photo (R9).
          material={floor === "ground" ? MATERIALS.plinth : slab.id === "balcony" ? MATERIALS.eave : MATERIALS.slab}
        />
      ))}
    </>
  );
}
