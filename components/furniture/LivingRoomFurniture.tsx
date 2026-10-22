"use client";

import { B, Cyl, FURN, Legs, RB, type PieceProps } from "./parts";

/** Upholstered sofa (or armchair): plinth on slim legs, rounded seat and back cushions, arms, throw pillows. */
export function Sofa({ w, d }: PieceProps) {
  const arm = 0.18;
  const seats = Math.max(1, Math.round((w - 2 * arm) / 0.75));
  const cw = (w - 2 * arm) / seats;
  return (
    <group>
      <RB p={[0, 0.22, 0]} s={[w, 0.26, d]} m={FURN.fabricDark} r={0.05} />
      <Legs w={w} d={d} h={0.09} inset={0.07} size={0.035} m={FURN.walnut} />
      {[-1, 1].map((side) => (
        <RB key={side} p={[side * (w / 2 - arm / 2), 0.44, 0]} s={[arm, 0.42, d]} m={FURN.fabric} r={0.07} />
      ))}
      {Array.from({ length: seats }, (_, i) => {
        const x = -w / 2 + arm + cw * (i + 0.5);
        return (
          <group key={i}>
            <RB p={[x, 0.42, 0.07]} s={[cw - 0.015, 0.16, d - 0.26]} m={FURN.fabric} r={0.06} />
            <RB p={[x, 0.68, -d / 2 + 0.15]} s={[cw - 0.015, 0.46, 0.22]} m={FURN.fabric} r={0.08} />
          </group>
        );
      })}
      {w > 1.2 && (
        <>
          <RB p={[-w / 2 + arm + 0.24, 0.66, -d / 2 + 0.33]} s={[0.42, 0.36, 0.12]} m={FURN.sage} r={0.06} />
          <RB p={[w / 2 - arm - 0.24, 0.66, -d / 2 + 0.33]} s={[0.42, 0.36, 0.12]} m={FURN.ochre} r={0.06} />
        </>
      )}
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

/** Arc floor lamp: weighted base, brass stem and a linen drum shade. */
export function FloorLamp() {
  return (
    <group>
      <Cyl p={[0, 0, 0]} r={0.16} h={0.03} m={FURN.dark} seg={24} />
      <Cyl p={[0, 0.03, 0]} r={0.012} h={1.5} m={FURN.brass} />
      <Cyl p={[0, 1.42, 0]} r={0.22} rTop={0.2} h={0.28} m={FURN.lampShade} seg={28} />
    </group>
  );
}

/** Round side table on a pedestal. */
export function SideTable({ w }: PieceProps) {
  return (
    <group>
      <Cyl p={[0, 0.52, 0]} r={w / 2} h={0.03} m={FURN.walnut} seg={28} />
      <Cyl p={[0, 0.02, 0]} r={0.025} h={0.5} m={FURN.brass} />
      <Cyl p={[0, 0, 0]} r={w / 2 - 0.06} h={0.02} m={FURN.dark} seg={24} />
      <Cyl p={[0.05, 0.55, 0]} r={0.05} h={0.14} m={FURN.ceramic} />
    </group>
  );
}

/** Framed artwork hung flat on the wall behind it (local −Z is the wall). */
export function Art({ w, height = 0.8, elevation = 1.3 }: PieceProps & { height?: number; elevation?: number }) {
  const d = 0.03;
  return (
    <group position-y={elevation}>
      <B p={[0, height / 2, 0]} s={[w, height, d]} m={FURN.dark} />
      <B p={[0, height / 2, d / 2 + 0.001]} s={[w - 0.08, height - 0.08, 0.002]} m={FURN.linen} />
      <B p={[-w * 0.12, height * 0.55, d / 2 + 0.003]} s={[w * 0.36, height * 0.5, 0.002]} m={FURN.terracotta} />
      <B p={[w * 0.16, height * 0.42, d / 2 + 0.004]} s={[w * 0.3, height * 0.36, 0.002]} m={FURN.sage} />
      <B p={[w * 0.05, height * 0.72, d / 2 + 0.005]} s={[w * 0.5, 0.012, 0.002]} m={FURN.ochre} />
    </group>
  );
}
