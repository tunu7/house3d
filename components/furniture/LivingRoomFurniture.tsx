"use client";

import { B, Cyl, FURN, Legs, type PieceProps } from "./parts";

/** Upholstered sofa (or armchair): back at local −Z, seat facing +Z. */
export function Sofa({ w, d }: PieceProps) {
  const arm = 0.16;
  const seats = Math.max(1, Math.round((w - 2 * arm) / 0.75));
  const cw = (w - 2 * arm) / seats;
  return (
    <group>
      <B p={[0, 0.2, 0]} s={[w, 0.3, d]} m={FURN.fabricDark} />
      <Legs w={w} d={d} h={0.05} inset={0.06} size={0.04} m={FURN.walnut} />
      <B p={[0, 0.6, -d / 2 + 0.12]} s={[w, 0.5, 0.24]} m={FURN.fabric} />
      {[-1, 1].map((side) => (
        <B key={side} p={[side * (w / 2 - arm / 2), 0.42, 0]} s={[arm, 0.45, d]} m={FURN.fabric} />
      ))}
      {Array.from({ length: seats }, (_, i) => (
        <B key={i} p={[-w / 2 + arm + cw * (i + 0.5), 0.42, 0.08]} s={[cw - 0.02, 0.14, d - 0.26]} m={FURN.fabric} />
      ))}
      {w > 1.2 && <B p={[-w / 2 + arm + 0.25, 0.62, -d / 2 + 0.32]} s={[0.4, 0.35, 0.12]} m={FURN.sage} />}
    </group>
  );
}

export function CoffeeTable({ w, d }: PieceProps) {
  return (
    <group>
      <B p={[0, 0.4, 0]} s={[w, 0.04, d]} m={FURN.oak} />
      <B p={[0, 0.12, 0]} s={[w - 0.1, 0.02, d - 0.1]} m={FURN.oak} />
      <Legs w={w} d={d} h={0.38} inset={0.04} size={0.035} m={FURN.dark} />
      <Cyl p={[0.15, 0.42, 0]} r={0.08} h={0.12} m={FURN.ceramic} />
    </group>
  );
}

export function RoundTable({ w }: PieceProps) {
  return (
    <group>
      <Cyl p={[0, 0.43, 0]} r={w / 2} h={0.04} m={FURN.oak} seg={36} />
      <Cyl p={[0, 0.02, 0]} r={0.04} h={0.41} m={FURN.dark} />
      <Cyl p={[0, 0, 0]} r={0.2} h={0.02} m={FURN.dark} seg={28} />
    </group>
  );
}

export function Rug({ w, d }: PieceProps) {
  return (
    <group>
      <B p={[0, 0.006, 0]} s={[w, 0.012, d]} m={FURN.rug} />
      <B p={[0, 0.007, 0]} s={[w - 0.3, 0.012, d - 0.3]} m={FURN.fabricDark} />
    </group>
  );
}

export function Plant({ w }: PieceProps) {
  const r = w / 2;
  return (
    <group>
      <Cyl p={[0, 0, 0]} r={r * 0.55} rTop={r * 0.7} h={0.38} m={FURN.pot} />
      <mesh position={[0, 0.72, 0]} material={FURN.leaf} castShadow>
        <icosahedronGeometry args={[r * 0.95, 1]} />
      </mesh>
      <mesh position={[r * 0.3, 1.02, -r * 0.2]} material={FURN.leaf} castShadow>
        <icosahedronGeometry args={[r * 0.6, 1]} />
      </mesh>
    </group>
  );
}
