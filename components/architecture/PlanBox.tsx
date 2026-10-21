"use client";

import type * as THREE from "three";
import { planToWorld } from "@/lib/architecture/geometry";
import type { PlanRect } from "@/types/architecture";

/** Axis-aligned box spanning a plan rectangle between two world heights. */
export function PlanBox({ rect, y0, y1, material, shadow = true }: { rect: PlanRect; y0: number; y1: number; material: THREE.Material; shadow?: boolean }) {
  const [x, z] = planToWorld((rect.x0 + rect.x1) / 2, (rect.z0 + rect.z1) / 2);
  return (
    <mesh position={[x, (y0 + y1) / 2, z]} material={material} castShadow={shadow} receiveShadow>
      <boxGeometry args={[rect.x1 - rect.x0, y1 - y0, rect.z1 - rect.z0]} />
    </mesh>
  );
}

/** Small round downlight set into a soffit at plan (x, z), its face at height `y`. */
export function Downlight({ x, z, y, material }: { x: number; z: number; y: number; material: THREE.Material }) {
  const [wx, wz] = planToWorld(x, z);
  return (
    <mesh position={[wx, y - 0.005, wz]} material={material}>
      <cylinderGeometry args={[0.045, 0.045, 0.012, 16]} />
    </mesh>
  );
}
