"use client";

import { OrbitControls } from "@react-three/drei";
import { lazy, Suspense } from "react";
import { useViewerStore } from "@/lib/store/viewer-store";
import { HouseShell } from "@/components/architecture/HouseShell";
import { Site } from "@/components/architecture/Site";
import type { Quality } from "@/lib/viewer/quality";
import { CameraController } from "./CameraController";
import { FacadeLamps } from "./Lamps";
import { Lighting } from "./Lighting";
import { ReadySignal } from "./LoadingScreen";
import { PerfProbe } from "./PerfProbe";
import { RoomSelector } from "./RoomSelector";
import { ShadowUpdater } from "./ShadowUpdater";
import { WalkController } from "./WalkController";

/** Post-processing lives in its own chunk, downloaded only on devices that enable it. */
const Effects = lazy(() => import("./Effects").then((m) => ({ default: m.Effects })));
/** The path tracer is a large download: fetched only when render mode is first switched on. */
const PathTracer = lazy(() => import("./PathTracer").then((m) => ({ default: m.PathTracer })));

/**
 * Scene contents: lighting, site, house, and camera controls. Everything waits
 * for the sky image, so the loading screen stays up until the first real frame.
 */
export function HouseScene({ target, quality, effects }: { target: [number, number, number]; quality: Quality; effects: boolean }) {
  const walkMode = useViewerStore((s) => s.walkMode);
  const renderMode = useViewerStore((s) => s.renderMode);
  return (
    <Suspense fallback={null}>
      <Lighting shadowMapSize={quality.shadowMapSize} softShadows={quality.postprocessing} />
      <Site />
      <FacadeLamps />
      <RoomSelector>
        <HouseShell lampsAll={quality.lamps === "all"} />
      </RoomSelector>
      {walkMode ? (
        <WalkController />
      ) : (
        <OrbitControls
          makeDefault
          target={target}
          enableDamping
          minDistance={4}
          maxDistance={120}
          maxPolarAngle={Math.PI / 2 - 0.05}
        />
      )}
      <CameraController />
      <ReadySignal />
      <ShadowUpdater />
      <PerfProbe />
      {effects && (
        <Suspense fallback={null}>
          <Effects />
          {renderMode && <PathTracer />}
        </Suspense>
      )}
    </Suspense>
  );
}
