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
  /** Outdoor exposure for the renderer's own ACES tone mapping (post-processing off). */
  exposure: number;
  /** Outdoor exposure ahead of the post-processing AgX tone mapping. */
  filmicExposure: number;
  /** Exposure multiplier when the camera is inside the house (eye adaptation). */
  interiorExposure: number;
  /** Sky brightness multipliers at the horizon and the zenith (see SkyTone). */
  skyTone: { horizon: number; zenith: number };
  /** Procedural cloud layer: sunlit and shaded colours (linear, HDR), coverage threshold and opacity. */
  clouds: { lit: string; shade: string; brightness: number; coverage: number; opacity: number };
  /**
   * Final colour grade, applied after tone mapping in display space: tints
   * added to shadows and highlights (split toning), saturation, S-curve
   * contrast, and vignette darkness.
   */
  grade: { shadows: Vec3; highlights: Vec3; saturation: number; contrast: number; vignette: number };
}

/**
 * Lighting presets. Day: high warm sun with a clear sky. Dusk: the sun just
 * below the horizon, a deep blue sky, warm lamps inside and on the facade —
 * the mood of the owner's reference photo.
 */
export const ATMOSPHERES: Record<TimeOfDay, Atmosphere> = {
  day: {
    // Late-morning sun from the right, lower and warmer than noon: it rakes
    // across the front (canopy, fins and planters throw crisp shadows on the
    // facade) and the house casts a long shadow over the left lawn.
    sunPosition: [17, 11, 6],
    sunColor: "#ffe9cf",
    // Strong key against modest sky fill: a ~4:1 sun-to-shade ratio, as in a photograph.
    sunIntensity: 4.6,
    hemiSky: "#d6e4f3",
    hemiGround: "#7d7f5e",
    hemiIntensity: 0.14,
    environmentIntensity: 0.4,
    sky: { turbidity: 5, rayleigh: 2, mieCoefficient: 0.004, mieDirectionalG: 0.84 },
    skySun: [17, 11, 6],
    // Aerial perspective: distant trees fade into a pale blue haze.
    fog: { color: "#c4d3e3", near: 40, far: 190 },
    glowIntensity: 1.2,
    lampsOn: false,
    bloomIntensity: 0.25,
    bloomThreshold: 5,
    exposure: 0.9,
    // Bright enough that sunlit render reads warm and clean, not overcast.
    filmicExposure: 0.72,
    interiorExposure: 1.6,
    skyTone: { horizon: 0.62, zenith: 0.38 },
    clouds: { lit: "#ffffff", shade: "#aab5c6", brightness: 1.6, coverage: 0.5, opacity: 0.9 },
    grade: { shadows: [-0.012, 0.0, 0.022], highlights: [0.03, 0.012, -0.018], saturation: 1.12, contrast: 0.22, vignette: 0.42 },
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
    filmicExposure: 0.95,
    interiorExposure: 1.15,
    skyTone: { horizon: 1, zenith: 0.85 },
    clouds: { lit: "#ff9e6b", shade: "#38405e", brightness: 0.55, coverage: 0.5, opacity: 0.85 },
    grade: { shadows: [-0.01, 0.0, 0.03], highlights: [0.04, 0.012, -0.025], saturation: 1.08, contrast: 0.2, vignette: 0.5 },
  },
};
