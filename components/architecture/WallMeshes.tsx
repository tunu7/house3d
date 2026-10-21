"use client";

import { useMemo } from "react";
import type * as THREE from "three";
import { wallPieces } from "@/lib/architecture/geometry";
import type { Wall } from "@/types/architecture";
import { MergedBoxes } from "./MergedBoxes";

interface WallMeshesProps {
  walls: Wall[];
  baseY: number;
  material: THREE.Material;
}

/** Builds every wall piece into one merged geometry: one draw call per wall group. */
export function WallMeshes({ walls, baseY, material }: WallMeshesProps) {
  const pieces = useMemo(() => walls.flatMap((wall) => wallPieces(wall, baseY)), [walls, baseY]);
  return <MergedBoxes pieces={pieces} material={material} />;
}
