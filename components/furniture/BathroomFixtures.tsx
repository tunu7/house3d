"use client";

import type { FurnitureItem } from "@/types/architecture";
import { Arch, B, Cyl, FURN, Lathe, Soft, type PieceProps } from "./parts";

/** Close-coupled WC facing local +Z: moulded pan, seat and lid, cistern against the wall with a flush plate. */
export function WC({ d }: PieceProps) {
  return (
    <group>
      {/* Pedestal narrowing into the floor, under a rounded bowl. */}
      <Soft p={[0, 0.18, 0.04]} s={[0.26, 0.36, d - 0.3]} m={FURN.ceramic} round={[0.45, 0.2, 0.45]} />
      <Soft p={[0, 0.34, 0.06]} s={[0.37, 0.12, d - 0.16]} m={FURN.ceramic} round={[0.55, 0.4, 0.55]} />
      <Soft p={[0, 0.41, 0.06]} s={[0.37, 0.025, d - 0.16]} m={FURN.ceramic} round={[0.55, 0.3, 0.55]} />
      <Soft p={[0, 0.43, 0.06]} s={[0.36, 0.02, d - 0.18]} m={FURN.ceramic} round={[0.55, 0.3, 0.55]} />
      <B p={[0, 0.62, -d / 2 + 0.09]} s={[0.4, 0.38, 0.17]} m={FURN.ceramic} bevel={0.03} />
      <B p={[0, 0.815, -d / 2 + 0.09]} s={[0.42, 0.02, 0.19]} m={FURN.ceramic} bevel={0.008} />
      <Cyl p={[0, 0.825, -d / 2 + 0.09]} r={0.025} h={0.006} m={FURN.steel} />
    </group>
  );
}

/** Wall-hung oak vanity with a ceramic vessel basin, arched tap, framed mirror and a hand towel. */
export function Basin({ w, d }: PieceProps) {
  const top = 0.82;
  return (
    <group>
      <B p={[0, 0.65, 0]} s={[w, 0.34, d]} m={FURN.oak} bevel={0.006} />
      <B p={[0, 0.6, d / 2 + 0.004]} s={[w - 0.1, 0.008, 0.006]} m={FURN.dark} bevel={0} />
      <B p={[0, top + 0.006, 0]} s={[w, 0.012, d]} m={FURN.stone} bevel={0.003} />
      <Lathe
        p={[0, top + 0.012, 0.03]}
        id={`vessel-${w.toFixed(2)}`}
        m={FURN.ceramic}
        profile={[[0, 0], [0.12, 0.004], [w * 0.36, 0.06], [w * 0.38, 0.12], [w * 0.37, 0.125], [w * 0.35, 0.07], [0.08, 0.02], [0, 0.02]]}
        seg={40}
      />
      <Cyl p={[0, top + 0.012, -d / 2 + 0.05]} r={0.018} h={0.03} m={FURN.steel} />
      <Arch p={[0, top + 0.04, -d / 2 + 0.05]} rise={0.18} reach={0.12} r={0.01} m={FURN.steel} />
      {/* Mirror in a slim walnut frame. */}
      <B p={[0, 1.5, -d / 2 + 0.01]} s={[w * 0.92, 0.72, 0.02]} m={FURN.walnut} bevel={0.004} />
      <B p={[0, 1.5, -d / 2 + 0.021]} s={[w * 0.92 - 0.04, 0.68, 0.004]} m={FURN.mirror} bevel={0} />
      {/* Hand towel over a rail on the vanity front. */}
      <Cyl p={[-w / 2 + 0.04, 0.72, d / 2 + 0.025]} r={0.007} h={w - 0.08} m={FURN.steel} rot={[0, 0, -Math.PI / 2]} seg={10} />
      <B p={[0, 0.6, d / 2 + 0.025]} s={[w * 0.55, 0.26, 0.03]} m={FURN.towel} bevel={0.012} />
    </group>
  );
}

/** Low shower tray with steel-framed glass screens, a ceiling rain head on an arm, and a wall mixer. */
export function Shower({ w, d, screens = ["front"] }: PieceProps & { screens?: FurnitureItem["screens"] }) {
  const h = 1.95;
  const base = 0.035;
  return (
    <group>
      <B p={[0, base / 2, 0]} s={[w, base, d]} m={FURN.ceramic} bevel={0.006} />
      <Cyl p={[0, base, 0]} r={0.045} h={0.002} m={FURN.steel} />
      {screens.includes("front") && <Screen p={[0, base, d / 2 - 0.01]} length={w} h={h} />}
      {screens.includes("left") && <Screen p={[-w / 2 + 0.01, base, 0]} length={d} h={h} along="z" />}
      {screens.includes("right") && <Screen p={[w / 2 - 0.01, base, 0]} length={d} h={h} along="z" />}
      <Cyl p={[0, 2.0, -d / 2 + 0.01]} r={0.01} h={0.25} m={FURN.steel} rot={[Math.PI / 2, 0, 0]} />
      <Cyl p={[0, 1.98, -d / 2 + 0.24]} r={0.11} h={0.012} m={FURN.steel} seg={36} />
      <Cyl p={[0, 1.05, -d / 2]} r={0.035} h={0.04} m={FURN.steel} rot={[Math.PI / 2, 0, 0]} />
      <B p={[0, 1.05, -d / 2 + 0.06]} s={[0.012, 0.012, 0.05]} m={FURN.steel} bevel={0.004} />
    </group>
  );
}

/** Frameless glass panel with a thin steel channel at the base and a top profile. */
function Screen({ p, length, h, along = "x" }: { p: [number, number, number]; length: number; h: number; along?: "x" | "z" }) {
  const size = (a: number, b: number, c: number): [number, number, number] => (along === "x" ? [a, b, c] : [c, b, a]);
  return (
    <group position={p}>
      <B p={[0, h / 2, 0]} s={size(length, h, 0.008)} m={FURN.glass} bevel={0} />
      <B p={[0, 0.01, 0]} s={size(length, 0.02, 0.02)} m={FURN.steel} bevel={0.003} />
      <B p={[0, h - 0.008, 0]} s={size(length, 0.016, 0.016)} m={FURN.steel} bevel={0.003} />
    </group>
  );
}
