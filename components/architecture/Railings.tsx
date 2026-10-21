"use client";

import { useMemo } from "react";
import type { BoxPiece } from "@/lib/architecture/geometry";
import { planToWorld } from "@/lib/architecture/geometry";
import { HOUSE } from "@/lib/architecture/house";
import type { FloorId, Railing } from "@/types/architecture";
import { MATERIALS } from "./materials";
import { MergedBoxes } from "./MergedBoxes";

const RAIL = 0.05;
const POST = 0.05;
const GLASS = 0.012;
/** Gap between the slab and the bottom of the glass. */
const GLASS_LIFT = 0.05;

function railBox(r: Railing, baseY: number, y0: number, y1: number, thickness: number, a0 = r.from, a1 = r.to): BoxPiece {
  const mid = (a0 + a1) / 2;
  const [wx, wz] = r.axis === "x" ? planToWorld(mid, r.at) : planToWorld(r.at, mid);
  const len = a1 - a0;
  return {
    center: [wx, baseY + (y0 + y1) / 2, wz],
    size: r.axis === "x" ? [len, y1 - y0, thickness] : [thickness, y1 - y0, len],
  };
}

/** Glass balustrades with a charcoal top rail and end posts. */
export function Railings({ floor }: { floor: FloorId }) {
  const { metal, glass } = useMemo(() => {
    const baseY = HOUSE.levels[floor].ffl;
    const rails = HOUSE.railings.filter((r) => r.floor === floor);
    return {
      metal: rails.flatMap((r) => [
        railBox(r, baseY, r.height - RAIL, r.height, RAIL),
        railBox(r, baseY, 0, r.height - RAIL, POST, r.from, r.from + POST),
        railBox(r, baseY, 0, r.height - RAIL, POST, r.to - POST, r.to),
      ]),
      glass: rails.map((r) => railBox(r, baseY, GLASS_LIFT, r.height - RAIL, GLASS, r.from + POST, r.to - POST)),
    };
  }, [floor]);

  return (
    <group>
      <MergedBoxes pieces={metal} material={MATERIALS.frame} />
      <MergedBoxes pieces={glass} material={MATERIALS.glass} castShadow={false} receiveShadow={false} />
    </group>
  );
}
