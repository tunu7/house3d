export interface Quality {
  /** Device-pixel-ratio range for the canvas. */
  dpr: [number, number];
  shadowMapSize: number;
  antialias: boolean;
  /** Ambient occlusion, bloom and filmic tone mapping. */
  postprocessing: boolean;
  /** Dusk lamps: every room, or only the main living spaces. */
  lamps: "all" | "key";
  /** Environment (reflection) map resolution. */
  envResolution: number;
}

const HIGH: Quality = { dpr: [1, 2], shadowMapSize: 2048, antialias: true, postprocessing: true, lamps: "all", envResolution: 256 };
const LOW: Quality = { dpr: [1, 1.5], shadowMapSize: 1024, antialias: true, postprocessing: false, lamps: "key", envResolution: 128 };

/**
 * Starting render quality: phones and tablets (coarse pointer or narrow
 * screen) get a lower pixel-ratio cap and smaller shadow maps. The viewer
 * lowers DPR further at runtime if the frame rate drops.
 */
export function initialQuality(): Quality {
  if (typeof window === "undefined") return HIGH;
  const mobile = window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 768;
  return mobile ? LOW : HIGH;
}
