"use client";

import * as THREE from "three";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { MATERIALS } from "@/components/architecture/materials";
import { FURNITURE_COLORS } from "@/lib/style/theme";
import { applyFinish, furnitureTextures } from "./finishes";

const C = FURNITURE_COLORS;

/** Woven upholstery: soft sheen at grazing angles, as velvet-like fabric scatters light. */
const fabric = (color: string) =>
  new THREE.MeshPhysicalMaterial({ color, roughness: 0.92, sheen: 0.6, sheenRoughness: 0.75, sheenColor: new THREE.Color("#ffffff") });

/**
 * Shared furniture materials. Colours live in `FURNITURE_COLORS`
 * (lib/style/theme.ts); textures are added client-side by `dressFurniture`.
 */
export const FURN = {
  oak: new THREE.MeshPhysicalMaterial({ color: C.oak, roughness: 0.5, clearcoat: 0.25, clearcoatRoughness: 0.35 }),
  walnut: new THREE.MeshPhysicalMaterial({ color: C.walnut, roughness: 0.45, clearcoat: 0.3, clearcoatRoughness: 0.3 }),
  /** Satin lacquered joinery (kitchen, wardrobes). */
  lacquer: new THREE.MeshPhysicalMaterial({ color: C.lacquer, roughness: 0.45, clearcoat: 0.5, clearcoatRoughness: 0.25 }),
  fabric: fabric(C.fabric),
  fabricDark: fabric(C.fabricDark),
  /** Accent cushions and throws. */
  terracotta: fabric(C.terracotta),
  ochre: fabric(C.ochre),
  /** Brass for lamp stems and frames. */
  brass: new THREE.MeshStandardMaterial({ color: C.brass, roughness: 0.3, metalness: 1 }),
  sage: fabric(C.sage),
  linen: fabric(C.linen),
  rug: new THREE.MeshStandardMaterial({ color: C.rug, roughness: 1 }),
  /** Vitreous china: glossy glaze over a white body. */
  ceramic: new THREE.MeshPhysicalMaterial({ color: C.ceramic, roughness: 0.35, clearcoat: 1, clearcoatRoughness: 0.05 }),
  glaze: new THREE.MeshPhysicalMaterial({ color: C.glaze, roughness: 0.5, clearcoat: 0.8, clearcoatRoughness: 0.15 }),
  // Brushed steel: relies on the scene environment map for its reflections.
  steel: new THREE.MeshStandardMaterial({ color: C.steel, roughness: 0.28, metalness: 1 }),
  dark: new THREE.MeshStandardMaterial({ color: C.dark, roughness: 0.45, metalness: 0.2 }),
  /** Engineered-stone worktop, honed. */
  stone: new THREE.MeshPhysicalMaterial({ color: C.stone, roughness: 0.35, clearcoat: 0.4, clearcoatRoughness: 0.2 }),
  hobGlass: new THREE.MeshPhysicalMaterial({ color: C.hobGlass, roughness: 0.05, clearcoat: 1, clearcoatRoughness: 0.02 }),
  mirror: new THREE.MeshStandardMaterial({ color: C.mirror, roughness: 0.02, metalness: 1 }),
  /** Waxy house-plant leaves (two tones), stems and soil. */
  leaf: new THREE.MeshPhysicalMaterial({ color: C.leaf, roughness: 0.45, sheen: 0.3, sheenColor: new THREE.Color("#c8e0a0"), side: THREE.DoubleSide }),
  leafDark: new THREE.MeshPhysicalMaterial({ color: C.leafDark, roughness: 0.4, sheen: 0.3, sheenColor: new THREE.Color("#c8e0a0"), side: THREE.DoubleSide }),
  soil: new THREE.MeshStandardMaterial({ color: C.soil, roughness: 1 }),
  pot: new THREE.MeshStandardMaterial({ color: C.pot, roughness: 0.85 }),
  lampShade: new THREE.MeshStandardMaterial({ color: C.lampShade, emissive: C.lampShadeGlow, emissiveIntensity: 0.25, roughness: 0.9 }),
  books: C.books.map((color) => new THREE.MeshStandardMaterial({ color, roughness: 0.7 })),
  towel: fabric(C.towel),
  fruit: new THREE.MeshPhysicalMaterial({ color: C.fruit, roughness: 0.45, clearcoat: 0.6 }),
  /** Framed artwork canvases (texture added by `dressFurniture`). */
  canvas: new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.85 }),
  glass: MATERIALS.glass,
} as const;

let dressed = false;
/** Adds the procedural wood, fabric, stone and metal textures to the shared materials (once, client-side). */
export function dressFurniture() {
  if (dressed) return;
  dressed = true;
  const t = furnitureTextures();
  applyFinish(FURN.oak, t.oak, 0.4);
  applyFinish(FURN.walnut, t.walnut, 0.4);
  for (const m of [FURN.fabric, FURN.fabricDark, FURN.terracotta, FURN.ochre, FURN.sage, FURN.linen, FURN.towel]) applyFinish(m, t.fabric, 0.8);
  applyFinish(FURN.rug, t.rug, 1);
  applyFinish(FURN.stone, t.stone, 0.3);
  applyFinish(FURN.steel, t.steel, 0.15);
  applyFinish(FURN.canvas, t.painting, 0.6);
}

type V3 = [number, number, number];

/** Geometries shared by every piece with the same dimensions (MergeStatic copies them). */
const geometryCache = new Map<string, THREE.BufferGeometry>();
function cached(key: string, make: () => THREE.BufferGeometry) {
  let g = geometryCache.get(key);
  if (!g) geometryCache.set(key, (g = make()));
  return g;
}
const k = (n: number) => n.toFixed(4);

/**
 * Box by centre and size, in the item's local space, with softened edges:
 * real joinery is never razor-sharp, and the thin highlight along each edge
 * is much of what makes furniture read as solid. Hairline parts stay plain.
 */
export function B({ p, s, m, bevel = 0.005, rot }: { p: V3; s: V3; m: THREE.Material; bevel?: number; rot?: V3 }) {
  const r = Math.min(bevel, s[0] / 2 - 0.0005, s[1] / 2 - 0.0005, s[2] / 2 - 0.0005);
  const geometry =
    r < 0.0015
      ? cached(`box${s.map(k)}`, () => new THREE.BoxGeometry(...s))
      : cached(`rbox${s.map(k)}${k(r)}`, () => new RoundedBoxGeometry(s[0], s[1], s[2], 2, r));
  return <mesh geometry={geometry} position={p} rotation={rot} material={m} castShadow receiveShadow />;
}

/**
 * Rounded box with a larger radius (case goods with soft corners, mattresses).
 * For upholstery that should look stuffed rather than machined, use `Soft`.
 */
export function RB({ p, s, m, r = 0.04, rot }: { p: V3; s: V3; m: THREE.Material; r?: number; rot?: V3 }) {
  return <B p={p} s={s} m={m} bevel={r} rot={rot} />;
}

/**
 * A superellipsoid: a sphere pushed toward a box, axis by axis. `round` is
 * the exponent per axis — near 0 is flat-sided, 1 is fully round — so one
 * shape covers seat cushions (0.15, 0.4, 0.15), puffy pillows
 * (0.3, 0.3, 0.75) and a WC bowl (0.6, 0.4, 0.6).
 */
function superellipsoid(size: V3, round: V3): THREE.BufferGeometry {
  const base = new THREE.SphereGeometry(1, 32, 20);
  base.deleteAttribute("normal");
  base.deleteAttribute("uv");
  const g = mergeVertices(base);
  base.dispose();
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const v = [pos.getX(i), pos.getY(i), pos.getZ(i)].map((c, a) => (Math.sign(c) * Math.abs(c) ** round[a] * size[a]) / 2);
    pos.setXYZ(i, v[0], v[1], v[2]);
  }
  g.computeVertexNormals();
  g.setAttribute("uv", new THREE.Float32BufferAttribute(new Float32Array(pos.count * 2), 2));
  return g;
}

/** Stuffed upholstery (cushions, pillows, duvets) as a superellipsoid by centre and size. */
export function Soft({ p, s, m, round = [0.18, 0.45, 0.18], rot }: { p: V3; s: V3; m: THREE.Material; round?: V3; rot?: V3 }) {
  const geometry = cached(`soft${s.map(k)}${round.map(k)}`, () => superellipsoid(s, round));
  return <mesh geometry={geometry} position={p} rotation={rot} material={m} castShadow receiveShadow />;
}

/** Vertical cylinder by base-centre position. */
export function Cyl({ p, r, h, m, rTop = r, seg = 24, rot }: { p: V3; r: number; h: number; m: THREE.Material; rTop?: number; seg?: number; rot?: V3 }) {
  const geometry = cached(`cyl${k(r)}${k(rTop)}${k(h)}${seg}`, () => new THREE.CylinderGeometry(rTop, r, h, seg).translate(0, h / 2, 0));
  return <mesh geometry={geometry} position={p} rotation={rot} material={m} castShadow receiveShadow />;
}

/**
 * Turned shape (pot, vase, bowl, lamp base) from a profile of [radius, height]
 * points running bottom to top, rotated about the vertical axis.
 */
export function Lathe({ p, profile, m, seg = 32, id }: { p: V3; profile: [number, number][]; m: THREE.Material; seg?: number; id: string }) {
  const geometry = cached(`lathe-${id}`, () => new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), seg));
  return <mesh geometry={geometry} position={p} material={m} castShadow receiveShadow />;
}

/** Arched tube along a quarter-circle-and-spout path (taps, towel rails). */
export function Arch({ p, rise, reach, r, m, rot }: { p: V3; rise: number; reach: number; r: number; m: THREE.Material; rot?: V3 }) {
  const geometry = cached(`arch${k(rise)}${k(reach)}${k(r)}`, () => {
    const path = new THREE.CubicBezierCurve3(
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, rise * 1.25, 0),
      new THREE.Vector3(0, rise * 1.25, reach),
      new THREE.Vector3(0, rise * 0.8, reach),
    );
    return new THREE.TubeGeometry(path, 24, r, 10);
  });
  return <mesh geometry={geometry} position={p} rotation={rot} material={m} castShadow receiveShadow />;
}

/** Four tapered legs inset from the corners of a w × d footprint. */
export function Legs({ w, d, h, inset, size, m, taper = 0.7 }: { w: number; d: number; h: number; inset: number; size: number; m: THREE.Material; taper?: number }) {
  const xs = [-w / 2 + inset, w / 2 - inset];
  const zs = [-d / 2 + inset, d / 2 - inset];
  return (
    <>
      {xs.flatMap((x) =>
        zs.map((z) => <Cyl key={`${x}-${z}`} p={[x, 0, z]} r={(size / 2) * taper} rTop={size / 2} h={h} m={m} seg={12} />),
      )}
    </>
  );
}

/** A short row or stack of books; `standing` books stand spine-out along local X. */
export function Books({ p, count, standing = false, seed = 1 }: { p: V3; count: number; standing?: boolean; seed?: number }) {
  const books: { pos: V3; size: V3; turn: number; m: THREE.Material }[] = [];
  let run = 0;
  for (let i = 0; i < count; i++) {
    const n = (seed * 7 + i * 13) % 17;
    const m = FURN.books[(seed + i * 5) % FURN.books.length];
    if (standing) {
      const t = 0.025 + (n % 4) * 0.007;
      const h = 0.2 + (n % 5) * 0.02;
      books.push({ pos: [run + t / 2, h / 2, 0], size: [t, h, 0.15 + (n % 3) * 0.015], turn: 0, m });
      run += t + 0.002;
    } else {
      const t = 0.025 + (n % 3) * 0.01;
      books.push({ pos: [(n % 3) * 0.01 - 0.01, run + t / 2, 0], size: [0.24 - (n % 4) * 0.02, t, 0.17 - (n % 3) * 0.015], turn: (n - 8) * 0.03, m });
      run += t;
    }
  }
  return (
    <group position={p}>
      {books.map((b, i) => (
        <B key={i} p={b.pos} s={b.size} m={b.m} bevel={0.002} rot={[0, b.turn, 0]} />
      ))}
    </group>
  );
}

export interface PieceProps {
  w: number;
  d: number;
}
