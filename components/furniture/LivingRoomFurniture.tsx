"use client";

import { useMemo } from "react";
import { B, Books, Cyl, FURN, Lathe, Legs, Soft, type PieceProps } from "./parts";
import { plantGeometry } from "./plants";

/**
 * Upholstered sofa (or armchair): a tight frame on slim tapered legs, stuffed
 * seat and back cushions that sit slightly into each other, padded arms and
 * scatter cushions leaning against the back.
 */
export function Sofa({ w, d }: PieceProps) {
  const arm = w > 1.2 ? 0.2 : 0.16;
  const seats = Math.max(1, Math.round((w - 2 * arm) / 0.75));
  const cw = (w - 2 * arm) / seats;
  const legH = 0.12;
  return (
    <group>
      <B p={[0, legH + 0.11, 0]} s={[w, 0.22, d]} m={FURN.fabricDark} bevel={0.03} />
      <Legs w={w} d={d} h={legH} inset={0.06} size={0.035} m={FURN.walnut} />
      {/* Back frame behind the cushions. */}
      <B p={[0, legH + 0.36, -d / 2 + 0.08]} s={[w, 0.5, 0.16]} m={FURN.fabricDark} bevel={0.04} />
      {[-1, 1].map((side) => (
        <Soft key={side} p={[side * (w / 2 - arm / 2), legH + 0.3, 0]} s={[arm, 0.4, d]} m={FURN.fabric} round={[0.25, 0.3, 0.12]} />
      ))}
      {Array.from({ length: seats }, (_, i) => {
        const x = -w / 2 + arm + cw * (i + 0.5);
        return (
          <group key={i}>
            <Soft p={[x, legH + 0.29, 0.07]} s={[cw + 0.01, 0.17, d - 0.2]} m={FURN.fabric} round={[0.14, 0.42, 0.14]} />
            <Soft p={[x, legH + 0.56, -d / 2 + 0.2]} s={[cw + 0.01, 0.46, 0.2]} m={FURN.fabric} round={[0.16, 0.18, 0.5]} rot={[-0.12, 0, 0]} />
          </group>
        );
      })}
      {w > 1.2 && (
        <>
          <Soft p={[-w / 2 + arm + 0.26, legH + 0.55, -d / 2 + 0.36]} s={[0.45, 0.43, 0.15]} m={FURN.sage} round={[0.3, 0.3, 0.8]} rot={[-0.3, 0.15, 0.05]} />
          <Soft p={[w / 2 - arm - 0.26, legH + 0.55, -d / 2 + 0.36]} s={[0.45, 0.43, 0.15]} m={FURN.ochre} round={[0.3, 0.3, 0.8]} rot={[-0.3, -0.2, -0.06]} />
        </>
      )}
      {w <= 1.2 && <Soft p={[0, legH + 0.55, -d / 2 + 0.33]} s={[0.42, 0.4, 0.14]} m={FURN.terracotta} round={[0.3, 0.3, 0.8]} rot={[-0.3, 0.1, 0]} />}
    </group>
  );
}

/** Oak coffee table with a lower shelf, a stack of books and a vase. */
export function CoffeeTable({ w, d }: PieceProps) {
  return (
    <group>
      <B p={[0, 0.39, 0]} s={[w, 0.035, d]} m={FURN.oak} bevel={0.008} />
      <B p={[0, 0.12, 0]} s={[w - 0.08, 0.02, d - 0.08]} m={FURN.oak} />
      <Legs w={w} d={d} h={0.373} inset={0.04} size={0.04} m={FURN.oak} taper={0.6} />
      <Books p={[-w / 4, 0.408, 0.02]} count={3} seed={3} />
      <Vase p={[w / 4, 0.408, -0.05]} id="coffee" />
      <Books p={[0.1, 0.13, 0]} count={2} seed={8} />
    </group>
  );
}

/** Glazed bud vase with a few stems. */
function Vase({ p, id }: { p: [number, number, number]; id: string }) {
  return (
    <group position={p}>
      <Lathe p={[0, 0, 0]} id={`vase-${id}`} m={FURN.glaze} profile={[[0, 0], [0.05, 0.003], [0.075, 0.07], [0.06, 0.15], [0.025, 0.2], [0.03, 0.22], [0.026, 0.22]]} />
      {[-0.3, 0.1, 0.4].map((a, i) => (
        <Cyl key={i} p={[0, 0.2, 0]} r={0.003} h={0.28 - i * 0.04} m={FURN.walnut} seg={5} rot={[a * 0.5, 0, a]} />
      ))}
    </group>
  );
}

export function RoundTable({ w }: PieceProps) {
  return (
    <group>
      <Cyl p={[0, 0.41, 0]} r={w / 2} h={0.035} m={FURN.oak} seg={48} />
      <Cyl p={[0, 0.02, 0]} r={0.03} rTop={0.04} h={0.39} m={FURN.dark} />
      <Cyl p={[0, 0, 0]} r={0.2} rTop={0.18} h={0.02} m={FURN.dark} seg={36} />
      <Lathe p={[w * 0.12, 0.445, 0]} id="bowl" m={FURN.glaze} profile={[[0, 0], [0.04, 0.002], [0.09, 0.04], [0.1, 0.06], [0.095, 0.06], [0.085, 0.045], [0, 0.01]]} />
    </group>
  );
}

/** Wool rug: cut-pile field inside a contrasting border, with a slight thickness. */
export function Rug({ w, d }: PieceProps) {
  return (
    <group>
      <B p={[0, 0.006, 0]} s={[w, 0.012, d]} m={FURN.rug} bevel={0.004} />
      <B p={[0, 0.0065, 0]} s={[w - 0.24, 0.012, d - 0.24]} m={FURN.fabricDark} bevel={0.002} />
      <B p={[0, 0.007, 0]} s={[w - 0.32, 0.012, d - 0.32]} m={FURN.rug} bevel={0.002} />
    </group>
  );
}

/** Plant in a turned pot: a fig in floor pots (tall), a strappy plant in small ones. */
export function Plant({ w }: PieceProps) {
  const r = w / 2;
  const tall = w >= 0.4;
  const potH = tall ? 0.42 : 0.3;
  const geo = useMemo(() => plantGeometry(tall ? "fig" : "strappy", tall ? 1.2 : 0.55, w, Math.round(w * 100)), [tall, w]);
  return (
    <group>
      <Lathe
        p={[0, 0, 0]}
        id={`pot-${w.toFixed(2)}`}
        m={FURN.pot}
        profile={[[0, 0], [r * 0.6, 0], [r * 0.66, 0.02], [r * 0.82, potH * 0.85], [r * 0.85, potH], [r * 0.78, potH], [r * 0.76, potH - 0.03], [0, potH - 0.03]]}
      />
      <Cyl p={[0, potH - 0.045, 0]} r={r * 0.75} h={0.02} m={FURN.soil} />
      <group position-y={potH - 0.03}>
        {geo.leaves && <mesh geometry={geo.leaves} material={FURN.leaf} castShadow receiveShadow />}
        {geo.leavesDark && <mesh geometry={geo.leavesDark} material={FURN.leafDark} castShadow receiveShadow />}
        {geo.stems && <mesh geometry={geo.stems} material={FURN.walnut} castShadow />}
      </group>
    </group>
  );
}

/** Floor lamp: weighted base, brass stem and a linen drum shade with a bulb inside. */
export function FloorLamp() {
  return (
    <group>
      <Cyl p={[0, 0, 0]} r={0.16} rTop={0.15} h={0.025} m={FURN.dark} seg={36} />
      <Cyl p={[0, 0.025, 0]} r={0.011} h={1.4} m={FURN.brass} seg={12} />
      <Lathe p={[0, 1.3, 0]} id="lamp-shade" m={FURN.lampShade} profile={[[0.22, 0], [0.2, 0.3], [0.198, 0.3], [0.218, 0]]} seg={48} />
    </group>
  );
}

/** Round side table on a pedestal, with a ceramic pot and a book. */
export function SideTable({ w }: PieceProps) {
  return (
    <group>
      <Cyl p={[0, 0.52, 0]} r={w / 2} h={0.025} m={FURN.walnut} seg={40} />
      <Cyl p={[0, 0.02, 0]} r={0.02} h={0.5} m={FURN.brass} seg={12} />
      <Cyl p={[0, 0, 0]} r={w / 2 - 0.06} h={0.02} m={FURN.dark} seg={36} />
      <Books p={[-0.03, 0.545, 0]} count={2} seed={5} />
    </group>
  );
}

/** Framed abstract canvas hung flat on the wall behind it (local −Z is the wall). */
export function Art({ w, height = 0.8, elevation = 1.3 }: PieceProps & { height?: number; elevation?: number }) {
  const d = 0.035;
  return (
    <group position-y={elevation}>
      <B p={[0, height / 2, 0]} s={[w, height, d]} m={FURN.walnut} bevel={0.004} />
      {/* White mount, then the canvas recessed within it. */}
      <B p={[0, height / 2, d / 2 - 0.004]} s={[w - 0.04, height - 0.04, 0.01]} m={FURN.linen} bevel={0.001} />
      <B p={[0, height / 2, d / 2 + 0.002]} s={[w - 0.16, height - 0.16, 0.004]} m={FURN.canvas} bevel={0.001} />
    </group>
  );
}
