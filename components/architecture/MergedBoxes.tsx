"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { BoxPiece } from "@/lib/architecture/geometry";

interface MergedBoxesProps {
  pieces: BoxPiece[];
  material: THREE.Material;
  castShadow?: boolean;
  receiveShadow?: boolean;
}

/** Merges axis-aligned boxes into one geometry: one draw call per material group. */
export function MergedBoxes({ pieces, material, castShadow = true, receiveShadow = true }: MergedBoxesProps) {
  const geometry = useMemo(() => {
    if (pieces.length === 0) return null;
    const parts = pieces.map(({ center, size }) => new THREE.BoxGeometry(...size).translate(...center));
    const merged = mergeGeometries(parts);
    parts.forEach((p) => p.dispose());
    return merged;
  }, [pieces]);

  useEffect(() => () => geometry?.dispose(), [geometry]);

  if (!geometry) return null;
  return <mesh geometry={geometry} material={material} castShadow={castShadow} receiveShadow={receiveShadow} />;
}
