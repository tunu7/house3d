"use client";

import { HOUSE } from "@/lib/architecture/house";
import { MATERIALS } from "./materials";
import { SlabMesh } from "./SlabMesh";

/** Flat roof slab. Roof form is not shown in the reference drawing — this is an assumption. */
export function Roof() {
  return <SlabMesh slab={HOUSE.roof} material={MATERIALS.roof} />;
}
