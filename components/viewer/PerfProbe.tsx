"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";

declare global {
  interface Window {
    __houseStats?: { calls: number; triangles: number; geometries: number; textures: number; fps: number; dpr: number };
  }
}

/**
 * With `?stats=1`, publishes renderer counters to `window.__houseStats` once a
 * second for automated performance checks. Renders nothing.
 */
export function PerfProbe() {
  const gl = useThree((s) => s.gl);
  const enabled = useRef(false);
  const frames = useRef(0);
  const elapsed = useRef(0);

  useEffect(() => {
    enabled.current = new URLSearchParams(window.location.search).get("stats") === "1";
  }, []);

  useFrame(({ invalidate }, delta) => {
    if (!enabled.current) return;
    // Measuring needs a continuous loop even in on-demand mode.
    invalidate();
    frames.current += 1;
    elapsed.current += delta;
    if (elapsed.current < 1) return;
    const { render, memory } = gl.info;
    window.__houseStats = {
      calls: render.calls,
      triangles: render.triangles,
      geometries: memory.geometries,
      textures: memory.textures,
      fps: Math.round(frames.current / elapsed.current),
      dpr: gl.getPixelRatio(),
    };
    frames.current = 0;
    elapsed.current = 0;
  });
  return null;
}
