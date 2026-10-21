"use client";

import { forwardRef, useMemo } from "react";
import type * as THREE from "three";
import { wallPieces } from "@/lib/architecture/geometry";
import type { Wall } from "@/types/architecture";
import { WallDoors } from "./Doors";
import { MATERIALS } from "./materials";
import { MergedBoxes } from "./MergedBoxes";
import { MergeStatic } from "./MergeStatic";
import { WallWindows } from "./Windows";

interface WallAssemblyProps {
  wall: Wall;
  baseY: number;
}

/**
 * A wall with everything set into it — masonry, door frames and leaves,
 * window frames and glass — grouped so it can be hidden as one unit.
 */
export const WallAssembly = forwardRef<THREE.Group, WallAssemblyProps>(function WallAssembly({ wall, baseY }, ref) {
  const pieces = useMemo(() => wallPieces(wall, baseY), [wall, baseY]);
  const hasDoors = wall.openings.some((o) => o.kind === "door");
  const hasWindows = wall.openings.some((o) => o.kind !== "door");
  return (
    <group ref={ref}>
      <MergeStatic>
        <MergedBoxes pieces={pieces} material={wall.kind === "exterior" ? MATERIALS.exteriorWall : MATERIALS.interiorWall} />
        {hasDoors && <WallDoors wall={wall} baseY={baseY} />}
        {hasWindows && <WallWindows wall={wall} baseY={baseY} />}
      </MergeStatic>
    </group>
  );
});
