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

/** Scene contents: lighting, site, house, and camera controls. */
export function HouseScene({ target, quality, effects }: { target: [number, number, number]; quality: Quality; effects: boolean }) {
  const walkMode = useViewerStore((s) => s.walkMode);
  return (
    <>
      <Lighting shadowMapSize={quality.shadowMapSize} envResolution={quality.envResolution} />
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
          maxDistance={60}
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
        </Suspense>
      )}
    </>
  );
}
