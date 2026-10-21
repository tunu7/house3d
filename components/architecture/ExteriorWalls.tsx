"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type * as THREE from "three";
import { exteriorNormal, planToWorld } from "@/lib/architecture/geometry";
import { HOUSE } from "@/lib/architecture/house";
import { useViewerStore } from "@/lib/store/viewer-store";
import type { FloorId } from "@/types/architecture";
import { WallAssembly } from "./WallAssembly";

/**
 * Exterior walls. In cutaway (dollhouse) mode, every wall whose outside face
 * points toward the camera is hidden each frame, opening the house to view.
 * Visibility is set on the objects directly so camera motion never re-renders React.
 */
export function ExteriorWalls({ floor }: { floor: FloorId }) {
  const walls = useMemo(() => HOUSE.walls.filter((w) => w.floor === floor && w.kind === "exterior"), [floor]);
  const facing = useMemo(
    () =>
      walls.map((w) => {
        const mid = (w.from + w.to) / 2;
        const [cx, cz] = w.axis === "x" ? planToWorld(mid, w.at) : planToWorld(w.at, mid);
        const n = exteriorNormal(w, HOUSE.footprint);
        // Plan (x, z) normal → world (X, −Z).
        return { cx, cz, nx: n.x, nz: -n.z };
      }),
    [walls],
  );
  const refs = useRef<(THREE.Group | null)[]>([]);

  useFrame(({ camera }) => {
    const cutaway = useViewerStore.getState().cutaway;
    facing.forEach((f, i) => {
      const group = refs.current[i];
      if (!group) return;
      group.visible = !cutaway || (camera.position.x - f.cx) * f.nx + (camera.position.z - f.cz) * f.nz <= 0;
    });
  });

  const baseY = HOUSE.levels[floor].ffl;
  return (
    <group>
      {walls.map((w, i) => (
        <WallAssembly
          key={w.id}
          wall={w}
          baseY={baseY}
          ref={(g) => {
            refs.current[i] = g;
          }}
        />
      ))}
    </group>
  );
}
