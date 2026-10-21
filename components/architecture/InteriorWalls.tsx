"use client";

import { useMemo } from "react";
import { HOUSE } from "@/lib/architecture/house";
import type { FloorId } from "@/types/architecture";
import { MergeStatic } from "./MergeStatic";
import { WallAssembly } from "./WallAssembly";

export function InteriorWalls({ floor }: { floor: FloorId }) {
  const walls = useMemo(() => HOUSE.walls.filter((w) => w.floor === floor && w.kind === "interior"), [floor]);
  const baseY = HOUSE.levels[floor].ffl;
  // Partitions are never hidden individually, so the whole floor's set bakes into a few meshes.
  return (
    <MergeStatic key={floor}>
      {walls.map((w) => (
        <WallAssembly key={w.id} wall={w} baseY={baseY} />
      ))}
    </MergeStatic>
  );
}
