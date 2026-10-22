"use client";

import { Environment, Lightformer, Sky } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import type * as THREE from "three";
import { MATERIALS } from "@/components/architecture/materials";
import { surfaceTextures } from "@/components/architecture/textures";
import { useViewerStore } from "@/lib/store/viewer-store";
import { ATMOSPHERES } from "@/lib/viewer/atmosphere";

/** Ground plane spans 60 m; lawn texture tiles every 2 m. */
const GROUND_REPEAT = 30;
const SHADOW_EXTENT = 16;

/** Gives the shared wall, path and lawn materials their procedural textures (once, client-side). */
function useSurfaceTextures() {
  useEffect(() => {
    const t = surfaceTextures();
    const apply = (m: (typeof MATERIALS)[keyof typeof MATERIALS], set: { map: THREE.Texture; normalMap: THREE.Texture }) => {
      m.map = set.map;
      m.normalMap = set.normalMap;
      m.needsUpdate = true;
    };
    apply(MATERIALS.exteriorWall, t.exteriorPlaster);
    apply(MATERIALS.interiorWall, t.interiorPlaster);
    apply(MATERIALS.eave, t.exteriorPlaster);
    apply(MATERIALS.path, t.concrete);
    const lawn = { map: t.grass.map.clone(), normalMap: t.grass.normalMap.clone() };
    lawn.map.repeat.set(GROUND_REPEAT, GROUND_REPEAT);
    lawn.normalMap.repeat.set(GROUND_REPEAT, GROUND_REPEAT);
    apply(MATERIALS.ground, lawn);
    // Textures modulate the material colour: lift colours that were tuned untextured.
    MATERIALS.ground.color.set("#ffffff");
    MATERIALS.path.color.set("#ffffff");
  }, []);
}

/**
 * Sky, image-based lighting, sun and fill for the current time of day. The
 * environment map is rendered once from the same procedural sky (plus a few
 * soft light panels), so glass and metal reflect what you see.
 */
export function Lighting({ shadowMapSize, envResolution }: { shadowMapSize: number; envResolution: number }) {
  useSurfaceTextures();
  const time = useViewerStore((s) => s.timeOfDay);
  const a = ATMOSPHERES[time];
  const get = useThree((s) => s.get);

  useEffect(() => {
    MATERIALS.glow.emissiveIntensity = a.glowIntensity;
    // Used when post-processing (which owns tone mapping) is off.
    get().gl.toneMappingExposure = a.exposure;
    get().invalidate();
  }, [a, get]);

  return (
    <>
      <Sky sunPosition={a.skySun} {...a.sky} />
      <fog attach="fog" args={[a.fog.color, a.fog.near, a.fog.far]} />
      <Environment key={time} frames={1} resolution={envResolution} environmentIntensity={a.environmentIntensity}>
        <Sky sunPosition={a.skySun} {...a.sky} distance={400} />
        {/* Soft overhead and side panels give glossy surfaces a studio-like sheen. */}
        <Lightformer form="rect" intensity={time === "day" ? 1.5 : 0.4} position={[0, 40, 0]} rotation-x={Math.PI / 2} scale={[60, 60, 1]} />
        <Lightformer form="rect" intensity={time === "day" ? 0.6 : 1.2} color={time === "day" ? "#ffffff" : "#ffb070"} position={[-40, 6, -10]} rotation-y={Math.PI / 2} scale={[40, 8, 1]} />
      </Environment>
      <hemisphereLight args={[a.hemiSky, a.hemiGround, a.hemiIntensity]} />
      <directionalLight
        position={a.sunPosition}
        color={a.sunColor}
        intensity={a.sunIntensity}
        castShadow
        shadow-mapSize={[shadowMapSize, shadowMapSize]}
        shadow-camera-left={-SHADOW_EXTENT}
        shadow-camera-right={SHADOW_EXTENT}
        shadow-camera-top={SHADOW_EXTENT}
        shadow-camera-bottom={-SHADOW_EXTENT}
        shadow-camera-near={1}
        shadow-camera-far={70}
        shadow-bias={-0.0003}
        shadow-normalBias={0.025}
        shadow-radius={3}
      />
    </>
  );
}
