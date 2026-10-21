"use client";

import { B, FURN, Legs, type PieceProps } from "./parts";

export function DiningTable({ w, d }: PieceProps) {
  return (
    <group>
      <B p={[0, 0.74, 0]} s={[w, 0.04, d]} m={FURN.oak} />
      <Legs w={w} d={d} h={0.72} inset={0.08} size={0.06} m={FURN.oak} />
    </group>
  );
}

/** Dining chair facing local +Z (back at −Z). */
export function Chair({ w, d }: PieceProps) {
  return (
    <group>
      <B p={[0, 0.45, 0]} s={[w, 0.05, d]} m={FURN.walnut} />
      <B p={[0, 0.7, -d / 2 + 0.025]} s={[w, 0.45, 0.04]} m={FURN.walnut} />
      <Legs w={w} d={d} h={0.43} inset={0.03} size={0.03} m={FURN.walnut} />
    </group>
  );
}

export function Console({ w, d }: PieceProps) {
  return (
    <group>
      <B p={[0, 0.78, 0]} s={[w, 0.04, d]} m={FURN.walnut} />
      {[-1, 1].map((s) => (
        <B key={s} p={[s * (w / 2 - 0.02), 0.38, 0]} s={[0.04, 0.76, d]} m={FURN.walnut} />
      ))}
      <B p={[0, 0.2, 0]} s={[w - 0.08, 0.03, d - 0.04]} m={FURN.walnut} />
    </group>
  );
}
