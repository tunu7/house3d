"use client";

import { planToWorld } from "@/lib/architecture/geometry";
import { DIMENSIONS } from "@/lib/architecture/dimensions";
import { MATERIALS } from "./materials";

const GROUND_SIZE = 60;
/** Entrance path from the main door (plan x 3.8–4.8) out to the site edge. */
const PATH = { x0: 3.7, x1: 4.9, length: 6 };
/** One intermediate step halves the plinth rise at the entrance. */
const STEP = { depth: 0.35, plinthOverhang: 0.05 };

export function Site() {
  const groundY = -DIMENSIONS.plinthHeight;
  const stepTop = groundY / 2;
  const stepZ0 = -STEP.plinthOverhang;
  const stepZ1 = stepZ0 - STEP.depth;
  const midX = (PATH.x0 + PATH.x1) / 2;
  const [pathX, pathZ] = planToWorld(midX, stepZ1 - PATH.length / 2);
  const [, stepZ] = planToWorld(midX, (stepZ0 + stepZ1) / 2);
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position-y={groundY} material={MATERIALS.ground} receiveShadow>
        <planeGeometry args={[GROUND_SIZE, GROUND_SIZE]} />
      </mesh>
      <mesh
        rotation-x={-Math.PI / 2}
        position={[pathX, groundY + 0.01, pathZ]}
        material={MATERIALS.path}
        receiveShadow
      >
        <planeGeometry args={[PATH.x1 - PATH.x0, PATH.length]} />
      </mesh>
      <mesh position={[pathX, (groundY + stepTop) / 2, stepZ]} material={MATERIALS.plinth} castShadow receiveShadow>
        <boxGeometry args={[PATH.x1 - PATH.x0, stepTop - groundY, STEP.depth]} />
      </mesh>
    </group>
  );
}
