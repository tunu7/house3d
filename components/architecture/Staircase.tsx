"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { planToShape, planToWorld } from "@/lib/architecture/geometry";
import { HOUSE } from "@/lib/architecture/house";
import type { PlanPoint3 } from "@/types/architecture";
import { MATERIALS } from "./materials";

/** Each tread block extends below its top by one riser plus this waist, forming a stepped soffit. */
const WAIST = 0.15;
const RAIL = 0.045;
const POST = 0.03;

const toWorld = ([x, y, z]: PlanPoint3) => {
  const [wx, wz] = planToWorld(x, z);
  return new THREE.Vector3(wx, y, wz);
};

/** Box of square section `size` running from `a` to `b` (any direction). */
function segment(a: PlanPoint3, b: PlanPoint3, size: number): THREE.BufferGeometry {
  const pa = toWorld(a);
  const pb = toWorld(b);
  const dir = pb.clone().sub(pa);
  const geom = new THREE.BoxGeometry(dir.length(), size, size);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 0, 0), dir.normalize());
  geom.applyQuaternion(q);
  geom.translate(...pa.add(pb).multiplyScalar(0.5).toArray());
  return geom;
}

function useMerged(build: () => THREE.BufferGeometry[]) {
  const geometry = useMemo(() => {
    const parts = build();
    const merged = mergeGeometries(parts);
    parts.forEach((p) => p.dispose());
    return merged;
    // Built once from static model data.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return geometry;
}

/** Stair treads (stepped RCC look), handrails, newels and balusters. */
export function Staircase() {
  const { stair } = HOUSE;
  const base = HOUSE.levels.ground.ffl;

  const treads = useMerged(() =>
    stair.treads.map((t) => {
      const shape = new THREE.Shape(t.outline.map((p) => new THREE.Vector2(...planToShape(p))));
      const bottom = Math.max(0, t.top - stair.riser - WAIST);
      const geom = new THREE.ExtrudeGeometry(shape, { depth: t.top - bottom, bevelEnabled: false });
      geom.rotateX(-Math.PI / 2);
      geom.translate(0, base + bottom, 0);
      return geom;
    }),
  );

  const metal = useMerged(() => [
    ...stair.handrails.map((r) => segment(r.from, r.to, RAIL)),
    ...stair.posts.map((p) => segment(p.from, p.to, POST)),
  ]);

  return (
    <group>
      <mesh geometry={treads} material={MATERIALS.stairTread} castShadow receiveShadow />
      <mesh geometry={metal} material={MATERIALS.frame} castShadow />
    </group>
  );
}
