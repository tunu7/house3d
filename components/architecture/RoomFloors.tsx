"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { planToWorld } from "@/lib/architecture/geometry";
import { HOUSE } from "@/lib/architecture/house";
import type { FloorId, RoomKind } from "@/types/architecture";
import { type FloorFinish, floorMaterials } from "./textures";

/** Offset above the slab top so finishes never z-fight with it. */
const FINISH_LIFT = 0.005;

const FINISH: Partial<Record<RoomKind, FloorFinish>> = {
  bedroom: "wood",
  sitting: "wood",
  toilet: "bathTile",
  kitchen: "kitchenTile",
  living: "marble",
  dining: "marble",
  circulation: "marble",
};

/**
 * Per-room floor finishes, merged into one mesh per finish. UVs are in world
 * metres so patterns stay continuous and correctly scaled across rooms.
 * Voids and stair wells get no floor.
 */
export function RoomFloors({ floor }: { floor: FloorId }) {
  const groups = useMemo(() => {
    const byFinish = new Map<FloorFinish, THREE.BufferGeometry[]>();
    for (const room of HOUSE.rooms.filter((r) => r.floor === floor)) {
      const finish = FINISH[room.kind];
      if (!finish) continue;
      for (const r of room.rects) {
        const w = r.x1 - r.x0;
        const d = r.z1 - r.z0;
        const [cx, cz] = planToWorld((r.x0 + r.x1) / 2, (r.z0 + r.z1) / 2);
        const geom = new THREE.PlaneGeometry(w, d).rotateX(-Math.PI / 2);
        geom.translate(cx, HOUSE.levels[floor].ffl + FINISH_LIFT, cz);
        // World-space UVs: u = X, v = −Z (metres).
        const pos = geom.getAttribute("position");
        const uv = geom.getAttribute("uv");
        for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i), -pos.getZ(i));
        byFinish.set(finish, [...(byFinish.get(finish) ?? []), geom]);
      }
    }
    return [...byFinish].map(([finish, parts]) => {
      const merged = mergeGeometries(parts);
      parts.forEach((p) => p.dispose());
      return { finish, geometry: merged };
    });
  }, [floor]);

  useEffect(() => () => groups.forEach((g) => g.geometry.dispose()), [groups]);

  const materials = floorMaterials();
  return (
    <group>
      {groups.map(({ finish, geometry }) => (
        <mesh key={finish} geometry={geometry} material={materials[finish]} receiveShadow />
      ))}
    </group>
  );
}
