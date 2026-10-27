"use client";

import { FURN } from "@/components/furniture/parts";
import { DECK_TOP, GROUND_LEVEL, GYM, GYM_WALLS, POOL, POOL_DECK, POOL_DEPTH } from "@/lib/architecture/site";
import type { PlanRect } from "@/types/architecture";
import { MATERIALS } from "./materials";
import { MergeStatic } from "./MergeStatic";
import { PlanBox } from "./PlanBox";
import { facadeMaterials } from "./textures";

const COPING = 0.3;
/** Water stands this far below the deck. */
const FREEBOARD = 0.12;
const TILE = 0.06;

/** Sun lounger with its length along x: slatted frame, cushion, raised back toward `head`. */
function Lounger({ x0, z, head }: { x0: number; z: number; head: "start" | "end" }) {
  const len = 1.9;
  const w = 0.68;
  const rect: PlanRect = { x0, x1: x0 + len, z0: z - w / 2, z1: z + w / 2 };
  const back: PlanRect = head === "start" ? { ...rect, x1: x0 + 0.55 } : { ...rect, x0: x0 + len - 0.55 };
  return (
    <>
      <PlanBox rect={rect} y0={DECK_TOP + 0.08} y1={DECK_TOP + 0.3} material={MATERIALS.timber} />
      <PlanBox rect={{ x0: rect.x0 + 0.04, x1: rect.x1 - 0.04, z0: rect.z0 + 0.04, z1: rect.z1 - 0.04 }} y0={DECK_TOP + 0.3} y1={DECK_TOP + 0.38} material={FURN.linen} />
      <PlanBox rect={{ x0: back.x0 + 0.04, x1: back.x1 - 0.04, z0: back.z0 + 0.04, z1: back.z1 - 0.04 }} y0={DECK_TOP + 0.38} y1={DECK_TOP + 0.62} material={FURN.linen} />
      {[rect.x0 + 0.1, rect.x1 - 0.14].flatMap((lx) =>
        [rect.z0 + 0.04, rect.z1 - 0.08].map((lz) => <PlanBox key={`${lx}${lz}`} rect={{ x0: lx, x1: lx + 0.04, z0: lz, z1: lz + 0.04 }} y0={DECK_TOP} y1={DECK_TOP + 0.08} material={MATERIALS.timber} />),
      )}
    </>
  );
}

/** Timber deck with a sunken, tiled pool: coping, water and two loungers. */
function Pool() {
  const { cladding } = facadeMaterials();
  const d = POOL_DECK;
  const p = POOL;
  const bottom = DECK_TOP - POOL_DEPTH;
  const inner: PlanRect = { x0: p.x0 + TILE, x1: p.x1 - TILE, z0: p.z0 + TILE, z1: p.z1 - TILE };
  return (
    <>
      {/* Deck around the pool. */}
      <PlanBox rect={{ ...d, z1: p.z0 }} y0={GROUND_LEVEL} y1={DECK_TOP} material={cladding} />
      <PlanBox rect={{ ...d, z0: p.z1 }} y0={GROUND_LEVEL} y1={DECK_TOP} material={cladding} />
      <PlanBox rect={{ x0: d.x0, x1: p.x0, z0: p.z0, z1: p.z1 }} y0={GROUND_LEVEL} y1={DECK_TOP} material={cladding} />
      <PlanBox rect={{ x0: p.x1, x1: d.x1, z0: p.z0, z1: p.z1 }} y0={GROUND_LEVEL} y1={DECK_TOP} material={cladding} />
      {/* Stone coping. */}
      <PlanBox rect={{ x0: p.x0 - COPING, x1: p.x1 + COPING, z0: p.z0 - COPING, z1: p.z0 }} y0={DECK_TOP} y1={DECK_TOP + 0.03} material={MATERIALS.path} />
      <PlanBox rect={{ x0: p.x0 - COPING, x1: p.x1 + COPING, z0: p.z1, z1: p.z1 + COPING }} y0={DECK_TOP} y1={DECK_TOP + 0.03} material={MATERIALS.path} />
      <PlanBox rect={{ x0: p.x0 - COPING, x1: p.x0, z0: p.z0, z1: p.z1 }} y0={DECK_TOP} y1={DECK_TOP + 0.03} material={MATERIALS.path} />
      <PlanBox rect={{ x0: p.x1, x1: p.x1 + COPING, z0: p.z0, z1: p.z1 }} y0={DECK_TOP} y1={DECK_TOP + 0.03} material={MATERIALS.path} />
      {/* Tiled basin (walls just inside the hole cut in the ground) and water. */}
      <PlanBox rect={{ ...p, z1: inner.z0 }} y0={bottom} y1={DECK_TOP} material={MATERIALS.poolTile} />
      <PlanBox rect={{ ...p, z0: inner.z1 }} y0={bottom} y1={DECK_TOP} material={MATERIALS.poolTile} />
      <PlanBox rect={{ x0: p.x0, x1: inner.x0, z0: inner.z0, z1: inner.z1 }} y0={bottom} y1={DECK_TOP} material={MATERIALS.poolTile} />
      <PlanBox rect={{ x0: inner.x1, x1: p.x1, z0: inner.z0, z1: inner.z1 }} y0={bottom} y1={DECK_TOP} material={MATERIALS.poolTile} />
      <PlanBox rect={inner} y0={bottom - TILE} y1={bottom} material={MATERIALS.poolTile} />
      <PlanBox rect={inner} y0={bottom} y1={DECK_TOP - FREEBOARD} material={MATERIALS.water} shadow={false} />
      <Lounger x0={-1.2} z={11.05} head="start" />
      <Lounger x0={1.2} z={11.05} head="start" />
    </>
  );
}

/** Open-air gym on rubber flooring behind Bedroom 1: low walls, a power rack, bench, treadmill and dumbbell rack. */
function Gym() {
  const g = GYM;
  const top = DECK_TOP;
  const steel = FURN.steel;
  const black = MATERIALS.fascia;
  const post = (x: number, z: number, h: number, s = 0.07) => (
    <PlanBox key={`${x},${z}`} rect={{ x0: x - s / 2, x1: x + s / 2, z0: z - s / 2, z1: z + s / 2 }} y0={top} y1={top + h} material={black} />
  );
  // Power rack in the back-left corner.
  const rack = { x0: g.x0 + 0.6, x1: g.x0 + 1.8, z0: g.z1 - 1.6, z1: g.z1 - 0.5 };
  return (
    <>
      <PlanBox rect={g} y0={GROUND_LEVEL} y1={top} material={MATERIALS.rubber} />
      {GYM_WALLS.map((w, i) => (
        <group key={i}>
          <PlanBox rect={w.rect} y0={GROUND_LEVEL} y1={top + w.height} material={MATERIALS.exteriorWall} />
          <PlanBox rect={{ x0: w.rect.x0 - 0.02, x1: w.rect.x1 + 0.02, z0: w.rect.z0 - 0.02, z1: w.rect.z1 + 0.02 }} y0={top + w.height} y1={top + w.height + 0.05} material={MATERIALS.fascia} />
        </group>
      ))}
      {[rack.x0, rack.x1].flatMap((x) => [rack.z0, rack.z1].map((z) => post(x, z, 2.2)))}
      <PlanBox rect={{ ...rack, z1: rack.z0 + 0.07 }} y0={top + 2.13} y1={top + 2.2} material={black} />
      <PlanBox rect={{ ...rack, z0: rack.z1 - 0.07 }} y0={top + 2.13} y1={top + 2.2} material={black} />
      {/* Barbell on the hooks, with plates. */}
      <PlanBox rect={{ x0: rack.x0 - 0.25, x1: rack.x1 + 0.25, z0: rack.z0 + 0.02, z1: rack.z0 + 0.05 }} y0={top + 1.35} y1={top + 1.38} material={steel} />
      {[rack.x0 - 0.18, rack.x1 + 0.12].map((x) => (
        <PlanBox key={x} rect={{ x0: x, x1: x + 0.06, z0: rack.z0 - 0.19, z1: rack.z0 + 0.26 }} y0={top + 1.14} y1={top + 1.59} material={black} />
      ))}
      {/* Flat bench. */}
      <PlanBox rect={{ x0: g.x0 + 2.4, x1: g.x0 + 2.7, z0: g.z0 + 1.4, z1: g.z0 + 2.6 }} y0={top + 0.38} y1={top + 0.46} material={black} />
      {post(g.x0 + 2.55, g.z0 + 1.55, 0.38, 0.05)}
      {post(g.x0 + 2.55, g.z0 + 2.45, 0.38, 0.05)}
      {/* Treadmill along the right wall. */}
      <PlanBox rect={{ x0: g.x1 - 1.05, x1: g.x1 - 0.35, z0: g.z0 + 0.6, z1: g.z0 + 2.4 }} y0={top} y1={top + 0.2} material={black} />
      {post(g.x1 - 1.0, g.z1 - 2.55, 1.2, 0.05)}
      {post(g.x1 - 0.4, g.z1 - 2.55, 1.2, 0.05)}
      <PlanBox rect={{ x0: g.x1 - 1.05, x1: g.x1 - 0.35, z0: g.z0 + 2.35, z1: g.z0 + 2.5 }} y0={top + 1.15} y1={top + 1.3} material={black} />
      {/* Dumbbell rack against the back wall. */}
      <PlanBox rect={{ x0: g.x0 + 2.3, x1: g.x0 + 3.7, z0: g.z1 - 0.65, z1: g.z1 - 0.3 }} y0={top} y1={top + 0.55} material={black} />
      {Array.from({ length: 6 }, (_, i) => g.x0 + 2.42 + i * 0.22).map((x) => (
        <PlanBox key={x} rect={{ x0: x, x1: x + 0.14, z0: g.z1 - 0.62, z1: g.z1 - 0.33 }} y0={top + 0.55} y1={top + 0.67} material={steel} />
      ))}
    </>
  );
}

/** Attached pool and gym across the back of the house (R11). */
export function PoolGym() {
  return (
    <MergeStatic>
      <Pool />
      <Gym />
    </MergeStatic>
  );
}
