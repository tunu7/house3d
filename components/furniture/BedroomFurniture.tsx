"use client";

import { B, Cyl, FURN, RB, type PieceProps } from "./parts";

/** Bed: timber base, deep mattress, upholstered headboard, duvet folded back, pillows and a throw. */
export function Bed({ w, d }: PieceProps) {
  const double = w >= 1.4;
  const pillowW = double ? w / 2 - 0.1 : w - 0.2;
  const pillowXs = double ? [-w / 4, w / 4] : [0];
  return (
    <group>
      <B p={[0, 0.14, 0.02]} s={[w, 0.24, d - 0.04]} m={FURN.oak} />
      <B p={[0, 0.02, 0.02]} s={[w - 0.1, 0.04, d - 0.14]} m={FURN.dark} />
      <RB p={[0, 0.36, 0.05]} s={[w - 0.04, 0.22, d - 0.12]} m={FURN.linen} r={0.06} />
      <RB p={[0, 0.6, -d / 2 + 0.05]} s={[w + 0.12, 1.1, 0.1]} m={FURN.fabricDark} r={0.04} />
      {/* Duvet over the lower two-thirds, draped over the sides. */}
      <RB p={[0, 0.48, d * 0.14]} s={[w + 0.04, 0.06, d * 0.68]} m={FURN.fabric} r={0.03} />
      <RB p={[0, 0.5, -d * 0.2]} s={[w + 0.04, 0.08, 0.16]} m={FURN.fabric} r={0.04} />
      <RB p={[0, 0.52, d * 0.34]} s={[w + 0.06, 0.07, 0.42]} m={FURN.sage} r={0.03} />
      {pillowXs.map((x) => (
        <RB key={x} p={[x, 0.57, -d / 2 + 0.3]} s={[pillowW, 0.16, 0.38]} m={FURN.linen} r={0.07} />
      ))}
      {double && <RB p={[0, 0.6, -d / 2 + 0.48]} s={[0.4, 0.26, 0.12]} m={FURN.terracotta} r={0.05} />}
    </group>
  );
}

export function Nightstand({ w, d }: PieceProps) {
  return (
    <group>
      <B p={[0, 0.25, 0]} s={[w, 0.5, d]} m={FURN.walnut} />
      <B p={[0, 0.3, d / 2 + 0.003]} s={[w - 0.08, 0.005, 0.005]} m={FURN.dark} />
      <Cyl p={[0, 0.5, -0.04]} r={0.05} h={0.25} m={FURN.ceramic} />
      <Cyl p={[0, 0.72, -0.04]} r={0.13} rTop={0.09} h={0.18} m={FURN.lampShade} />
    </group>
  );
}

/** Full-height wardrobe with hinged doors about 0.5 m wide. */
export function Wardrobe({ w, d }: PieceProps) {
  const doors = Math.max(2, Math.round(w / 0.5));
  const dw = w / doors;
  return (
    <group>
      <B p={[0, 1.05, 0]} s={[w, 2.1, d]} m={FURN.lacquer} />
      {Array.from({ length: doors - 1 }, (_, i) => (
        <B key={i} p={[-w / 2 + dw * (i + 1), 1.05, d / 2 + 0.002]} s={[0.006, 2.0, 0.004]} m={FURN.fabricDark} />
      ))}
      {Array.from({ length: doors }, (_, i) => {
        const x = -w / 2 + dw * i + (i % 2 === 0 ? dw - 0.06 : 0.06);
        return <B key={`h${i}`} p={[x, 1.05, d / 2 + 0.015]} s={[0.015, 0.3, 0.02]} m={FURN.steel} />;
      })}
    </group>
  );
}
