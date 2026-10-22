"use client";

import { Bloom, BrightnessContrast, EffectComposer, N8AO, ToneMapping } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import { useViewerStore } from "@/lib/store/viewer-store";
import { ATMOSPHERES } from "@/lib/viewer/atmosphere";

/**
 * Desktop post-processing: half-resolution ambient occlusion for contact
 * shading in corners and under furniture, bloom only on light sources
 * (threshold set per time of day so sunlit walls never bloom), ACES filmic
 * tone mapping with the preset's exposure, and a touch of contrast.
 */
export function Effects() {
  const time = useViewerStore((s) => s.timeOfDay);
  const a = ATMOSPHERES[time];
  return (
    <EffectComposer multisampling={4}>
      <N8AO halfRes quality="medium" aoRadius={0.7} distanceFalloff={0.6} intensity={2.4} />
      <Bloom mipmapBlur luminanceThreshold={a.bloomThreshold} luminanceSmoothing={0.15} intensity={a.bloomIntensity} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <BrightnessContrast contrast={0.06} />
    </EffectComposer>
  );
}
