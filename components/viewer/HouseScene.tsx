"use client";

import { OrbitControls } from "@react-three/drei";
import { useViewerStore } from "@/lib/store/viewer-store";
import { HouseShell } from "@/components/architecture/HouseShell";
import { Site } from "@/components/architecture/Site";
import { CameraController } from "./CameraController";
import { ReadySignal } from "./LoadingScreen";
import { PerfProbe } from "./PerfProbe";
import { RoomSelector } from "./RoomSelector";
import { ShadowUpdater } from "./ShadowUpdater";
import { WalkController } from "./WalkController";

/** Scene contents: lighting, site, house, and camera controls. */
export function HouseScene({ target, shadowMapSize }: { target: [number, number, number]; shadowMapSize: number }) {
  const walkMode = useViewerStore((s) => s.walkMode);
  return (
    <>
      <color attach="background" args={["#eceae5"]} />
      <hemisphereLight args={["#ffffff", "#b9b2a5", 1.1]} />
      <directionalLight
        position={[12, 18, 10]}
        intensity={2.2}
        castShadow
        shadow-mapSize={[shadowMapSize, shadowMapSize]}
        shadow-camera-left={-14}
        shadow-camera-right={14}
        shadow-camera-top={14}
        shadow-camera-bottom={-14}
        shadow-camera-near={1}
        shadow-camera-far={60}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
      />
      <Site />
      <RoomSelector>
        <HouseShell />
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
    </>
  );
}
