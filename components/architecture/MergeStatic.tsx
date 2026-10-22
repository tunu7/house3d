"use client";

import { type ReactNode, useEffect, useLayoutEffect, useRef, useState } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

interface Batch {
  key: string;
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  castShadow: boolean;
  receiveShadow: boolean;
}

const KEEP = ["position", "normal", "uv"];

/**
 * Box-projected UVs in metres: each face takes the two world axes it lies
 * along, so textures keep true scale and line up across baked pieces.
 */
function worldUVs(geometry: THREE.BufferGeometry) {
  const pos = geometry.getAttribute("position");
  const nrm = geometry.getAttribute("normal");
  const uv = geometry.getAttribute("uv");
  for (let i = 0; i < pos.count; i++) {
    const ax = Math.abs(nrm.getX(i));
    const ay = Math.abs(nrm.getY(i));
    const az = Math.abs(nrm.getZ(i));
    const [u, v] =
      ay >= ax && ay >= az ? [pos.getX(i), pos.getZ(i)] : ax >= az ? [pos.getZ(i), pos.getY(i)] : [pos.getX(i), pos.getY(i)];
    uv.setXY(i, u, v);
  }
  uv.needsUpdate = true;
}

/**
 * Renders `children` once, then bakes every mesh inside into one geometry per
 * material (and shadow setting) and swaps the originals out. For static
 * content built from many small primitives (furniture, partitions) this turns
 * hundreds of draw calls into a handful.
 *
 * Children must be static: re-key this component to rebuild.
 */
export function MergeStatic({ children }: { children: ReactNode }) {
  const source = useRef<THREE.Group>(null);
  const [batches, setBatches] = useState<Batch[] | null>(null);

  useLayoutEffect(() => {
    const root = source.current;
    if (!root) return;
    root.updateWorldMatrix(true, true);
    const toLocal = new THREE.Matrix4().copy(root.matrixWorld).invert();
    const groups = new Map<string, { parts: THREE.BufferGeometry[]; material: THREE.Material; cast: boolean; receive: boolean }>();

    root.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh || Array.isArray(mesh.material)) return;
      let geom = mesh.geometry.clone();
      geom.applyMatrix4(new THREE.Matrix4().multiplyMatrices(toLocal, mesh.matrixWorld));
      // Mixed indexed (boxes, cylinders) and non-indexed (polyhedra) inputs: normalise.
      if (geom.index) geom = geom.toNonIndexed();
      for (const name of Object.keys(geom.attributes)) if (!KEEP.includes(name)) geom.deleteAttribute(name);
      if (!geom.attributes.uv) {
        geom.setAttribute("uv", new THREE.Float32BufferAttribute(new Float32Array(geom.attributes.position.count * 2), 2));
      }
      const key = `${mesh.material.uuid}|${mesh.castShadow}|${mesh.receiveShadow}`;
      const entry = groups.get(key) ?? { parts: [], material: mesh.material, cast: mesh.castShadow, receive: mesh.receiveShadow };
      entry.parts.push(geom);
      groups.set(key, entry);
    });

    const merged: Batch[] = [];
    for (const [key, g] of groups) {
      const geometry = mergeGeometries(g.parts);
      g.parts.forEach((p) => p.dispose());
      if (geometry) worldUVs(geometry);
      if (geometry) merged.push({ key, geometry, material: g.material, castShadow: g.cast, receiveShadow: g.receive });
    }
    setBatches(merged);
  }, []);

  useEffect(() => () => batches?.forEach((b) => b.geometry.dispose()), [batches]);

  if (!batches) return <group ref={source}>{children}</group>;
  return (
    <group>
      {batches.map((b) => (
        <mesh key={b.key} geometry={b.geometry} material={b.material} castShadow={b.castShadow} receiveShadow={b.receiveShadow} />
      ))}
    </group>
  );
}
