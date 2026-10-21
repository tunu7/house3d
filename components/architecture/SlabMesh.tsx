"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { planToShape } from "@/lib/architecture/geometry";
import type { Slab } from "@/types/architecture";

function slabShape(slab: Slab): THREE.Shape {
  const shape = new THREE.Shape(slab.outline.map((p) => new THREE.Vector2(...planToShape(p))));
  for (const h of slab.holes) {
    const hole = new THREE.Path();
    hole.moveTo(...planToShape({ x: h.x0, z: h.z0 }));
    hole.lineTo(...planToShape({ x: h.x1, z: h.z0 }));
    hole.lineTo(...planToShape({ x: h.x1, z: h.z1 }));
    hole.lineTo(...planToShape({ x: h.x0, z: h.z1 }));
    hole.closePath();
    shape.holes.push(hole);
  }
  return shape;
}

/** Extrudes a plan polygon (with holes) upward to form a slab whose top is at `slab.top`. */
export function SlabMesh({ slab, material }: { slab: Slab; material: THREE.Material }) {
  const geometry = useMemo(
    () => new THREE.ExtrudeGeometry(slabShape(slab), { depth: slab.thickness, bevelEnabled: false }),
    [slab],
  );
  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <mesh
      geometry={geometry}
      material={material}
      rotation-x={-Math.PI / 2}
      position-y={slab.top - slab.thickness}
      castShadow
      receiveShadow
    />
  );
}
