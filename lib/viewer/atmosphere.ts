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
  /**
   * Photographed sky (equirectangular HDR, CC0 from Poly Haven): shown as the
   * background and used for image-based lighting, rotated so its sun sits at
   * `sunPosition`'s azimuth. `background` scales the visible sky.
   */
  sky: { file: string; background: number };
  /** Key light at the sky image's sun elevation (day), or exactly at `sunPosition` (dusk afterglow). */
  sunFromSky: boolean;
  /** Distance fog; its colour is taken from the sky's horizon so far objects melt into it. */
  fog: { near: number; far: number };
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
  /**
   * Path-traced render mode: exposure ahead of AgX (and inside the house, a
   * higher exposure and a warmer white balance, as a photographer would set
   * for rooms lit by blue skylight), the strength of the sky and its sun, and
   * of the interior and facade lamps.
   */
  pathTrace: { exposure: number; interiorExposure: number; interiorWhiteBalance: Vec3; sky: number; lamps: number };
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
    environmentIntensity: 1.1,
    sky: { file: "/hdri/day.hdr", background: 3.5 },
    sunFromSky: true,
    // Aerial perspective: distant trees fade into the horizon haze.
    fog: { near: 90, far: 320 },
    glowIntensity: 1.2,
    lampsOn: false,
    bloomIntensity: 0.25,
    bloomThreshold: 5,
    exposure: 0.9,
    // Bright enough that sunlit render reads warm and clean, not overcast.
    filmicExposure: 0.72,
    interiorExposure: 1.6,
    pathTrace: { exposure: 1.3, interiorExposure: 5, interiorWhiteBalance: [1.1, 1, 0.84], sky: 1, lamps: 1 },
    grade: { shadows: [-0.012, 0.0, 0.022], highlights: [0.03, 0.012, -0.018], saturation: 1.3, contrast: 0.35, vignette: 0.42 },
  },
  dusk: {
    sunPosition: [-18, 5, -8],
    sunColor: "#ffb585",
    sunIntensity: 0.32,
    hemiSky: "#6d80ad",
    hemiGround: "#3a342b",
    hemiIntensity: 0.7,
    environmentIntensity: 0.5,
    sky: { file: "/hdri/dusk.hdr", background: 1 },
    sunFromSky: false,
    fog: { near: 70, far: 240 },
    glowIntensity: 7,
    lampsOn: true,
    bloomIntensity: 0.9,
    bloomThreshold: 1.2,
    exposure: 1.1,
    filmicExposure: 0.95,
    interiorExposure: 1.15,
    pathTrace: { exposure: 1, interiorExposure: 1.5, interiorWhiteBalance: [1, 1, 1], sky: 1, lamps: 1 },
    grade: { shadows: [-0.01, 0.0, 0.03], highlights: [0.04, 0.012, -0.025], saturation: 1.08, contrast: 0.2, vignette: 0.5 },
  },
};
