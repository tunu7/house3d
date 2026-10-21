"use client";

import { HOUSE } from "@/lib/architecture/house";
import { BalconyEave } from "./Facade";
import { MATERIALS } from "./materials";
import { MergeStatic } from "./MergeStatic";
import { SlabMesh } from "./SlabMesh";

/** Flat roof slab with the balcony eave. Roof form follows the owner's reference photo (R9). */
export function Roof() {
  return (
    <>
      <SlabMesh slab={HOUSE.roof} material={MATERIALS.roof} />
      <MergeStatic>
        <BalconyEave />
      </MergeStatic>
    </>
  );
}
