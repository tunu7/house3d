"use client";

import type { ReactNode } from "react";
import { BALCONY_RECT, GRID, LEVELS, ROOF_TOP } from "@/lib/architecture/dimensions";
import { planToWorld } from "@/lib/architecture/geometry";
import { CANOPY, PILLARS, PORCH } from "@/lib/architecture/site";
import type { PlanRect } from "@/types/architecture";
import { MATERIALS } from "./materials";
import { Downlight, PlanBox } from "./PlanBox";
import { facadeMaterials } from "./textures";

/**
 * Front-facade features after the owner's reference photo (R9). Each group is
 * attached to the exterior wall it belongs to, so cutaway hides it with that
 * wall. All dimensions are plan metres / world heights.
 */

const FF = LEVELS.first.ffl;
const SLAB_UNDERSIDE = FF - 0.2;

/** Vertical slats along x between x0 and x1 at plan depth z, from y0 to y1. */
function Slats({ x0, x1, count, z, y0, y1 }: { x0: number; x1: number; count: number; z: number; y0: number; y1: number }) {
  const { cladding } = facadeMaterials();
  const step = (x1 - x0) / (count - 1);
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const x = x0 + i * step;
        return <PlanBox key={i} rect={{ x0: x - 0.022, x1: x + 0.022, z0: z - 0.045, z1: z + 0.045 }} y0={y0} y1={y1} material={cladding} />;
      })}
    </>
  );
}

/** Foliage blob at plan (x, z), height y; `stretch` elongates it downward for trailing plants. */
function Foliage({ x, z, y, r, stretch = 1 }: { x: number; z: number; y: number; r: number; stretch?: number }) {
  const [wx, wz] = planToWorld(x, z);
  return (
    <mesh position={[wx, y - (r * (stretch - 1)) / 2, wz]} scale={[1, stretch, 1]} material={MATERIALS.leaf} castShadow>
      <icosahedronGeometry args={[r, 1]} />
    </mesh>
  );
}

/** Wall sconce: a dark body with a warm light slot, mounted on a vertical face. */
function Sconce({ rect, y }: { rect: PlanRect; y: number }) {
  return (
    <>
      <PlanBox rect={rect} y0={y} y1={y + 0.24} material={MATERIALS.fascia} />
      <PlanBox
        rect={{ x0: rect.x0 - 0.002, x1: rect.x1 + 0.002, z0: rect.z0 - 0.002, z1: rect.z1 + 0.002 }}
        y0={y + 0.02}
        y1={y + 0.05}
        material={MATERIALS.glow}
        shadow={false}
      />
    </>
  );
}

/** Covered entrance: stone pillars, charcoal canopy with timber soffit and downlights, timber door surround. */
function EntrancePortico() {
  const { stone, cladding } = facadeMaterials();
  const o = CANOPY.overhang;
  const canopy: PlanRect = { x0: PORCH.x0 - o, x1: PORCH.x1 + o, z0: PORCH.z0 - o, z1: GRID.z.front };
  const top = CANOPY.bottom + CANOPY.thickness;
  return (
    <>
      {PILLARS.map((p, i) => (
        <PlanBox key={i} rect={p} y0={0} y1={CANOPY.bottom} material={stone} />
      ))}
      <PlanBox rect={canopy} y0={CANOPY.bottom} y1={top} material={MATERIALS.fascia} />
      <PlanBox
        rect={{ x0: canopy.x0 + 0.06, x1: canopy.x1 - 0.06, z0: canopy.z0 + 0.06, z1: canopy.z1 }}
        y0={CANOPY.bottom - 0.012}
        y1={CANOPY.bottom}
        material={cladding}
        shadow={false}
      />
      {[4.15, 5.25].flatMap((x) => [-0.35, -0.95].map((z) => <Downlight key={`${x}${z}`} x={x} z={z} y={CANOPY.bottom - 0.012} material={MATERIALS.glow} />))}
      {/* Timber surround on the wall face around the door (plan x 4.2–5.2). */}
      <PlanBox rect={{ x0: 3.9, x1: 4.18, z0: -0.025, z1: 0 }} y0={0} y1={CANOPY.bottom} material={cladding} />
      <PlanBox rect={{ x0: 5.22, x1: 5.5, z0: -0.025, z1: 0 }} y0={0} y1={CANOPY.bottom} material={cladding} />
      <PlanBox rect={{ x0: 4.18, x1: 5.22, z0: -0.025, z1: 0 }} y0={2.12} y1={CANOPY.bottom} material={cladding} />
      {/* Sconces on the pillars' inner faces. */}
      <Sconce rect={{ x0: PILLARS[0].x1, x1: PILLARS[0].x1 + 0.06, z0: PILLARS[0].z0 + 0.13, z1: PILLARS[0].z0 + 0.25 }} y={1.85} />
      <Sconce rect={{ x0: PILLARS[1].x0 - 0.06, x1: PILLARS[1].x0, z0: PILLARS[1].z0 + 0.13, z1: PILLARS[1].z0 + 0.25 }} y={1.85} />
    </>
  );
}

/** First-floor left: charcoal portal frame around the void glazing, timber fins, planter with trailing greenery. */
function FramedGlazing() {
  const { stone, cladding } = facadeMaterials();
  const depth = -0.45;
  const x0 = GRID.x.left;
  const x1 = 4.45;
  const y0 = SLAB_UNDERSIDE;
  const y1 = ROOF_TOP + 0.05;
  const beam = 0.35;
  return (
    <>
      <PlanBox rect={{ x0: x1 - 0.3, x1, z0: depth, z1: 0 }} y0={y0} y1={y1} material={MATERIALS.fascia} />
      <PlanBox rect={{ x0, x1: x0 + 0.5, z0: depth, z1: 0 }} y0={y0} y1={y1} material={stone} />
      <PlanBox rect={{ x0, x1, z0: depth, z1: 0 }} y0={y1 - beam} y1={y1} material={MATERIALS.fascia} />
      <PlanBox rect={{ x0: x0 + 0.5, x1: x1 - 0.3, z0: depth + 0.04, z1: 0 }} y0={y1 - beam - 0.012} y1={y1 - beam} material={cladding} shadow={false} />
      {[1.2, 2.3, 3.4].map((x) => (
        <Downlight key={x} x={x} z={-0.22} y={y1 - beam - 0.012} material={MATERIALS.glow} />
      ))}
      {/* Planter along the frame's foot, with greenery spilling over the front. */}
      <PlanBox rect={{ x0: x0 + 0.5, x1: x1 - 0.3, z0: -0.65, z1: 0 }} y0={y0} y1={FF + 0.3} material={stone} />
      {Array.from({ length: 16 }, (_, i) => {
        const x = x0 + 0.65 + (i * (x1 - x0 - 1.1)) / 15;
        const v = (i * 7) % 5;
        return (
          <group key={i}>
            <Foliage x={x} z={-0.38} y={FF + 0.42 + v * 0.025} r={0.17 + v * 0.015} />
            {/* Trailing growth spilling over the planter's front edge. */}
            {i % 2 === 0 && <Foliage x={x - 0.06} z={-0.68} y={FF + 0.25} r={0.06 + v * 0.008} stretch={2.5 + v * 0.4} />}
          </group>
        );
      })}
      <Slats x0={0.7} x1={1.95} count={10} z={-0.14} y0={FF + 0.3} y1={y1 - beam} />
      <Sconce rect={{ x0: x0 + 0.5, x1: x0 + 0.56, z0: -0.3, z1: -0.18 }} y={FF + 1.4} />
    </>
  );
}

/** Timber slat screen at the balcony's east end. */
function BalconyScreen() {
  return <Slats x0={BALCONY_RECT.x1 - 0.9} x1={BALCONY_RECT.x1 - 0.12} count={7} z={BALCONY_RECT.z0 + 0.1} y0={FF} y1={ROOF_TOP - 0.2} />;
}

/** Facade features by exterior wall id. */
export const WALL_DECOR: Record<string, () => ReactNode> = {
  "gf-ext-front": () => <EntrancePortico />,
  "ff-ext-front": () => (
    <>
      <FramedGlazing />
      <BalconyScreen />
    </>
  ),
};

/** White eave over the balcony with a timber soffit and downlights (part of the roof). */
export function BalconyEave() {
  const { cladding } = facadeMaterials();
  const eave: PlanRect = { x0: BALCONY_RECT.x0 - 0.15, x1: BALCONY_RECT.x1 + 0.15, z0: BALCONY_RECT.z0 - 0.3, z1: 0 };
  const y0 = ROOF_TOP - 0.2;
  return (
    <>
      <PlanBox rect={eave} y0={y0} y1={ROOF_TOP + 0.1} material={MATERIALS.eave} />
      <PlanBox rect={{ x0: eave.x0 + 0.08, x1: eave.x1 - 0.08, z0: eave.z0 + 0.08, z1: 0 }} y0={y0 - 0.012} y1={y0} material={cladding} shadow={false} />
      {[6.4, 7.25, 8.1].map((x) => (
        <Downlight key={x} x={x} z={-0.7} y={y0 - 0.012} material={MATERIALS.glow} />
      ))}
    </>
  );
}
