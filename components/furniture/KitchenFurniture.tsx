"use client";

import { MATERIALS } from "@/components/architecture/materials";
import { Arch, B, Cyl, FURN, Lathe, type PieceProps } from "./parts";

const TOP = 0.9;
const MODULE = 0.6;
/** Gap between cabinet fronts: the dark shadow line that makes joinery read as doors. */
const GAP = 0.004;

/**
 * Base cabinets with an engineered-stone worktop: recessed plinth, separate
 * lacquered door fronts with shadow gaps and bar handles, and optional sink
 * and hob (local-X offsets). Under the hob, an oven replaces the door.
 */
export function Counter({ w, d, sinkAt, hobAt }: PieceProps & { sinkAt?: number; hobAt?: number }) {
  const modules = Math.max(1, Math.round(w / MODULE));
  const mw = w / modules;
  const front = d / 2 - 0.02;
  return (
    <group>
      <B p={[0, 0.05, -0.05]} s={[w, 0.1, d - 0.1]} m={FURN.dark} bevel={0.002} />
      <B p={[0, 0.49, -0.01]} s={[w, 0.78, d - 0.02]} m={FURN.lacquer} bevel={0.002} />
      <B p={[0, TOP - 0.02, 0.01]} s={[w, 0.04, d + 0.02]} m={FURN.stone} bevel={0.004} />
      {Array.from({ length: modules }, (_, i) => {
        const cx = -w / 2 + mw * (i + 0.5);
        const isOven = hobAt !== undefined && Math.abs(cx - hobAt) < mw / 2;
        if (isOven) return <Oven key={i} x={cx} w={mw} z={front} />;
        return (
          <group key={i}>
            <B p={[cx, 0.49, front + 0.009]} s={[mw - GAP, 0.76, 0.018]} m={FURN.lacquer} bevel={0.002} />
            <B p={[cx, 0.82, front + 0.03]} s={[Math.min(0.32, mw - 0.16), 0.012, 0.012]} m={FURN.steel} bevel={0.004} />
            {[-1, 1].map((s) => (
              <B key={s} p={[cx + s * (Math.min(0.32, mw - 0.16) / 2 - 0.01), 0.82, front + 0.022]} s={[0.01, 0.01, 0.02]} m={FURN.steel} bevel={0.002} />
            ))}
          </group>
        );
      })}
      {sinkAt !== undefined && (
        <group position-x={sinkAt}>
          {/* Undermount bowl: dark interior seen through the cut-out, steel rim. */}
          <B p={[0, TOP - 0.015, 0.02]} s={[0.56, 0.012, 0.4]} m={FURN.steel} bevel={0.003} />
          <B p={[0, TOP - 0.01, 0.02]} s={[0.5, 0.012, 0.34]} m={FURN.dark} bevel={0.02} />
          <Cyl p={[0, TOP, -d / 2 + 0.07]} r={0.025} h={0.04} m={FURN.steel} seg={20} />
          <Arch p={[0, TOP + 0.04, -d / 2 + 0.07]} rise={0.28} reach={0.2} r={0.012} m={FURN.steel} />
          <B p={[0.05, TOP + 0.06, -d / 2 + 0.07]} s={[0.012, 0.012, 0.07]} m={FURN.steel} bevel={0.004} />
          {/* Chopping board and a utensil jar beside the sink. */}
          <B p={[0.45, TOP + 0.009, -0.02]} s={[0.4, 0.018, 0.28]} m={FURN.oak} bevel={0.006} />
          <Lathe p={[-0.42, TOP, -d / 2 + 0.1]} id="utensil-jar" m={FURN.glaze} profile={[[0, 0], [0.055, 0], [0.06, 0.16], [0.055, 0.16], [0.05, 0.01], [0, 0.01]]} />
          {[-0.02, 0.015, 0].map((x, i) => (
            <Cyl key={i} p={[-0.42 + x, TOP + 0.02, -d / 2 + 0.1 + (i - 1) * 0.015]} r={0.006} h={0.28 - i * 0.03} m={i === 1 ? FURN.oak : FURN.dark} seg={6} rot={[(i - 1) * 0.12, 0, x * 3]} />
          ))}
        </group>
      )}
      {hobAt !== undefined && (
        <group position-x={hobAt}>
          <B p={[0, TOP + 0.003, 0.02]} s={[0.6, 0.008, 0.52]} m={FURN.hobGlass} bevel={0.003} />
          {/* Kettle on the back right of the worktop. */}
          <group position={[0.45, TOP, -0.08]}>
            <Lathe p={[0, 0, 0]} id="kettle" m={FURN.steel} profile={[[0, 0], [0.085, 0], [0.09, 0.02], [0.08, 0.17], [0.05, 0.21], [0.02, 0.215], [0, 0.215]]} />
            <Arch p={[0, 0.1, 0.07]} rise={0.08} reach={-0.1} r={0.012} m={FURN.dark} />
          </group>
        </group>
      )}
    </group>
  );
}

/** Built-in oven: black glass door with a steel handle and control strip. */
function Oven({ x, w, z }: { x: number; w: number; z: number }) {
  return (
    <group position-x={x}>
      <B p={[0, 0.79, z + 0.009]} s={[w - GAP, 0.1, 0.018]} m={FURN.dark} bevel={0.002} />
      {[-0.15, -0.08, 0.08, 0.15].map((dx) => (
        <Cyl key={dx} p={[dx, 0.79, z + 0.018]} r={0.016} h={0.02} m={FURN.steel} rot={[Math.PI / 2, 0, 0]} />
      ))}
      <B p={[0, 0.46, z + 0.009]} s={[w - GAP, 0.56, 0.018]} m={FURN.hobGlass} bevel={0.003} />
      <B p={[0, 0.7, z + 0.035]} s={[w - 0.12, 0.016, 0.016]} m={FURN.steel} bevel={0.006} />
      <B p={[0, 0.14, z + 0.009]} s={[w - GAP, 0.08, 0.018]} m={FURN.lacquer} bevel={0.002} />
    </group>
  );
}

/** Wall cabinets: separate door fronts, a soffit shadow line, and a warm LED strip underneath. */
export function UpperCabinet({ w, d, elevation = 1.5, height = 0.7 }: PieceProps & { elevation?: number; height?: number }) {
  const doors = Math.max(1, Math.round(w / 0.4));
  const dw = w / doors;
  return (
    <group>
      <B p={[0, elevation + height / 2, -0.01]} s={[w, height, d - 0.02]} m={FURN.lacquer} bevel={0.002} />
      {Array.from({ length: doors }, (_, i) => (
        <group key={i}>
          <B p={[-w / 2 + dw * (i + 0.5), elevation + height / 2, d / 2 - 0.009]} s={[dw - GAP, height - GAP, 0.018]} m={FURN.lacquer} bevel={0.002} />
          <B p={[-w / 2 + dw * (i + 0.5) + (i % 2 ? -1 : 1) * (dw / 2 - 0.05), elevation + 0.06, d / 2 + 0.008]} s={[0.012, 0.1, 0.014]} m={FURN.steel} bevel={0.004} />
        </group>
      ))}
      <B p={[0, elevation - 0.004, d / 2 - 0.05]} s={[w - 0.06, 0.006, 0.02]} m={MATERIALS.bulb} bevel={0} />
    </group>
  );
}

/** Chimney hood: slim stainless canopy at `elevation` with a flue to the ceiling line. */
export function Hood({ w, d, elevation = 1.6 }: PieceProps & { elevation?: number }) {
  const flueTop = 2.7;
  const flueBase = elevation + 0.06;
  return (
    <group>
      <B p={[0, elevation + 0.03, 0]} s={[w, 0.06, d]} m={FURN.steel} bevel={0.006} />
      <B p={[0, elevation - 0.002, 0.02]} s={[w - 0.12, 0.004, d - 0.12]} m={FURN.dark} bevel={0} />
      <B p={[0, (flueBase + flueTop) / 2, -d / 2 + 0.14]} s={[0.26, flueTop - flueBase, 0.24]} m={FURN.steel} bevel={0.004} />
    </group>
  );
}

/** Stainless fridge-freezer: two doors with a shadow gap and full-height bar handles. */
export function Fridge({ w, d }: PieceProps) {
  return (
    <group>
      <B p={[0, 0.9, -0.02]} s={[w, 1.8, d - 0.04]} m={FURN.steel} bevel={0.01} />
      <B p={[0, 1.33, d / 2 - 0.015]} s={[w - 0.006, 0.94, 0.03]} m={FURN.steel} bevel={0.008} />
      <B p={[0, 0.43, d / 2 - 0.015]} s={[w - 0.006, 0.82, 0.03]} m={FURN.steel} bevel={0.008} />
      <Cyl p={[w / 2 - 0.06, 0.95, d / 2 + 0.03]} r={0.012} h={0.5} m={FURN.steel} seg={12} />
      <Cyl p={[w / 2 - 0.06, 0.45, d / 2 + 0.03]} r={0.012} h={0.36} m={FURN.steel} seg={12} />
    </group>
  );
}

/** Counter-height breakfast table between kitchen and dining (R5): oak slab top on two panel legs. */
export function BarTable({ w, d }: PieceProps) {
  return (
    <group>
      <B p={[0, TOP - 0.02, 0]} s={[w, 0.04, d]} m={FURN.oak} bevel={0.008} />
      {[-1, 1].map((s) => (
        <B key={s} p={[s * (w / 2 - 0.06), (TOP - 0.04) / 2, 0]} s={[0.04, TOP - 0.04, d - 0.08]} m={FURN.oak} bevel={0.006} />
      ))}
      <B p={[0, 0.2, 0]} s={[w - 0.16, 0.03, 0.03]} m={FURN.oak} bevel={0.006} />
    </group>
  );
}

/** Bar stool: upholstered round seat on a slim black steel column, footring and base. */
export function Stool({ w }: PieceProps) {
  return (
    <group>
      <Cyl p={[0, 0.6, 0]} r={w / 2 - 0.01} rTop={w / 2} h={0.06} m={FURN.walnut} seg={32} />
      <Cyl p={[0, 0.02, 0]} r={0.022} h={0.58} m={FURN.dark} seg={12} />
      <mesh position={[0, 0.25, 0]} rotation-x={Math.PI / 2} material={FURN.dark} castShadow>
        <torusGeometry args={[w / 2 - 0.05, 0.008, 6, 32]} />
      </mesh>
      <Cyl p={[0, 0, 0]} r={w / 2 - 0.03} rTop={w / 2 - 0.05} h={0.02} m={FURN.dark} seg={32} />
    </group>
  );
}
