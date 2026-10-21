"use client";

import { PerformanceMonitor } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useEffect, useState } from "react";
import { useViewerStore, type LayerKey } from "@/lib/store/viewer-store";
import { initialQuality } from "@/lib/viewer/quality";
import type { FloorId } from "@/types/architecture";
import { HouseScene } from "./HouseScene";

const FLOOR_PARAMS: FloorId[] = ["ground", "first"];
const LAYER_PARAMS: LayerKey[] = ["roof", "walls", "furniture"];

/**
 * Applies `?hide=roof,first,...&exploded=1` to the initial viewer state, so
 * specific views can be linked to and checked without the full UI.
 */
function useUrlViewState() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hidden = new Set((params.get("hide") ?? "").split(",").filter(Boolean));
    const { floors, layers, toggleFloor, toggleLayer, setExploded } = useViewerStore.getState();
    FLOOR_PARAMS.forEach((f) => hidden.has(f) && floors[f] && toggleFloor(f));
    LAYER_PARAMS.forEach((l) => hidden.has(l) && layers[l] && toggleLayer(l));
    if (params.get("exploded") === "1") setExploded(true);
  }, []);
}

type Vec3 = [number, number, number];

const DEFAULT_CAMERA: Vec3 = [14, 11, 17];
const DEFAULT_TARGET: Vec3 = [0, 2.5, 0];

/** Reads `?<key>=x,y,z` (world metres), falling back when absent or malformed. */
function vecParam(key: string, fallback: Vec3): Vec3 {
  const parts = new URLSearchParams(window.location.search).get(key)?.split(",").map(Number);
  return parts?.length === 3 && parts.every(Number.isFinite) ? (parts as Vec3) : fallback;
}

export default function HouseViewer() {
  useUrlViewState();
  const [quality] = useState(initialQuality);
  const [dpr, setDpr] = useState(quality.dpr[1]);
  // Render on demand (only when something changes) except in the walkthrough,
  // where keyboard movement needs a continuous loop.
  const walkMode = useViewerStore((s) => s.walkMode);
  return (
    <Canvas
      shadows="percentage"
      frameloop={walkMode ? "always" : "demand"}
      dpr={dpr}
      camera={{ position: vecParam("cam", DEFAULT_CAMERA), fov: 40, near: 0.1, far: 200 }}
      gl={{ antialias: quality.antialias, preserveDrawingBuffer: false, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        const canvas = gl.domElement;
        canvas.addEventListener("webglcontextlost", (e) => {
          // Prevent default so the browser may restore the context.
          e.preventDefault();
          useViewerStore.getState().setContextLost(true);
        });
        canvas.addEventListener("webglcontextrestored", () => useViewerStore.getState().setContextLost(false));
      }}
    >
      {/* Step the pixel ratio down if the frame rate drops, back up if it recovers. */}
      <PerformanceMonitor
        onDecline={() => setDpr(quality.dpr[0])}
        onIncline={() => setDpr(quality.dpr[1])}
      />
      <HouseScene target={vecParam("target", DEFAULT_TARGET)} shadowMapSize={quality.shadowMapSize} />
    </Canvas>
  );
}
