"use client";

import { B, Books, FURN, Lathe, Legs, Soft, type PieceProps } from "./parts";

/** Oak dining table: a slim top on an apron and tapered legs, a bowl of fruit at the centre. */
export function DiningTable({ w, d }: PieceProps) {
  return (
    <group>
      <B p={[0, 0.74, 0]} s={[w, 0.032, d]} m={FURN.oak} bevel={0.008} />
      <B p={[0, 0.685, 0]} s={[w - 0.2, 0.08, d - 0.2]} m={FURN.oak} bevel={0.004} />
      <Legs w={w} d={d} h={0.724} inset={0.07} size={0.055} m={FURN.oak} taper={0.65} />
      <group position={[0, 0.756, 0]}>
        <Lathe p={[0, 0, 0]} id="fruit-bowl" m={FURN.glaze} profile={[[0, 0], [0.06, 0.004], [0.15, 0.06], [0.16, 0.085], [0.152, 0.085], [0.14, 0.065], [0, 0.015]]} />
        {[
          [0, 0.055, 0],
          [0.06, 0.05, 0.03],
          [-0.05, 0.05, 0.04],
          [0.02, 0.1, 0.01],
          [-0.03, 0.05, -0.05],
        ].map((f, i) => (
          <mesh key={i} position={f as [number, number, number]} material={FURN.fruit} castShadow receiveShadow>
            <sphereGeometry args={[0.038, 16, 12]} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/**
 * Dining chair facing local +Z (back at −Z): walnut frame on tapered legs, a
 * stuffed seat pad, and a curved upholstered back raked slightly backward.
 */
export function Chair({ w, d }: PieceProps) {
  return (
    <group>
      <Legs w={w} d={d} h={0.42} inset={0.035} size={0.032} m={FURN.walnut} taper={0.65} />
      <B p={[0, 0.425, 0]} s={[w, 0.03, d]} m={FURN.walnut} bevel={0.006} />
      <Soft p={[0, 0.465, 0.01]} s={[w - 0.02, 0.06, d - 0.03]} m={FURN.fabricDark} round={[0.16, 0.5, 0.16]} />
      {/* Back posts continue the rear legs up, raked back. */}
      {[-1, 1].map((s) => (
        <B key={s} p={[s * (w / 2 - 0.035), 0.64, -d / 2 + 0.025]} s={[0.03, 0.42, 0.03]} m={FURN.walnut} rot={[-0.1, 0, 0]} bevel={0.006} />
      ))}
      <Soft p={[0, 0.74, -d / 2 + 0.02]} s={[w - 0.04, 0.24, 0.05]} m={FURN.fabricDark} round={[0.2, 0.25, 0.55]} rot={[-0.1, 0, 0]} />
    </group>
  );
}

/** Walnut console with a shelf: books, a lamp and a bowl on top, baskets below. */
export function Console({ w, d }: PieceProps) {
  return (
    <group>
      <B p={[0, 0.78, 0]} s={[w, 0.035, d]} m={FURN.walnut} bevel={0.006} />
      {[-1, 1].map((s) => (
        <B key={s} p={[s * (w / 2 - 0.02), 0.38, 0]} s={[0.04, 0.76, d]} m={FURN.walnut} />
      ))}
      <B p={[0, 0.2, 0]} s={[w - 0.08, 0.025, d - 0.04]} m={FURN.walnut} />
      <Books p={[-w / 2 + 0.08, 0.798, 0]} count={7} standing seed={2} />
      <Lathe p={[w / 4, 0.798, 0]} id="console-lamp" m={FURN.glaze} profile={[[0, 0], [0.06, 0], [0.08, 0.1], [0.05, 0.22], [0.012, 0.24], [0.012, 0.32], [0, 0.32]]} />
      <Lathe p={[w / 4, 1.08, 0]} id="console-shade" m={FURN.lampShade} profile={[[0.13, 0], [0.09, 0.17], [0.088, 0.17], [0.128, 0]]} seg={40} />
      {[-0.22, 0.22].map((x) => (
        <Soft key={x} p={[x, 0.32, 0]} s={[0.3, 0.2, d - 0.08]} m={FURN.rug} round={[0.12, 0.2, 0.12]} />
      ))}
    </group>
  );
}
