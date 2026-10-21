"use client";

import { B, Cyl, FURN, type PieceProps } from "./parts";

const TOP = 0.9;
const MODULE = 0.6;

/** Base cabinets with a stone worktop; optional sink and hob cut-outs (local-X offsets). */
export function Counter({ w, d, sinkAt, hobAt }: PieceProps & { sinkAt?: number; hobAt?: number }) {
  const modules = Math.max(1, Math.round(w / MODULE));
  const mw = w / modules;
  return (
    <group>
      <B p={[0, 0.05, -0.03]} s={[w, 0.1, d - 0.06]} m={FURN.dark} />
      <B p={[0, 0.48, -0.01]} s={[w, 0.76, d - 0.02]} m={FURN.lacquer} />
      <B p={[0, TOP - 0.02, 0.01]} s={[w, 0.04, d + 0.02]} m={FURN.stone} />
      {Array.from({ length: modules - 1 }, (_, i) => (
        <B key={i} p={[-w / 2 + mw * (i + 1), 0.48, d / 2 - 0.018]} s={[0.006, 0.74, 0.006]} m={FURN.fabricDark} />
      ))}
      {Array.from({ length: modules }, (_, i) => (
        <B key={`h${i}`} p={[-w / 2 + mw * (i + 0.5), 0.8, d / 2 - 0.005]} s={[0.25, 0.015, 0.02]} m={FURN.steel} />
      ))}
      {sinkAt !== undefined && (
        <group position-x={sinkAt}>
          <B p={[0, TOP + 0.003, 0.02]} s={[0.7, 0.008, 0.42]} m={FURN.steel} />
          <Cyl p={[0, TOP, -d / 2 + 0.08]} r={0.02} h={0.3} m={FURN.steel} />
          <B p={[0, TOP + 0.3, -d / 2 + 0.16]} s={[0.03, 0.03, 0.18]} m={FURN.steel} />
        </group>
      )}
      {hobAt !== undefined && <B p={[hobAt, TOP + 0.005, 0.02]} s={[0.6, 0.012, 0.5]} m={FURN.hobGlass} />}
    </group>
  );
}

export function UpperCabinet({ w, d, elevation = 1.5, height = 0.7 }: PieceProps & { elevation?: number; height?: number }) {
  return <B p={[0, elevation + height / 2, 0]} s={[w, height, d]} m={FURN.lacquer} />;
}

/** Chimney hood: canopy at `elevation` with a flue to the ceiling line. */
export function Hood({ w, d, elevation = 1.6 }: PieceProps & { elevation?: number }) {
  const flueTop = 2.7;
  const flueBase = elevation + 0.14;
  return (
    <group>
      <B p={[0, elevation + 0.07, 0]} s={[w, 0.14, d]} m={FURN.steel} />
      <B p={[0, (flueBase + flueTop) / 2, -d / 2 + 0.14]} s={[0.28, flueTop - flueBase, 0.26]} m={FURN.steel} />
    </group>
  );
}

export function Fridge({ w, d }: PieceProps) {
  return (
    <group>
      <B p={[0, 0.9, 0]} s={[w, 1.8, d]} m={FURN.steel} />
      <B p={[0, 1.2, d / 2 + 0.002]} s={[w - 0.02, 0.006, 0.004]} m={FURN.dark} />
      <B p={[w / 2 - 0.06, 1.45, d / 2 + 0.02]} s={[0.02, 0.35, 0.03]} m={FURN.dark} />
      <B p={[w / 2 - 0.06, 0.85, d / 2 + 0.02]} s={[0.02, 0.4, 0.03]} m={FURN.dark} />
    </group>
  );
}
