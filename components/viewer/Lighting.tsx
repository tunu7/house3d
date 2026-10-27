"use client";

import { Environment, SoftShadows } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { MATERIALS } from "@/components/architecture/materials";
import { GROUND_SIZE } from "@/components/architecture/Site";
import { surfaceTextures } from "@/components/architecture/textures";
import { dressFurniture } from "@/components/furniture/parts";
import { useViewerStore } from "@/lib/store/viewer-store";
import { ARCH_COLORS } from "@/lib/style/theme";
import { ATMOSPHERES } from "@/lib/viewer/atmosphere";
import { AutoExposure } from "./AutoExposure";
import { useSky } from "./hdri";

/** Lawn texture tiles every 2 m across the whole ground plane. */
const GROUND_REPEAT = GROUND_SIZE / 2;
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
    apply(MATERIALS.paving, t.concrete);
    apply(MATERIALS.asphalt, t.asphalt);
    apply(MATERIALS.leaf, t.foliage);
    MATERIALS.leaf.color.set(ARCH_COLORS.leafTextured);
    const lawn = { map: t.grass.map.clone(), normalMap: t.grass.normalMap.clone() };
    lawn.map.repeat.set(GROUND_REPEAT, GROUND_REPEAT);
    lawn.normalMap.repeat.set(GROUND_REPEAT, GROUND_REPEAT);
    apply(MATERIALS.ground, lawn);
    // Textures modulate the material colour: lift colours that were tuned untextured.
    MATERIALS.ground.color.set("#ffffff");
    MATERIALS.path.color.set("#ffffff");
    dressFurniture();
  }, []);
}

/**
 * Sky, image-based lighting, sun and fill for the current time of day. A
 * photographed HDR sky is both the visible background and the environment
 * light, so glass and metal reflect the clouds you see; the key light comes
 * from the sky's own sun and the fog fades to its horizon. Suspends while the
 * sky image loads.
 */
export function Lighting({ shadowMapSize, softShadows }: { shadowMapSize: number; softShadows: boolean }) {
  useSurfaceTextures();
  const time = useViewerStore((s) => s.timeOfDay);
  const a = ATMOSPHERES[time];
  const get = useThree((s) => s.get);
  const sky = useSky(a);
  const sunPosition = useMemo(
    () => (a.sunFromSky ? sky.sun.clone().multiplyScalar(new THREE.Vector3(...a.sunPosition).length()) : new THREE.Vector3(...a.sunPosition)),
    [a, sky],
  );
  const fogColor = useMemo(() => sky.horizon.clone().multiplyScalar(a.sky.background), [a, sky]);

  useEffect(() => {
    MATERIALS.glow.emissiveIntensity = a.glowIntensity;
    MATERIALS.bulb.emissiveIntensity = a.lampsOn ? 4 : 0.15;
    get().invalidate();
  }, [a, get]);

  return (
    <>
      {/*
        Contact-hardening shadows (PCSS): crisp where an object meets the
        surface, softening with distance, as under a real sun or lamp.
      */}
      {softShadows && <SoftShadows size={14} samples={12} focus={0.6} />}
      <fog attach="fog" args={[fogColor, a.fog.near, a.fog.far]} />
      <Environment
        map={sky.texture}
        background
        backgroundIntensity={a.sky.background}
        backgroundRotation={sky.rotation}
        environmentIntensity={a.environmentIntensity}
        environmentRotation={sky.rotation}
      />
      <AutoExposure />
      <hemisphereLight args={[a.hemiSky, a.hemiGround, a.hemiIntensity]} />
      <directionalLight
        position={sunPosition}
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
