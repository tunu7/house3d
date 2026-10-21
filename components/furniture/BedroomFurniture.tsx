"use client";

import { B, Cyl, FURN, type PieceProps } from "./parts";

/** Bed with the headboard at the back (local −Z) and the foot toward the front. */
export function Bed({ w, d }: PieceProps) {
  const pillowW = w >= 1.4 ? w / 2 - 0.12 : w - 0.2;
  const pillowXs = w >= 1.4 ? [-w / 4, w / 4] : [0];
  return (
    <group>
      <B p={[0, 0.15, 0]} s={[w, 0.3, d]} m={FURN.oak} />
      <B p={[0, 0.4, 0.04]} s={[w - 0.06, 0.2, d - 0.12]} m={FURN.linen} />
      <B p={[0, 0.5, -d / 2 + 0.04]} s={[w + 0.06, 1.0, 0.08]} m={FURN.fabricDark} />
      <B p={[0, 0.52, d * 0.16]} s={[w - 0.02, 0.05, d * 0.66]} m={FURN.fabric} />
      <B p={[0, 0.55, d * 0.36]} s={[w + 0.01, 0.06, 0.4]} m={FURN.sage} />
      {pillowXs.map((x) => (
        <B key={x} p={[x, 0.56, -d / 2 + 0.3]} s={[pillowW, 0.12, 0.36]} m={FURN.linen} />
      ))}
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
