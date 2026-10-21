"use client";

import * as THREE from "three";
import { MATERIALS } from "@/components/architecture/materials";

/** Shared furniture palette: neutral, warm, with sage accents from the reference drawing. */
export const FURN = {
  oak: new THREE.MeshStandardMaterial({ color: "#a47a4f", roughness: 0.6 }),
  walnut: new THREE.MeshStandardMaterial({ color: "#5e4130", roughness: 0.55 }),
  lacquer: new THREE.MeshStandardMaterial({ color: "#f1ede6", roughness: 0.4 }),
  fabric: new THREE.MeshStandardMaterial({ color: "#d9d2c5", roughness: 0.95 }),
  fabricDark: new THREE.MeshStandardMaterial({ color: "#b9b1a3", roughness: 0.95 }),
  sage: new THREE.MeshStandardMaterial({ color: "#7c8a63", roughness: 0.9 }),
  linen: new THREE.MeshStandardMaterial({ color: "#f4f1ea", roughness: 0.9 }),
  rug: new THREE.MeshStandardMaterial({ color: "#b8a68a", roughness: 1 }),
  ceramic: new THREE.MeshStandardMaterial({ color: "#fbfbf9", roughness: 0.2 }),
  // Low metalness: there is no environment map, so fully metallic surfaces would render black.
  steel: new THREE.MeshStandardMaterial({ color: "#c9cccc", roughness: 0.35, metalness: 0.25 }),
  dark: new THREE.MeshStandardMaterial({ color: "#2b2b2a", roughness: 0.5 }),
  stone: new THREE.MeshStandardMaterial({ color: "#4a4744", roughness: 0.35 }),
  hobGlass: new THREE.MeshStandardMaterial({ color: "#111111", roughness: 0.1, metalness: 0.3 }),
  mirror: new THREE.MeshStandardMaterial({ color: "#c8d3d8", roughness: 0.08, metalness: 0.3 }),
  leaf: new THREE.MeshStandardMaterial({ color: "#5d7a45", roughness: 0.9 }),
  pot: new THREE.MeshStandardMaterial({ color: "#8a8178", roughness: 0.8 }),
  lampShade: new THREE.MeshStandardMaterial({ color: "#f3e9d6", emissive: "#f3d9a4", emissiveIntensity: 0.25, roughness: 0.9 }),
  glass: MATERIALS.glass,
} as const;

type V3 = [number, number, number];

/** Box by centre and size, in the item's local space. */
export function B({ p, s, m }: { p: V3; s: V3; m: THREE.Material }) {
  return (
    <mesh position={p} material={m} castShadow receiveShadow>
      <boxGeometry args={s} />
    </mesh>
  );
}

/** Vertical cylinder by base-centre position. */
export function Cyl({ p, r, h, m, rTop = r, seg = 20 }: { p: V3; r: number; h: number; m: THREE.Material; rTop?: number; seg?: number }) {
  return (
    <mesh position={[p[0], p[1] + h / 2, p[2]]} material={m} castShadow receiveShadow>
      <cylinderGeometry args={[rTop, r, h, seg]} />
    </mesh>
  );
}

/** Four legs inset from the corners of a w × d footprint. */
export function Legs({ w, d, h, inset, size, m }: { w: number; d: number; h: number; inset: number; size: number; m: THREE.Material }) {
  const xs = [-w / 2 + inset, w / 2 - inset];
  const zs = [-d / 2 + inset, d / 2 - inset];
  return (
    <>
      {xs.flatMap((x) => zs.map((z) => <B key={`${x}-${z}`} p={[x, h / 2, z]} s={[size, h, size]} m={m} />))}
    </>
  );
}

export interface PieceProps {
  w: number;
  d: number;
}
