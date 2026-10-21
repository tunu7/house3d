"use client";

import { useMemo } from "react";
import { doorLeaf, openingFramePieces } from "@/lib/architecture/geometry";
import type { Wall } from "@/types/architecture";
import { MATERIALS } from "./materials";
import { MergedBoxes } from "./MergedBoxes";

const FRAME_WIDTH = 0.05;
/** Doors are shown open so rooms stay visible and walkable. */
const OPEN_ANGLE = (80 * Math.PI) / 180;

/** One wall's door frames (merged) and open door leaves. */
export function WallDoors({ wall, baseY }: { wall: Wall; baseY: number }) {
  const { frames, leaves } = useMemo(() => {
    const doors = wall.openings.filter((o) => o.kind === "door");
    return {
      frames: doors.flatMap((o) =>
        openingFramePieces(wall, o, baseY, { width: FRAME_WIDTH, depth: wall.thickness + 0.02 }),
      ),
      leaves: doors.map((o) => ({ id: o.id, ...doorLeaf(wall, o, baseY, FRAME_WIDTH, OPEN_ANGLE) })),
    };
  }, [wall, baseY]);

  const leafMaterial = wall.kind === "exterior" ? MATERIALS.entranceDoor : MATERIALS.doorWood;
  return (
    <>
      <MergedBoxes pieces={frames} material={MATERIALS.doorWood} />
      {leaves.map((l) => (
        <mesh key={l.id} position={l.center} rotation-y={l.rotationY} material={leafMaterial} castShadow receiveShadow>
          <boxGeometry args={l.size} />
        </mesh>
      ))}
    </>
  );
}
