"use client";

import { forwardRef, type ReactNode, useMemo } from "react";
import type * as THREE from "three";
import { wallCapPiece, wallPieces } from "@/lib/architecture/geometry";
import type { Wall } from "@/types/architecture";
import { WallDoors } from "./Doors";
import { MATERIALS } from "./materials";
import { MergedBoxes } from "./MergedBoxes";
import { MergeStatic } from "./MergeStatic";
import { WallWindows } from "./Windows";

interface WallAssemblyProps {
  wall: Wall;
  baseY: number;
  /** Facade features fixed to this wall (hidden and baked with it). */
  children?: ReactNode;
}

/** Charcoal coping on the parapet, the top of every first-floor exterior wall. */
const COPING = { overhang: 0.03, height: 0.06 };

/**
 * A wall with everything set into it — masonry, door frames and leaves,
 * window frames and glass — grouped so it can be hidden as one unit.
 */
export const WallAssembly = forwardRef<THREE.Group, WallAssemblyProps>(function WallAssembly({ wall, baseY, children }, ref) {
  const pieces = useMemo(() => wallPieces(wall, baseY), [wall, baseY]);
  const coping = useMemo(
    () => (wall.kind === "exterior" && wall.floor === "first" ? [wallCapPiece(wall, baseY, COPING.overhang, COPING.height)] : []),
    [wall, baseY],
  );
  const hasDoors = wall.openings.some((o) => o.kind === "door");
  const hasWindows = wall.openings.some((o) => o.kind !== "door");
  return (
    <group ref={ref}>
      <MergeStatic>
        <MergedBoxes pieces={pieces} material={wall.kind === "exterior" ? MATERIALS.exteriorWall : MATERIALS.interiorWall} />
        {hasDoors && <WallDoors wall={wall} baseY={baseY} />}
        {hasWindows && <WallWindows wall={wall} baseY={baseY} />}
        <MergedBoxes pieces={coping} material={MATERIALS.fascia} />
        {children}
      </MergeStatic>
    </group>
  );
});
