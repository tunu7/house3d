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
 * Applies URL parameters to the initial viewer state — `?hide=roof,first,...`,
 * `?exploded=1`, `?time=dusk`, `?room=<id>`, `?walk=1`, `?pt=1` (path-traced
 * render mode) — so specific views can be linked to and checked without the
 * full UI.
 */
function useUrlViewState() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hidden = new Set((params.get("hide") ?? "").split(",").filter(Boolean));
    const { floors, layers, toggleFloor, toggleLayer, setExploded } = useViewerStore.getState();
    FLOOR_PARAMS.forEach((f) => hidden.has(f) && floors[f] && toggleFloor(f));
    LAYER_PARAMS.forEach((l) => hidden.has(l) && layers[l] && toggleLayer(l));
    if (params.get("exploded") === "1") setExploded(true);
    if (params.get("time") === "dusk") useViewerStore.getState().setTimeOfDay("dusk");
    // Deep links from the property page: focus a room, or start the walkthrough.
    const room = params.get("room");
    if (room) useViewerStore.getState().selectRoom(room);
    if (params.get("walk") === "1") useViewerStore.getState().setWalkMode(true);
    if (params.get("cutaway") === "1") useViewerStore.getState().setCutaway(true);
    if (params.get("pt") === "1") useViewerStore.getState().setRenderMode(true);
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

/**
 * `?fx=0` disables post-processing (useful for comparisons and automated
 * checks); `?fx=1` keeps it on even when the frame rate is low (offline
 * renders such as the gallery, where software rendering is slow).
 */
const fxParam = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("fx") : null;
const noFx = fxParam === "0";
const forceFx = fxParam === "1";

export default function HouseViewer() {
  useUrlViewState();
  const [quality] = useState(initialQuality);
  const [dpr, setDpr] = useState(quality.dpr[1]);
  // Post-processing is the first thing dropped if the frame rate falls.
  const [effects, setEffects] = useState(quality.postprocessing);
  // Render on demand (only when something changes) except in the walkthrough,
  // where keyboard movement needs a continuous loop.
  const walkMode = useViewerStore((s) => s.walkMode);
  // Render mode is slow by design: it keeps post-processing on and is never downgraded.
  const renderMode = useViewerStore((s) => s.renderMode);
  return (
    <Canvas
      shadows="percentage"
      frameloop={walkMode ? "always" : "demand"}
      dpr={dpr}
      camera={{ position: vecParam("cam", DEFAULT_CAMERA), fov: 40, near: 0.1, far: 400 }}
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
      {/* On a sustained frame-rate drop: lower the pixel ratio and drop post-processing; restore on recovery. */}
      {!renderMode && (
        <PerformanceMonitor
          onDecline={() => {
            setDpr(quality.dpr[0]);
            setEffects(false);
          }}
          onIncline={() => {
            setDpr(quality.dpr[1]);
            setEffects(quality.postprocessing);
          }}
        />
      )}
      <HouseScene target={vecParam("target", DEFAULT_TARGET)} quality={quality} effects={forceFx || renderMode || (effects && !noFx)} />
    </Canvas>
  );
}
