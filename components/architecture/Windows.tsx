"use client";

import { useMemo } from "react";
import { openingFramePieces, paneBox } from "@/lib/architecture/geometry";
import type { Wall } from "@/types/architecture";
import { MATERIALS } from "./materials";
import { MergedBoxes } from "./MergedBoxes";

const FRAME = { width: 0.05, depth: 0.08 };

/** One wall's window and vent frames (merged) and glazing (merged, transparent). */
export function WallWindows({ wall, baseY }: { wall: Wall; baseY: number }) {
  const { frames, panes } = useMemo(() => {
    const windows = wall.openings.filter((o) => o.kind !== "door");
    return {
      frames: windows.flatMap((o) => openingFramePieces(wall, o, baseY, FRAME)),
      panes: windows.map((o) => paneBox(wall, o, baseY, FRAME.width)),
    };
  }, [wall, baseY]);

  return (
    <>
      <MergedBoxes pieces={frames} material={MATERIALS.frame} />
      <MergedBoxes pieces={panes} material={MATERIALS.glass} castShadow={false} receiveShadow={false} />
    </>
  );
}
