"use client";

import { B, Books, Cyl, FURN, Lathe, Soft, type PieceProps } from "./parts";

/**
 * Bed: oak base, deep mattress, tall upholstered headboard, a duvet that
 * drapes over the sides and is folded back at the top, puffy pillows leaning
 * on the headboard, and a throw across the foot.
 */
export function Bed({ w, d }: PieceProps) {
  const double = w >= 1.4;
  const pillowW = double ? w / 2 - 0.08 : w - 0.2;
  const pillowXs = double ? [-w / 4 + 0.01, w / 4 - 0.01] : [0];
  return (
    <group>
      <B p={[0, 0.17, 0.02]} s={[w, 0.22, d - 0.04]} m={FURN.oak} bevel={0.01} />
      <B p={[0, 0.03, 0.02]} s={[w - 0.1, 0.06, d - 0.14]} m={FURN.dark} />
      <Soft p={[0, 0.38, 0.04]} s={[w - 0.04, 0.22, d - 0.1]} m={FURN.linen} round={[0.12, 0.35, 0.12]} />
      {/* Headboard: upholstered panel on the wall. */}
      <Soft p={[0, 0.75, -d / 2 + 0.05]} s={[w + 0.16, 1.0, 0.1]} m={FURN.fabricDark} round={[0.1, 0.1, 0.5]} />
      {/* Duvet over the lower two-thirds, falling over the sides, with the folded-back turn. */}
      <Soft p={[0, 0.49, d * 0.12]} s={[w + 0.03, 0.09, d * 0.74]} m={FURN.fabric} round={[0.12, 0.6, 0.1]} />
      {[-1, 1].map((s) => (
        <B key={s} p={[s * (w / 2 + 0.005), 0.36, d * 0.12]} s={[0.03, 0.26, d * 0.72]} m={FURN.fabric} bevel={0.012} />
      ))}
      <Soft p={[0, 0.52, -d * 0.24]} s={[w + 0.03, 0.1, 0.2]} m={FURN.fabric} round={[0.12, 0.7, 0.6]} />
      <Soft p={[0, 0.53, d * 0.36]} s={[w + 0.08, 0.06, 0.45]} m={FURN.sage} round={[0.1, 0.6, 0.15]} />
      {pillowXs.map((x, i) => (
        <group key={x}>
          <Soft p={[x, 0.6, -d / 2 + 0.24]} s={[pillowW, 0.5, 0.17]} m={FURN.linen} round={[0.28, 0.28, 0.8]} rot={[-0.55, 0, i ? -0.03 : 0.03]} />
          <Soft p={[x, 0.6, -d / 2 + 0.4]} s={[pillowW * 0.9, 0.4, 0.15]} m={FURN.linen} round={[0.28, 0.28, 0.8]} rot={[-0.5, 0, i ? 0.04 : -0.02]} />
        </group>
      ))}
      {double && <Soft p={[0, 0.62, -d / 2 + 0.52]} s={[0.45, 0.3, 0.13]} m={FURN.terracotta} round={[0.3, 0.3, 0.8]} rot={[-0.4, 0, 0]} />}
    </group>
  );
}

/** Walnut nightstand with a drawer, a ceramic lamp and a book. */
export function Nightstand({ w, d }: PieceProps) {
  return (
    <group>
      <B p={[0, 0.27, 0]} s={[w, 0.42, d]} m={FURN.walnut} bevel={0.008} />
      {/* Drawer front proud of the carcass, with a shadow gap and a brass pull. */}
      <B p={[0, 0.36, d / 2 + 0.006]} s={[w - 0.03, 0.17, 0.012]} m={FURN.walnut} bevel={0.003} />
      <B p={[0, 0.36, d / 2 + 0.016]} s={[0.1, 0.012, 0.012]} m={FURN.brass} bevel={0.003} />
      {[-1, 1].map((s) => (
        <Cyl key={s} p={[s * (w / 2 - 0.04), 0, 0]} r={0.012} rTop={0.016} h={0.06} m={FURN.walnut} seg={10} />
      ))}
      <Lathe p={[0.05, 0.48, -0.04]} id="night-lamp" m={FURN.glaze} profile={[[0, 0], [0.05, 0], [0.07, 0.07], [0.06, 0.14], [0.01, 0.17], [0.01, 0.24], [0, 0.24]]} />
      <Lathe p={[0.05, 0.64, -0.04]} id="night-shade" m={FURN.lampShade} profile={[[0.12, 0], [0.09, 0.15], [0.088, 0.15], [0.118, 0]]} seg={40} />
      <Books p={[-0.07, 0.48, 0.05]} count={2} seed={11} />
    </group>
  );
}

/** Full-height wardrobe: separate door panels about 0.5 m wide with shadow gaps and slim bar pulls. */
export function Wardrobe({ w, d }: PieceProps) {
  const doors = Math.max(2, Math.round(w / 0.5));
  const dw = w / doors;
  return (
    <group>
      <B p={[0, 1.08, -0.01]} s={[w, 2.16, d - 0.02]} m={FURN.lacquer} bevel={0.004} />
      <B p={[0, 0.04, d / 2 - 0.04]} s={[w - 0.02, 0.08, 0.02]} m={FURN.dark} bevel={0.002} />
      {Array.from({ length: doors }, (_, i) => {
        const cx = -w / 2 + dw * (i + 0.5);
        const pullX = cx + (i % 2 === 0 ? dw / 2 - 0.06 : -dw / 2 + 0.06);
        return (
          <group key={i}>
            <B p={[cx, 1.12, d / 2 - 0.009]} s={[dw - 0.004, 2.06, 0.018]} m={FURN.lacquer} bevel={0.003} />
            <B p={[pullX, 1.1, d / 2 + 0.012]} s={[0.012, 0.32, 0.018]} m={FURN.brass} bevel={0.004} />
          </group>
        );
      })}
    </group>
  );
}
