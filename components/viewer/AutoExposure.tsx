"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { worldToPlan } from "@/lib/architecture/geometry";
import { GRID, ROOF_TOP } from "@/lib/architecture/dimensions";
import { useViewerStore } from "@/lib/store/viewer-store";
import { ATMOSPHERES } from "@/lib/viewer/atmosphere";

/** Fraction of the remaining gap closed per second (eyes adapt in about a second). */
const ADAPT_RATE = 3;

/**
 * Eye adaptation, as archviz renderers do it: outdoors the exposure is set
 * for sunlight; when the camera goes inside the house it opens up so rooms lit
 * only by windows and lamps read naturally, easing between the two. Keeps
 * requesting frames while it is still adapting (the canvas renders on demand).
 */
export function AutoExposure() {
  const current = useRef<number | null>(null);
  useFrame(({ camera, gl, invalidate }, delta) => {
    const a = ATMOSPHERES[useViewerStore.getState().timeOfDay];
    const p = worldToPlan(camera.position.x, camera.position.z);
    const inside = p.x > GRID.x.left && p.x < GRID.x.right && p.z > GRID.z.front && p.z < GRID.z.back && camera.position.y < ROOF_TOP;
    const target = a.exposure * (inside ? a.interiorExposure : 1);
    const from = current.current ?? target;
    const next = Math.abs(target - from) < 0.002 ? target : from + (target - from) * Math.min(1, delta * ADAPT_RATE);
    current.current = next;
    gl.toneMappingExposure = next;
    if (next !== target) invalidate();
  });
  return null;
}
