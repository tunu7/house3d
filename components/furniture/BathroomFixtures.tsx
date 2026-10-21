"use client";

import type { FurnitureItem } from "@/types/architecture";
import { B, Cyl, FURN, type PieceProps } from "./parts";

/** Floor-mounted WC facing local +Z with the cistern against the wall. */
export function WC({ d }: PieceProps) {
  return (
    <group>
      <B p={[0, 0.19, 0.06]} s={[0.32, 0.38, d - 0.22]} m={FURN.ceramic} />
      <B p={[0, 0.41, 0.05]} s={[0.38, 0.05, d - 0.18]} m={FURN.ceramic} />
      <B p={[0, 0.62, -d / 2 + 0.09]} s={[0.4, 0.4, 0.18]} m={FURN.ceramic} />
    </group>
  );
}

/** Wall-hung vanity basin with a mirror on the wall behind. */
export function Basin({ w, d }: PieceProps) {
  return (
    <group>
      <B p={[0, 0.62, 0]} s={[w, 0.36, d]} m={FURN.oak} />
      <B p={[0, 0.83, 0]} s={[w, 0.06, d]} m={FURN.ceramic} />
      <B p={[0, 0.861, 0.03]} s={[w - 0.12, 0.004, d - 0.14]} m={FURN.fabricDark} />
      <Cyl p={[0, 0.86, -d / 2 + 0.05]} r={0.015} h={0.15} m={FURN.steel} />
      <B p={[0, 1.5, -d / 2 + 0.006]} s={[w * 0.9, 0.7, 0.01]} m={FURN.mirror} />
    </group>
  );
}

/** Shower tray with glass screens on the open sides and a ceiling-height head. */
export function Shower({ w, d, screens = ["front"] }: PieceProps & { screens?: FurnitureItem["screens"] }) {
  const h = 1.95;
  return (
    <group>
      <B p={[0, 0.03, 0]} s={[w, 0.06, d]} m={FURN.ceramic} />
      <Cyl p={[0, 0.06, 0]} r={0.04} h={0.003} m={FURN.steel} />
      {screens.includes("front") && <B p={[0, 0.06 + h / 2, d / 2 - 0.01]} s={[w, h, 0.01]} m={FURN.glass} />}
      {screens.includes("left") && <B p={[-w / 2 + 0.01, 0.06 + h / 2, 0]} s={[0.01, h, d]} m={FURN.glass} />}
      {screens.includes("right") && <B p={[w / 2 - 0.01, 0.06 + h / 2, 0]} s={[0.01, h, d]} m={FURN.glass} />}
      <B p={[0, 2.05, -d / 2 + 0.12]} s={[0.04, 0.04, 0.24]} m={FURN.steel} />
      <Cyl p={[0, 2.0, -d / 2 + 0.24]} r={0.1} h={0.02} m={FURN.steel} />
    </group>
  );
}
