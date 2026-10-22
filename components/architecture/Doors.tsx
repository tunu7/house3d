"use client";

import { useMemo } from "react";
import { doorLeaf, openingFramePieces, slidingPanelPieces } from "@/lib/architecture/geometry";
import type { Wall } from "@/types/architecture";
import { MATERIALS } from "./materials";
import { MergedBoxes } from "./MergedBoxes";

const FRAME_WIDTH = 0.05;
/** Doors are shown open so rooms stay visible and walkable. */
const OPEN_ANGLE = (80 * Math.PI) / 180;

/** One wall's door frames (merged), open hinged leaves, and sliding grille or glass doors (half open). */
export function WallDoors({ wall, baseY }: { wall: Wall; baseY: number }) {
  const { frames, leaves, slidingMetal, slidingGlass } = useMemo(() => {
    const doors = wall.openings.filter((o) => o.kind === "door");
    const hinged = doors.filter((o) => o.operation !== "sliding");
    const sliding = doors.filter((o) => o.operation === "sliding");
    const frame = (o: (typeof doors)[number]) =>
      openingFramePieces(wall, o, baseY, { width: FRAME_WIDTH, depth: wall.thickness + 0.02 });
    return {
      frames: hinged.flatMap(frame),
      leaves: hinged.map((o) => ({ id: o.id, ...doorLeaf(wall, o, baseY, FRAME_WIDTH, OPEN_ANGLE) })),
      slidingMetal: [...sliding.flatMap(frame), ...sliding.flatMap((o) => slidingPanelPieces(wall, o, baseY, FRAME_WIDTH).metal)],
      slidingGlass: sliding.flatMap((o) => slidingPanelPieces(wall, o, baseY, FRAME_WIDTH).glass),
    };
  }, [wall, baseY]);

  const entrance = wall.kind === "exterior";
  const leafMaterial = entrance ? MATERIALS.entranceDoor : MATERIALS.doorWood;
  return (
    <>
      <MergedBoxes pieces={frames} material={MATERIALS.doorWood} />
      <MergedBoxes pieces={slidingMetal} material={MATERIALS.frame} />
      <MergedBoxes pieces={slidingGlass} material={MATERIALS.glass} castShadow={false} receiveShadow={false} />
      {leaves.map((l) => {
        const [w, , t] = l.size;
        // Hardware near the leaf's free edge, at 1.0 m (lever) or centred on 1.1 m (pull bar).
        const hx = w / 2 - 0.08;
        const hy = baseY + (entrance ? 1.1 : 1.0) - l.center[1];
        return (
          <group key={l.id} position={l.center} rotation-y={l.rotationY}>
            <mesh material={leafMaterial} castShadow receiveShadow>
              <boxGeometry args={l.size} />
            </mesh>
            {[-1, 1].map((side) => (
              <group key={side} position={[hx, hy, side * (t / 2 + 0.03)]}>
                {entrance ? (
                  <mesh material={MATERIALS.frame}>
                    <boxGeometry args={[0.025, 0.9, 0.025]} />
                  </mesh>
                ) : (
                  <>
                    <mesh position-x={-0.05} material={MATERIALS.handle}>
                      <boxGeometry args={[0.12, 0.018, 0.018]} />
                    </mesh>
                    <mesh position-z={-side * 0.015} rotation-x={Math.PI / 2} material={MATERIALS.handle}>
                      <cylinderGeometry args={[0.028, 0.028, 0.012, 16]} />
                    </mesh>
                  </>
                )}
              </group>
            ))}
          </group>
        );
      })}
    </>
  );
}
