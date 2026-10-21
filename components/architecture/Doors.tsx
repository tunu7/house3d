"use client";

import { useMemo } from "react";
import { doorLeaf, openingFramePieces, slidingGrillePieces } from "@/lib/architecture/geometry";
import type { Wall } from "@/types/architecture";
import { MATERIALS } from "./materials";
import { MergedBoxes } from "./MergedBoxes";

const FRAME_WIDTH = 0.05;
/** Doors are shown open so rooms stay visible and walkable. */
const OPEN_ANGLE = (80 * Math.PI) / 180;

/** One wall's door frames (merged), open hinged leaves, and sliding grilles (half open). */
export function WallDoors({ wall, baseY }: { wall: Wall; baseY: number }) {
  const { frames, leaves, grilleFrames, grilles } = useMemo(() => {
    const doors = wall.openings.filter((o) => o.kind === "door");
    const hinged = doors.filter((o) => o.operation !== "sliding");
    const sliding = doors.filter((o) => o.operation === "sliding");
    const frame = (o: (typeof doors)[number]) =>
      openingFramePieces(wall, o, baseY, { width: FRAME_WIDTH, depth: wall.thickness + 0.02 });
    return {
      frames: hinged.flatMap(frame),
      leaves: hinged.map((o) => ({ id: o.id, ...doorLeaf(wall, o, baseY, FRAME_WIDTH, OPEN_ANGLE) })),
      grilleFrames: sliding.flatMap(frame),
      grilles: sliding.flatMap((o) => slidingGrillePieces(wall, o, baseY, FRAME_WIDTH)),
    };
  }, [wall, baseY]);

  const leafMaterial = wall.kind === "exterior" ? MATERIALS.entranceDoor : MATERIALS.doorWood;
  return (
    <>
      <MergedBoxes pieces={frames} material={MATERIALS.doorWood} />
      <MergedBoxes pieces={[...grilleFrames, ...grilles]} material={MATERIALS.frame} />
      {leaves.map((l) => (
        <mesh key={l.id} position={l.center} rotation-y={l.rotationY} material={leafMaterial} castShadow receiveShadow>
          <boxGeometry args={l.size} />
        </mesh>
      ))}
    </>
  );
}
