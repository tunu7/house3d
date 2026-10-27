"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { DOWNPIPES } from "@/lib/architecture/details";
import { planToWorld } from "@/lib/architecture/geometry";
import { ROOF_TOP } from "@/lib/architecture/dimensions";
import {
  BOLLARDS,
  GROUND_LEVEL,
  PATH,
  PLANTERS,
  POOL,
  PORCH,
  REAR_PATIO,
  STEP_TREADS,
  STEPS_FOOT_Z,
} from "@/lib/architecture/site";
import { FOOTPATH_FAR, FOOTPATH_NEAR, KERB_HEIGHT, ROAD } from "@/lib/architecture/landscape";
import type { PlanRect } from "@/types/architecture";
import { clump } from "./foliage";
import { Grounds } from "./Grounds";
import { Landscape } from "./Landscape";
import { MATERIALS } from "./materials";
import { MergeStatic } from "./MergeStatic";
import { PlanBox } from "./PlanBox";
import { PoolGym } from "./PoolGym";
import { facadeMaterials } from "./textures";

/** Ground runs out far enough to meet the haze; see GROUND_REPEAT in Lighting. */
export const GROUND_SIZE = 500;

/**
 * The ground: a square plane with the pool cut out of it (the basin sits
 * below ground level). UVs span 0–1 over the whole plane, as a plane's do, so
 * the lawn texture's repeat keeps its scale.
 */
function groundGeometry() {
  const h = GROUND_SIZE / 2;
  const shape = new THREE.Shape([new THREE.Vector2(-h, -h), new THREE.Vector2(h, -h), new THREE.Vector2(h, h), new THREE.Vector2(-h, h)]);
  // Shape (x, y) becomes world (x, −z) once the mesh is turned flat.
  const corner = (x: number, z: number) => {
    const [wx, wz] = planToWorld(x, z);
    return new THREE.Vector2(wx, -wz);
  };
  shape.holes.push(new THREE.Path([corner(POOL.x0, POOL.z0), corner(POOL.x0, POOL.z1), corner(POOL.x1, POOL.z1), corner(POOL.x1, POOL.z0)]));
  const g = new THREE.ShapeGeometry(shape);
  const pos = g.attributes.position;
  const uv = g.attributes.uv;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) + h) / GROUND_SIZE, (pos.getY(i) + h) / GROUND_SIZE);
  return g;
}
const SOIL_DROP = 0.06;
const PEBBLE_WIDTH = 0.25;

const FLOWER_MATERIALS = ["#d8343a", "#e46a92", "#f4f1ea", "#f2c14e", "#c8443b"].map(
  (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.8 }),
);
const SOIL = new THREE.MeshStandardMaterial({ color: "#4a3626", roughness: 1 });
/** Shared lumpy clump for shrubs and the planter tree's crown (scaled per mesh). */
const SHRUB = clump(1, 23, 2, 0.25);
const TRUNK = new THREE.MeshStandardMaterial({ color: "#6b5440", roughness: 0.9 });

/** Deterministic PRNG so the planting is identical on every load. */
function rng(seed: number) {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

/** Raised stone planter: shrubs along its length, blooms scattered over them, optional small tree. */
function Planter({ rect, height, seed, tree }: { rect: PlanRect; height: number; seed: number; tree?: number }) {
  const { stone } = facadeMaterials();
  const top = GROUND_LEVEL + height;
  const soil = top - SOIL_DROP;
  const plants = useMemo(() => {
    const rand = rng(seed);
    const w = rect.x1 - rect.x0;
    const d = rect.z1 - rect.z0;
    const at = (m: number) => planToWorld(rect.x0 + m + rand() * (w - 2 * m), rect.z0 + m + rand() * (d - 2 * m));
    const count = Math.round(w * 4);
    return {
      shrubs: Array.from({ length: count }, () => ({ p: at(0.15), r: 0.12 + rand() * 0.1 })),
      blooms: Array.from({ length: count * 4 }, () => ({
        p: at(0.1),
        y: 0.12 + rand() * 0.22,
        r: 0.03 + rand() * 0.02,
        m: FLOWER_MATERIALS[Math.floor(rand() * FLOWER_MATERIALS.length)],
      })),
    };
  }, [rect, seed]);
  const inner: PlanRect = { x0: rect.x0 + 0.06, x1: rect.x1 - 0.06, z0: rect.z0 + 0.06, z1: rect.z1 - 0.06 };
  const treeAt = tree !== undefined ? planToWorld(tree, (rect.z0 + rect.z1) / 2) : null;
  return (
    <group>
      <PlanBox rect={rect} y0={GROUND_LEVEL} y1={top} material={stone} />
      <PlanBox rect={inner} y0={soil} y1={soil + 0.005} material={SOIL} shadow={false} />
      {plants.shrubs.map((s, i) => (
        <mesh key={`s${i}`} position={[s.p[0], soil + s.r * 0.7, s.p[1]]} scale={s.r} geometry={SHRUB} material={MATERIALS.leaf} castShadow />
      ))}
      {plants.blooms.map((b, i) => (
        <mesh key={`b${i}`} position={[b.p[0], soil + b.y, b.p[1]]} material={b.m}>
          <icosahedronGeometry args={[b.r, 0]} />
        </mesh>
      ))}
      {treeAt && (
        <>
          <mesh position={[treeAt[0], soil + 1.1, treeAt[1]]} material={TRUNK} castShadow>
            <cylinderGeometry args={[0.03, 0.05, 2.2, 8]} />
          </mesh>
          {[0, 1, 2].map((k) => (
            <mesh
              key={k}
              position={[treeAt[0] + (k - 1) * 0.25, soil + 2.0 + k * 0.35, treeAt[1] + (k % 2) * 0.15]}
              scale={0.45 - k * 0.08}
              geometry={SHRUB}
              material={MATERIALS.leaf}
              castShadow
            />
          ))}
        </>
      )}
    </group>
  );
}

/** Rainwater downpipe from the parapet hopper to a ground shoe. */
function Downpipe({ x, z }: { x: number; z: number }) {
  const [wx, wz] = planToWorld(x, z);
  const top = ROOF_TOP + 0.3;
  return (
    <group position={[wx, 0, wz]}>
      <mesh position-y={(GROUND_LEVEL + top) / 2} material={MATERIALS.pipe} castShadow>
        <cylinderGeometry args={[0.05, 0.05, top - GROUND_LEVEL, 12]} />
      </mesh>
      <mesh position-y={top + 0.08} material={MATERIALS.pipe} castShadow>
        <boxGeometry args={[0.22, 0.18, 0.16]} />
      </mesh>
    </group>
  );
}

/** Bollard: charcoal post with a glowing head. */
function Bollard({ x, z }: { x: number; z: number }) {
  const r = (s: number): PlanRect => ({ x0: x - s, x1: x + s, z0: z - s, z1: z + s });
  return (
    <>
      <PlanBox rect={r(0.07)} y0={GROUND_LEVEL} y1={GROUND_LEVEL + 0.5} material={MATERIALS.fascia} />
      <PlanBox rect={r(0.055)} y0={GROUND_LEVEL + 0.5} y1={GROUND_LEVEL + 0.6} material={MATERIALS.glow} shadow={false} />
      <PlanBox rect={r(0.075)} y0={GROUND_LEVEL + 0.6} y1={GROUND_LEVEL + 0.65} material={MATERIALS.fascia} />
    </>
  );
}

/** Street in front of the plot: kerbed footpaths each side of an asphalt carriageway with a dashed centre line. */
function Street() {
  const mid = (ROAD.z0 + ROAD.z1) / 2;
  const dashes = Array.from({ length: 48 }, (_, i) => -60 + i * 3);
  return (
    <>
      <PlanBox rect={ROAD} y0={GROUND_LEVEL - 0.02} y1={GROUND_LEVEL + 0.01} material={MATERIALS.asphalt} shadow={false} />
      <PlanBox rect={FOOTPATH_NEAR} y0={GROUND_LEVEL - 0.02} y1={GROUND_LEVEL + KERB_HEIGHT} material={MATERIALS.path} shadow={false} />
      <PlanBox rect={FOOTPATH_FAR} y0={GROUND_LEVEL - 0.02} y1={GROUND_LEVEL + KERB_HEIGHT} material={MATERIALS.path} shadow={false} />
      {dashes.map((x) => (
        <PlanBox key={x} rect={{ x0: x, x1: x + 1.5, z0: mid - 0.06, z1: mid + 0.06 }} y0={GROUND_LEVEL} y1={GROUND_LEVEL + 0.013} material={MATERIALS.marking} shadow={false} />
      ))}
    </>
  );
}

/**
 * Site after the owner's reference photo (R9) and site plan (R11): lawn,
 * covered porch, wide lit steps, long stone planters with flowers and a small
 * tree, a pale path edged with pebbles and bollards to the front gate, the
 * paved rear open area (R2), the pool and gym, and the walled grounds.
 */
export function Site() {
  const path: PlanRect = { x0: PATH.x0, x1: PATH.x1, z0: STEPS_FOOT_Z - PATH.length, z1: STEPS_FOOT_Z };
  const ground = useMemo(() => groundGeometry(), []);
  return (
    <group>
      <mesh geometry={ground} rotation-x={-Math.PI / 2} position-y={GROUND_LEVEL} material={MATERIALS.ground} receiveShadow />
      <MergeStatic>
        <PlanBox rect={path} y0={GROUND_LEVEL} y1={GROUND_LEVEL + 0.02} material={MATERIALS.path} />
        <PlanBox rect={{ ...path, x0: path.x0 - PEBBLE_WIDTH, x1: path.x0 }} y0={GROUND_LEVEL} y1={GROUND_LEVEL + 0.015} material={MATERIALS.pebbles} />
        <PlanBox rect={{ ...path, x0: path.x1, x1: path.x1 + PEBBLE_WIDTH }} y0={GROUND_LEVEL} y1={GROUND_LEVEL + 0.015} material={MATERIALS.pebbles} />
        <PlanBox rect={PORCH} y0={GROUND_LEVEL} y1={0} material={MATERIALS.path} />
        {STEP_TREADS.map((t, i) => (
          <group key={i}>
            <PlanBox rect={t.rect} y0={GROUND_LEVEL} y1={t.top} material={MATERIALS.path} />
            {/* Light strip tucked under the nosing of the step above. */}
            <PlanBox
              rect={{ x0: t.rect.x0 + 0.05, x1: t.rect.x1 - 0.05, z0: t.rect.z1 - 0.004, z1: t.rect.z1 + 0.004 }}
              y0={t.top + 0.03}
              y1={t.top + 0.05}
              material={MATERIALS.glow}
              shadow={false}
            />
          </group>
        ))}
        <PlanBox
          rect={{ x0: PORCH.x0 + 0.05, x1: PORCH.x1 - 0.05, z0: STEPS_FOOT_Z - 0.004, z1: STEPS_FOOT_Z + 0.004 }}
          y0={GROUND_LEVEL + 0.03}
          y1={GROUND_LEVEL + 0.05}
          material={MATERIALS.glow}
          shadow={false}
        />
        <PlanBox rect={REAR_PATIO.rect} y0={GROUND_LEVEL} y1={REAR_PATIO.top} material={MATERIALS.path} />
        {PLANTERS.map((p, i) => (
          <Planter key={i} rect={p.rect} height={p.height} seed={17 + i * 31} tree={i === 1 ? p.rect.x1 - 0.6 : undefined} />
        ))}
        {BOLLARDS.map((b, i) => (
          <Bollard key={i} x={b.x} z={b.z} />
        ))}
        {DOWNPIPES.map((p, i) => (
          <Downpipe key={`pipe${i}`} x={p.x} z={p.z} />
        ))}
        <Street />
      </MergeStatic>
      <PoolGym />
      <Grounds />
      <Landscape />
    </group>
  );
}
