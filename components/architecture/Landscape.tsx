"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { planToWorld } from "@/lib/architecture/geometry";
import { HEDGE, LAWN, TREES, hedgeRuns, lawnExclusions, type Tree, type TreeKind } from "@/lib/architecture/landscape";
import { GROUND_LEVEL } from "@/lib/architecture/site";
import { initialQuality } from "@/lib/viewer/quality";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { grassTuft, hedgeGeometry, treeGeometry } from "./foliage";
import { leafTexture, surfaceTextures } from "./textures";

/** 3D grass tufts per square metre of lawn, by quality tier. */
const GRASS_DENSITY = { high: 60, low: 18 };

function rng(seed: number) {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

let materials: ReturnType<typeof createMaterials> | null = null;
function createMaterials() {
  const { foliage } = surfaceTextures();
  return {
    leaves: new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.8,
      map: leafTexture(),
      alphaTest: 0.45,
      alphaToCoverage: true,
      side: THREE.DoubleSide,
    }),
    core: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, map: foliage.map }),
    hedge: new THREE.MeshStandardMaterial({ color: "#5b7d3a", roughness: 0.9, map: foliage.map, normalMap: foliage.normalMap }),
    bark: new THREE.MeshStandardMaterial({ color: "#5a4636", roughness: 0.95 }),
    grass: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, side: THREE.DoubleSide }),
  };
}

/** Sets every instance's matrix (and optional colour) once, then freezes the mesh. */
function useInstances(
  count: number,
  write: (i: number, m: THREE.Matrix4, c: THREE.Color) => boolean | void,
  deps: unknown[],
) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    const c = new THREE.Color();
    for (let i = 0; i < count; i++) {
      c.set("#ffffff");
      const colour = write(i, m, c);
      mesh.setMatrixAt(i, m);
      if (colour) mesh.setColorAt(i, c);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return ref;
}

const q = new THREE.Quaternion();
const up = new THREE.Vector3(0, 1, 0);
const pos = new THREE.Vector3();
const scl = new THREE.Vector3();

/** One kind of tree with or without shadows: instanced leaves, crown core and trunk. */
function TreeSet({ kind, trees, seed }: { kind: TreeKind; trees: Tree[]; seed: number }) {
  const geo = useMemo(() => treeGeometry(kind, seed), [kind, seed]);
  const mat = materials!;
  const place = (i: number, m: THREE.Matrix4) => {
    const t = trees[i];
    const rand = rng(1000 + Math.round(t.x * 31 + t.z * 17));
    const [x, z] = planToWorld(t.x, t.z);
    const spread = kind === "broadleaf" ? 0.85 + rand() * 0.35 : 0.9 + rand() * 0.2;
    q.setFromAxisAngle(up, rand() * Math.PI * 2);
    m.compose(pos.set(x, GROUND_LEVEL, z), q, scl.set(t.height * spread, t.height, t.height * spread));
    return rand;
  };
  const tint = (i: number, m: THREE.Matrix4, c: THREE.Color) => {
    const rand = place(i, m);
    // Per-tree hue and vigour, so no two crowns match.
    c.setHSL(0.2 + (rand() - 0.5) * 0.08, 0.3 + rand() * 0.25, 0.75 + rand() * 0.2);
    return true;
  };
  const leaves = useInstances(trees.length, tint, [trees, geo]);
  const core = useInstances(trees.length, tint, [trees, geo]);
  const trunk = useInstances(trees.length, (i, m) => void place(i, m), [trees, geo]);
  const shadow = trees[0]?.shadow ?? false;
  return (
    <>
      <instancedMesh ref={leaves} args={[geo.leaves, mat.leaves, trees.length]} castShadow={shadow} receiveShadow />
      <instancedMesh ref={core} args={[geo.core, mat.core, trees.length]} castShadow={shadow} receiveShadow />
      <instancedMesh ref={trunk} args={[geo.trunk, mat.bark, trees.length]} castShadow={shadow} receiveShadow />
    </>
  );
}

/** Clipped boundary hedge around the plot, open at the front path: one merged mesh. */
function Hedge() {
  const geo = useMemo(() => {
    const parts = hedgeRuns().map((r, i) => {
      const [ax, az] = planToWorld(r.a.x, r.a.z);
      const [bx, bz] = planToWorld(r.b.x, r.b.z);
      const len = Math.hypot(bx - ax, bz - az);
      const g = hedgeGeometry(len + HEDGE.width, HEDGE.height, HEDGE.width, 41 + i * 5);
      g.rotateY(-Math.atan2(bz - az, bx - ax));
      g.translate((ax + bx) / 2, GROUND_LEVEL, (az + bz) / 2);
      return g;
    });
    const merged = mergeGeometries(parts)!;
    parts.forEach((p) => p.dispose());
    return merged;
  }, []);
  return <mesh geometry={geo} material={materials!.hedge} castShadow receiveShadow />;
}

/**
 * Lawn of short 3D grass tufts scattered over the garden (skipping paths,
 * beds and the house), tinted in broad patches the way real turf varies.
 */
function Grass({ density }: { density: number }) {
  const geo = useMemo(() => grassTuft(), []);
  const spots = useMemo(() => {
    const rand = rng(4242);
    const holes = lawnExclusions();
    const area = (LAWN.x1 - LAWN.x0) * (LAWN.z1 - LAWN.z0);
    const out: [number, number][] = [];
    for (let i = 0; i < area * density; i++) {
      const x = LAWN.x0 + rand() * (LAWN.x1 - LAWN.x0);
      const z = LAWN.z0 + rand() * (LAWN.z1 - LAWN.z0);
      if (!holes.some((r) => x > r.x0 && x < r.x1 && z > r.z0 && z < r.z1)) out.push([x, z]);
    }
    return out;
  }, [density]);
  const ref = useInstances(
    spots.length,
    (i, m, c) => {
      const [px, pz] = spots[i];
      const rand = rng(7 + i);
      const [x, z] = planToWorld(px, pz);
      const h = 0.08 + rand() * 0.07;
      const w = 1 + rand() * 0.8;
      q.setFromAxisAngle(up, rand() * Math.PI * 2);
      m.compose(pos.set(x, GROUND_LEVEL, z), q, scl.set(w, h, w));
      const patch = 0.5 + 0.5 * Math.sin(px * 0.9 + 1.3) * Math.sin(pz * 0.7 + 0.4);
      c.setRGB(0.85 + patch * 0.3, 0.9 + patch * 0.2, 0.8 + patch * 0.1);
      return true;
    },
    [spots, geo],
  );
  return <instancedMesh ref={ref} args={[geo, materials!.grass, spots.length]} receiveShadow />;
}

/** Garden and neighbourhood planting around the house. */
export function Landscape() {
  const [lush] = useState(() => initialQuality().postprocessing);
  materials ??= createMaterials();
  const groups = useMemo(() => {
    const out: { key: string; kind: TreeKind; trees: Tree[] }[] = [];
    for (const kind of ["broadleaf", "columnar"] as const) {
      for (const shadow of [true, false]) {
        const trees = TREES.filter((t) => t.kind === kind && t.shadow === shadow);
        if (trees.length) out.push({ key: `${kind}-${shadow}`, kind, trees });
      }
    }
    return out;
  }, []);
  return (
    <group>
      {groups.map((g, i) => (
        <TreeSet key={g.key} kind={g.kind} trees={g.trees} seed={101 + i * 37} />
      ))}
      <Hedge />
      <Grass density={lush ? GRASS_DENSITY.high : GRASS_DENSITY.low} />
    </group>
  );
}
