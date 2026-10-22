import type { TimeOfDay } from "@/lib/store/viewer-store";

type Vec3 = [number, number, number];

/** Everything the scene's lighting needs for one time of day. */
export interface Atmosphere {
  /** Direction toward the sun (world), scaled for the shadow camera. */
  sunPosition: Vec3;
  sunColor: string;
  sunIntensity: number;
  hemiSky: string;
  hemiGround: string;
  hemiIntensity: number;
  /** Strength of image-based lighting (sky reflections and fill). */
  environmentIntensity: number;
  /** Parameters for drei's physical <Sky> (sun direction is reused). */
  sky: { turbidity: number; rayleigh: number; mieCoefficient: number; mieDirectionalG: number };
  /** Sun direction used by the sky shader (may sit below the horizon). */
  skySun: Vec3;
  fog: { color: string; near: number; far: number };
  /** Emissive strength of light fittings (downlights, sconces, step strips). */
  glowIntensity: number;
  /** Interior and facade lamps switched on. */
  lampsOn: boolean;
  bloomIntensity: number;
  /** Only pixels brighter than this (linear) bloom; set above sunlit white walls. */
  bloomThreshold: number;
  exposure: number;
}

/**
 * Lighting presets. Day: high warm sun with a clear sky. Dusk: the sun just
 * below the horizon, a deep blue sky, warm lamps inside and on the facade —
 * the mood of the owner's reference photo.
 */
export const ATMOSPHERES: Record<TimeOfDay, Atmosphere> = {
  day: {
    sunPosition: [12, 18, 10],
    sunColor: "#fff2dc",
    sunIntensity: 2.5,
    hemiSky: "#dce8f5",
    hemiGround: "#8a8a6e",
    hemiIntensity: 0.18,
    environmentIntensity: 0.42,
    sky: { turbidity: 5, rayleigh: 1.1, mieCoefficient: 0.004, mieDirectionalG: 0.82 },
    skySun: [12, 18, 10],
    fog: { color: "#d9e2ea", near: 60, far: 180 },
    glowIntensity: 1.2,
    lampsOn: false,
    bloomIntensity: 0.2,
    bloomThreshold: 3,
    exposure: 0.9,
  },
  dusk: {
    sunPosition: [-18, 5, -8],
    sunColor: "#ffb585",
    sunIntensity: 0.32,
    hemiSky: "#6d80ad",
    hemiGround: "#3a342b",
    hemiIntensity: 0.7,
    environmentIntensity: 0.5,
    sky: { turbidity: 8, rayleigh: 2.6, mieCoefficient: 0.006, mieDirectionalG: 0.86 },
    skySun: [-18, -0.6, -8],
    fog: { color: "#3c4a6b", near: 35, far: 120 },
    glowIntensity: 7,
    lampsOn: true,
    bloomIntensity: 0.9,
    bloomThreshold: 1.2,
    exposure: 1.1,
  },
};
