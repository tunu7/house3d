"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { planToWorld } from "@/lib/architecture/geometry";
import { boundaryWallRuns, GAZEBO, STEPPING_STONES, VEGETABLE_BEDS } from "@/lib/architecture/landscape";
import { PLOT_BOUNDS } from "@/lib/architecture/plot";
import { BOUNDARY_WALL, DRIVEWAY, GATES, GROUND_LEVEL } from "@/lib/architecture/site";
import type { PlanPoint, PlanRect } from "@/types/architecture";
import { clump } from "./foliage";
import { MATERIALS } from "./materials";
import { MergeStatic } from "./MergeStatic";
import { PlanBox } from "./PlanBox";
import { facadeMaterials } from "./textures";

/** Deterministic PRNG so the planting is identical on every load. */
function rng(seed: number) {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

/** A box along a plan segment in any direction, `width` thick, from y0 to y1, lengthened by `extend` at both ends. */
function SegmentBox({ a, b, width, y0, y1, material, extend = 0 }: { a: PlanPoint; b: PlanPoint; width: number; y0: number; y1: number; material: THREE.Material; extend?: number }) {
  const [ax, az] = planToWorld(a.x, a.z);
  const [bx, bz] = planToWorld(b.x, b.z);
  return (
    <mesh position={[(ax + bx) / 2, (y0 + y1) / 2, (az + bz) / 2]} rotation-y={-Math.atan2(bz - az, bx - ax)} material={material} castShadow receiveShadow>
      <boxGeometry args={[Math.hypot(bx - ax, bz - az) + 2 * extend, y1 - y0, width]} />
    </mesh>
  );
}

const PILLAR = 0.45;
const PILLAR_SPACING = 4;

/** Rendered compound wall with charcoal coping and stone pillars at the corners, the gates and along the front. */
function BoundaryWall() {
  const { stone } = facadeMaterials();
  const runs = useMemo(() => boundaryWallRuns(), []);
  const t = BOUNDARY_WALL.thickness;
  const pillars = useMemo(() => {
    const out: { p: PlanPoint; height: number }[] = [];
    for (const r of runs) {
      const len = Math.hypot(r.b.x - r.a.x, r.b.z - r.a.z);
      const n = r.height < BOUNDARY_WALL.height ? Math.max(1, Math.round(len / PILLAR_SPACING)) : 1;
      for (let i = 0; i <= n; i++) out.push({ p: { x: r.a.x + ((r.b.x - r.a.x) * i) / n, z: r.a.z + ((r.b.z - r.a.z) * i) / n }, height: r.height });
    }
    return out;
  }, [runs]);
  return (
    <>
      {runs.map((r, i) => (
        <group key={i}>
          <SegmentBox a={r.a} b={r.b} width={t} y0={GROUND_LEVEL} y1={GROUND_LEVEL + r.height} material={MATERIALS.exteriorWall} extend={t / 2} />
          <SegmentBox a={r.a} b={r.b} width={t + 0.06} y0={GROUND_LEVEL + r.height} y1={GROUND_LEVEL + r.height + 0.06} material={MATERIALS.fascia} extend={t / 2 + 0.03} />
        </group>
      ))}
      {pillars.map(({ p, height }, i) => {
        const h = PILLAR / 2;
        const rect: PlanRect = { x0: p.x - h, x1: p.x + h, z0: p.z - h, z1: p.z + h };
        return (
          <group key={`p${i}`}>
            <PlanBox rect={rect} y0={GROUND_LEVEL} y1={GROUND_LEVEL + height + 0.2} material={stone} />
            <PlanBox rect={{ x0: rect.x0 - 0.04, x1: rect.x1 + 0.04, z0: rect.z0 - 0.04, z1: rect.z1 + 0.04 }} y0={GROUND_LEVEL + height + 0.2} y1={GROUND_LEVEL + height + 0.28} material={MATERIALS.fascia} />
          </group>
        );
      })}
    </>
  );
}

/** Charcoal steel gate leaf of vertical bars between rails, along x at depth z (or swung open along z). */
function GateLeaf({ from, to, z, height, open = false }: { from: number; to: number; z: number; height: number; open?: boolean }) {
  const bar = 0.03;
  const spacing = 0.13;
  const y0 = GROUND_LEVEL + 0.05;
  const y1 = GROUND_LEVEL + height;
  const len = to - from;
  // Closed: spans x from → to at depth z. Open: hinged at `from`, swung into the plot along +z.
  const rect = (a: number, b: number, w: number): PlanRect =>
    open ? { x0: from - w / 2, x1: from + w / 2, z0: z + a, z1: z + b } : { x0: from + a, x1: from + b, z0: z - w / 2, z1: z + w / 2 };
  const bars = Array.from({ length: Math.floor(len / spacing) }, (_, i) => (i + 0.5) * (len / Math.floor(len / spacing)));
  return (
    <>
      {[y0, (y0 + y1) / 2, y1 - 0.05].map((y, i) => (
        <PlanBox key={`r${i}`} rect={rect(0, len, 0.05)} y0={y} y1={y + 0.05} material={MATERIALS.frame} />
      ))}
      {bars.map((c, i) => (
        <PlanBox key={i} rect={rect(c - bar / 2, c + bar / 2, bar)} y0={y0} y1={y1} material={MATERIALS.frame} />
      ))}
    </>
  );
}

/** Raised timber bed with soil and rows of leafy vegetables. */
function VegetableBed({ rect, seed }: { rect: PlanRect; seed: number }) {
  const plants = useMemo(() => {
    const rand = rng(seed);
    const out: { x: number; z: number; r: number }[] = [];
    for (let z = rect.z0 + 0.4; z < rect.z1 - 0.3; z += 0.6) {
      for (let x = rect.x0 + 0.35; x < rect.x1 - 0.3; x += 0.4) out.push({ x: x + (rand() - 0.5) * 0.08, z, r: 0.11 + rand() * 0.08 });
    }
    return out;
  }, [rect, seed]);
  const geo = useMemo(() => clump(1, seed, 1, 0.35), [seed]);
  const top = GROUND_LEVEL + 0.35;
  const b = 0.06;
  return (
    <>
      <PlanBox rect={{ ...rect, z1: rect.z0 + b }} y0={GROUND_LEVEL} y1={top} material={MATERIALS.timber} />
      <PlanBox rect={{ ...rect, z0: rect.z1 - b }} y0={GROUND_LEVEL} y1={top} material={MATERIALS.timber} />
      <PlanBox rect={{ ...rect, x1: rect.x0 + b, z0: rect.z0 + b, z1: rect.z1 - b }} y0={GROUND_LEVEL} y1={top} material={MATERIALS.timber} />
      <PlanBox rect={{ ...rect, x0: rect.x1 - b, z0: rect.z0 + b, z1: rect.z1 - b }} y0={GROUND_LEVEL} y1={top} material={MATERIALS.timber} />
      <PlanBox rect={{ x0: rect.x0 + b, x1: rect.x1 - b, z0: rect.z0 + b, z1: rect.z1 - b }} y0={GROUND_LEVEL} y1={top - 0.05} material={MATERIALS.soil} />
      {plants.map((p, i) => {
        const [x, z] = planToWorld(p.x, p.z);
        return <mesh key={i} geometry={geo} position={[x, top - 0.05 + p.r * 0.6, z]} scale={[p.r, p.r * 0.8, p.r]} material={MATERIALS.leaf} castShadow />;
      })}
    </>
  );
}

/** Timber gazebo: a raised floor, four posts, an eaves frame, a pyramid shingle roof, and benches on two sides. */
function Gazebo() {
  const { x, z, size, height } = GAZEBO;
  const h = size / 2;
  const floor = GROUND_LEVEL + 0.15;
  const eaves = GROUND_LEVEL + height;
  const post = 0.16;
  const [wx, wz] = planToWorld(x, z);
  const corners = [
    [x - h + post, z - h + post],
    [x + h - post, z - h + post],
    [x + h - post, z + h - post],
    [x - h + post, z + h - post],
  ];
  return (
    <>
      <PlanBox rect={{ x0: x - h, x1: x + h, z0: z - h, z1: z + h }} y0={GROUND_LEVEL} y1={floor} material={MATERIALS.path} />
      {corners.map(([cx, cz], i) => (
        <PlanBox key={i} rect={{ x0: cx - post / 2, x1: cx + post / 2, z0: cz - post / 2, z1: cz + post / 2 }} y0={floor} y1={eaves} material={MATERIALS.timber} />
      ))}
      {/* Eaves frame. */}
      <PlanBox rect={{ x0: x - h, x1: x + h, z0: z - h, z1: z - h + 0.12 }} y0={eaves} y1={eaves + 0.18} material={MATERIALS.timber} />
      <PlanBox rect={{ x0: x - h, x1: x + h, z0: z + h - 0.12, z1: z + h }} y0={eaves} y1={eaves + 0.18} material={MATERIALS.timber} />
      <PlanBox rect={{ x0: x - h, x1: x - h + 0.12, z0: z - h, z1: z + h }} y0={eaves} y1={eaves + 0.18} material={MATERIALS.timber} />
      <PlanBox rect={{ x0: x + h - 0.12, x1: x + h, z0: z - h, z1: z + h }} y0={eaves} y1={eaves + 0.18} material={MATERIALS.timber} />
      {/* Benches on the back and left. */}
      <PlanBox rect={{ x0: x - h + 0.3, x1: x + h - 0.3, z0: z + h - 0.55, z1: z + h - 0.2 }} y0={floor + 0.4} y1={floor + 0.46} material={MATERIALS.timber} />
      <PlanBox rect={{ x0: x - h + 0.2, x1: x - h + 0.55, z0: z - h + 0.3, z1: z + h - 0.6 }} y0={floor + 0.4} y1={floor + 0.46} material={MATERIALS.timber} />
      {/* Pyramid roof: a four-sided cone turned square to the frame, with a deep overhang. */}
      <mesh position={[wx, eaves + 0.18 + 0.6, wz]} rotation-y={Math.PI / 4} material={MATERIALS.roofShingle} castShadow receiveShadow>
        <coneGeometry args={[size * 0.82, 1.2, 4]} />
      </mesh>
    </>
  );
}

/**
 * The grounds after the owner's site plan (R11): the compound wall with its
 * gates, the paved driveway and parking, stepping stones through the left
 * garden, the gazebo and the vegetable beds.
 */
export function Grounds() {
  const gateZ = PLOT_BOUNDS.z0 + BOUNDARY_WALL.thickness / 2;
  return (
    <MergeStatic>
      <BoundaryWall />
      <GateLeaf from={GATES.vehicle.x0} to={GATES.vehicle.x1} z={gateZ} height={1.6} />
      <GateLeaf from={GATES.pedestrian.x0} to={GATES.pedestrian.x1} z={gateZ + 0.15} height={1.4} open />
      <PlanBox rect={DRIVEWAY} y0={GROUND_LEVEL} y1={GROUND_LEVEL + 0.03} material={MATERIALS.paving} />
      {STEPPING_STONES.map((s, i) => (
        <PlanBox key={i} rect={{ x0: s.x - 0.3, x1: s.x + 0.3, z0: s.z - 0.22, z1: s.z + 0.22 }} y0={GROUND_LEVEL} y1={GROUND_LEVEL + 0.025} material={MATERIALS.path} />
      ))}
      <Gazebo />
      {VEGETABLE_BEDS.map((b, i) => (
        <VegetableBed key={i} rect={b} seed={311 + i * 17} />
      ))}
    </MergeStatic>
  );
}
