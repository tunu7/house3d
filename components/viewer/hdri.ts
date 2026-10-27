"use client";

import { useLoader } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";
import { HDRLoader } from "three/examples/jsm/loaders/HDRLoader.js";
import type { Atmosphere } from "@/lib/viewer/atmosphere";

/**
 * A photographed sky (equirectangular HDR) prepared for the scene: rotated
 * so its sun sits at the preset's azimuth, with the sun direction and the
 * horizon colour measured from the image so the key light and the fog match
 * what you see in the sky.
 *
 * The sun disc itself is clipped out of the image and handed back as an
 * analytic light of the same energy, as production renderers do: a 70 000×
 * hot spot in an environment map is the main source of path-tracing noise
 * (fireflies), while a directional light is sampled exactly.
 */
export interface SkyProbe {
  /** The sky with the sun disc clipped to sky brightness. */
  texture: THREE.DataTexture;
  /** Rotation about world Y that puts the image's sun at the preset azimuth. */
  rotation: THREE.Euler;
  /** World direction toward the brightest part of the sky (the sun, or the afterglow at dusk). */
  sun: THREE.Vector3;
  /** Irradiance removed with the sun disc (colour × intensity); black when the sun is down. */
  sunIrradiance: THREE.Color;
  /** Mean radiance just above the horizon (linear, before any intensity scale). */
  horizon: THREE.Color;
}

/** What the loader measures once per image, in image space. */
interface SkyAnalysis {
  sun: THREE.Vector3;
  sunIrradiance: THREE.Color;
  horizon: THREE.Color;
}

/** Brightest pixels averaged for the sun direction (a fraction of the upper hemisphere). */
const SUN_FRACTION = 0.0005;
/** Pixels within this angle of the sun and brighter than SUN_CLIP are part of the disc and its glare. */
const SUN_RADIUS = THREE.MathUtils.degToRad(4);
const SUN_CLIP = 25;
/** Horizon band sampled for the fog colour, in radians above the horizon. */
const HORIZON_BAND = [0.01, 0.06] as const;

function equirectDir(u: number, v: number, out = new THREE.Vector3()) {
  const phi = (u - 0.5) * 2 * Math.PI;
  const el = (v - 0.5) * Math.PI;
  return out.set(Math.cos(phi) * Math.cos(el), Math.sin(el), Math.sin(phi) * Math.cos(el));
}

/** Measures the sky and clips its sun disc in place (once, on load). */
function analyse(texture: THREE.DataTexture): SkyAnalysis {
  const { data, width, height } = texture.image as { data: Float32Array; width: number; height: number };
  const lum = (i: number) => 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
  // Rows run top (zenith) to bottom; the texture is flipped on upload, so v = 1 − row / height.
  const vOf = (row: number) => 1 - (row + 0.5) / height;
  const elOf = (row: number) => (vOf(row) - 0.5) * Math.PI;
  const upper = Math.floor(height / 2);
  const d = new THREE.Vector3();

  // Sun: luminance-weighted mean direction of the brightest pixels in the upper hemisphere.
  const values = new Float32Array(upper * width);
  for (let i = 0; i < values.length; i++) values[i] = lum(i * 4);
  values.sort();
  const threshold = values[values.length - Math.max(1, Math.floor(values.length * SUN_FRACTION))];
  const sum = new THREE.Vector3();
  for (let r = 0; r < upper; r++) {
    for (let c = 0; c < width; c++) {
      const l = lum((r * width + c) * 4);
      if (l >= threshold) sum.addScaledVector(equirectDir((c + 0.5) / width, vOf(r), d), l);
    }
  }
  const sun = sum.normalize();

  // Clip the disc, integrating the removed radiance × solid angle into irradiance.
  const sunIrradiance = new THREE.Color(0, 0, 0);
  const cosRadius = Math.cos(SUN_RADIUS);
  const pixelArea = ((2 * Math.PI) / width) * (Math.PI / height);
  for (let r = 0; r < upper; r++) {
    const solidAngle = pixelArea * Math.cos(elOf(r));
    for (let c = 0; c < width; c++) {
      const i = (r * width + c) * 4;
      const l = lum(i);
      if (l <= SUN_CLIP || equirectDir((c + 0.5) / width, vOf(r), d).dot(sun) < cosRadius) continue;
      const keep = SUN_CLIP / l;
      sunIrradiance.r += data[i] * (1 - keep) * solidAngle;
      sunIrradiance.g += data[i + 1] * (1 - keep) * solidAngle;
      sunIrradiance.b += data[i + 2] * (1 - keep) * solidAngle;
      data[i] *= keep;
      data[i + 1] *= keep;
      data[i + 2] *= keep;
    }
  }
  texture.needsUpdate = true;

  // Horizon colour: mean radiance in a thin band just above the horizon.
  const horizon = new THREE.Color(0, 0, 0);
  let n = 0;
  for (let r = 0; r < upper; r++) {
    const el = elOf(r);
    if (el < HORIZON_BAND[0] || el > HORIZON_BAND[1]) continue;
    for (let c = 0; c < width; c++) {
      const i = (r * width + c) * 4;
      horizon.r += data[i];
      horizon.g += data[i + 1];
      horizon.b += data[i + 2];
      n++;
    }
  }
  horizon.multiplyScalar(1 / Math.max(1, n));
  return { sun, sunIrradiance, horizon };
}

/** Float HDR loader whose textures are ready to use as equirectangular environments, analysed once. */
class SkyLoader extends HDRLoader {
  constructor() {
    super();
    this.setDataType(THREE.FloatType);
  }

  load(...[url, onLoad, onProgress, onError]: Parameters<HDRLoader["load"]>) {
    return super.load(
      url,
      (texture, data) => {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        texture.userData.sky = analyse(texture);
        onLoad?.(texture, data);
      },
      onProgress,
      onError,
    );
  }
}

/** Loads (suspending) and measures the sky for an atmosphere preset. */
export function useSky(a: Atmosphere): SkyProbe {
  const texture = useLoader(SkyLoader, a.sky.file) as THREE.DataTexture;
  return useMemo(() => {
    const { sun, sunIrradiance, horizon } = texture.userData.sky as SkyAnalysis;
    // Rotate about Y so the image's sun azimuth matches the preset's.
    const target = new THREE.Vector3(...a.sunPosition);
    const rotationY = Math.atan2(sun.z, sun.x) - Math.atan2(target.z, target.x);
    return {
      texture,
      rotation: new THREE.Euler(0, rotationY, 0),
      sun: sun.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), -rotationY),
      sunIrradiance,
      horizon,
    };
  }, [texture, a]);
}
