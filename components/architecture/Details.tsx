"use client";

import { useMemo } from "react";
import { exteriorTrim, interiorFinishes } from "@/lib/architecture/details";
import type { BoxPiece } from "@/lib/architecture/geometry";
import { HOUSE } from "@/lib/architecture/house";
import type { FloorId, Wall } from "@/types/architecture";
import { MATERIALS } from "./materials";
import { MergedBoxes } from "./MergedBoxes";
import { MergeStatic } from "./MergeStatic";
import { facadeMaterials, floorMaterials } from "./textures";

const finishCache = new Map<FloorId, ReturnType<typeof interiorFinishes>>();
const finishesFor = (floor: FloorId) => {
  if (!finishCache.has(floor)) finishCache.set(floor, interiorFinishes(floor));
  return finishCache.get(floor)!;
};

/** Skirting, bathroom tiling and backsplash on the given walls. */
function Finishes({ floor, walls }: { floor: FloorId; walls: Set<string> }) {
  const pieces = useMemo(() => {
    const f = finishesFor(floor);
    const pick = (m: Map<string, BoxPiece[]>) => [...m].filter(([id]) => walls.has(id)).flatMap(([, v]) => v);
    return { skirting: pick(f.skirting), tile: pick(f.wallTile), splash: pick(f.backsplash) };
  }, [floor, walls]);
  const floors = floorMaterials();
  return (
    <>
      <MergedBoxes pieces={pieces.skirting} material={MATERIALS.skirting} castShadow={false} />
      <MergedBoxes pieces={pieces.tile} material={floors.bathTile} castShadow={false} />
      <MergedBoxes pieces={pieces.splash} material={floors.splashTile} castShadow={false} />
    </>
  );
}

/** Interior finishes on a floor's partitions, baked into a few meshes. */
export function InteriorFinishes({ floor }: { floor: FloorId }) {
  const walls = useMemo(() => new Set(HOUSE.walls.filter((w) => w.floor === floor && w.kind === "interior").map((w) => w.id)), [floor]);
  return (
    <MergeStatic key={floor}>
      <Finishes floor={floor} walls={walls} />
    </MergeStatic>
  );
}

/**
 * Details fixed to one exterior wall — interior finishes on its inside face,
 * stone sills, concrete hoods and the slab band outside — so they hide with
 * the wall in cutaway.
 */
export function ExteriorWallDetails({ wall }: { wall: Wall }) {
  const trim = useMemo(() => exteriorTrim(wall), [wall]);
  const walls = useMemo(() => new Set([wall.id]), [wall.id]);
  return (
    <>
      <Finishes floor={wall.floor} walls={walls} />
      <MergedBoxes pieces={trim.sills} material={facadeMaterials().stone} />
      <MergedBoxes pieces={[...trim.hoods, ...trim.band]} material={MATERIALS.eave} />
    </>
  );
}
