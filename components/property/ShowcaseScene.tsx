"use client";

import { OrbitControls, PerformanceMonitor } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { lazy, Suspense, useState } from "react";
import { HouseShell } from "@/components/architecture/HouseShell";
import { Site } from "@/components/architecture/Site";
import { FacadeLamps } from "@/components/viewer/Lamps";
import { Lighting } from "@/components/viewer/Lighting";
import { ReadySignal } from "@/components/viewer/LoadingScreen";
import { ShadowUpdater } from "@/components/viewer/ShadowUpdater";
import { initialQuality } from "@/lib/viewer/quality";

const Effects = lazy(() => import("@/components/viewer/Effects").then((m) => ({ default: m.Effects })));

/** Three-quarter front view from across the garden, at about first-floor eye level. */
const CAMERA: [number, number, number] = [13.5, 5.6, 18.5];
const TARGET: [number, number, number] = [0, 3.0, 0];

/**
 * Hero render for the property page: the full model, slowly turning, with no
 * picking, zoom or pan so the page still scrolls normally. Renders only while
 * `active` (on screen); otherwise the loop stops.
 */
export default function ShowcaseScene({ active }: { active: boolean }) {
  const [quality] = useState(initialQuality);
  const [dpr, setDpr] = useState(quality.dpr[1]);
  const [effects, setEffects] = useState(quality.postprocessing);
  return (
    <Canvas
      shadows="percentage"
      frameloop={active ? "always" : "never"}
      dpr={dpr}
      camera={{ position: CAMERA, fov: 32, near: 0.1, far: 400 }}
      gl={{ antialias: quality.antialias, powerPreference: "high-performance" }}
      style={{ touchAction: "pan-y" }}
    >
      <PerformanceMonitor
        onDecline={() => {
          setDpr(quality.dpr[0]);
          setEffects(false);
        }}
      />
      <Lighting shadowMapSize={quality.shadowMapSize} envResolution={quality.envResolution} />
      <Site />
      <FacadeLamps />
      <HouseShell lampsAll={quality.lamps === "all"} />
      <OrbitControls
        target={TARGET}
        autoRotate
        autoRotateSpeed={0.35}
        enableZoom={false}
        enablePan={false}
        enableDamping
        minPolarAngle={Math.PI / 2.9}
        maxPolarAngle={Math.PI / 2.15}
      />
      <ReadySignal />
      <ShadowUpdater />
      {effects && (
        <Suspense fallback={null}>
          <Effects />
        </Suspense>
      )}
    </Canvas>
  );
}
