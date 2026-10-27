"use client";

import { Bloom, ChromaticAberration, EffectComposer, N8AO, Noise, ToneMapping, Vignette } from "@react-three/postprocessing";
import { BlendFunction, Effect, ToneMappingMode } from "postprocessing";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useViewerStore } from "@/lib/store/viewer-store";
import { ATMOSPHERES, type Atmosphere } from "@/lib/viewer/atmosphere";
import { GRADE_GLSL } from "./grade";

const gradeShader = /* glsl */ `
${GRADE_GLSL}

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  outputColor = vec4(grade(inputColor.rgb), inputColor.a);
}`;

const exposureShader = /* glsl */ `
uniform float exposure;
void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  outputColor = vec4(inputColor.rgb * exposure, inputColor.a);
}`;

/**
 * Exposure ahead of tone mapping (the tone-mapping effect ignores the
 * renderer's exposure). Follows eye adaptation: AutoExposure drives the
 * renderer's exposure, and this scales it from the ACES to the AgX preset.
 */
class ExposureEffect extends Effect {
  private atmosphere: Atmosphere | null = null;
  constructor() {
    super("ExposureEffect", exposureShader, { uniforms: new Map([["exposure", new THREE.Uniform(1)]]) });
  }

  set(atmosphere: Atmosphere) {
    this.atmosphere = atmosphere;
  }

  update(renderer: THREE.WebGLRenderer) {
    const a = this.atmosphere;
    if (a) this.uniforms.get("exposure")!.value = (renderer.toneMappingExposure / a.exposure) * a.filmicExposure;
  }
}

/** Split-tone, contrast and saturation grade: the "rendered" look of archviz engines. */
class GradeEffect extends Effect {
  constructor() {
    super("GradeEffect", gradeShader, {
      uniforms: new Map<string, THREE.Uniform>([
        ["shadowTint", new THREE.Uniform(new THREE.Vector3())],
        ["highlightTint", new THREE.Uniform(new THREE.Vector3())],
        ["saturation", new THREE.Uniform(1)],
        ["contrast", new THREE.Uniform(0)],
      ]),
    });
  }

  set(grade: Atmosphere["grade"]) {
    (this.uniforms.get("shadowTint")!.value as THREE.Vector3).set(...grade.shadows);
    (this.uniforms.get("highlightTint")!.value as THREE.Vector3).set(...grade.highlights);
    this.uniforms.get("saturation")!.value = grade.saturation;
    this.uniforms.get("contrast")!.value = grade.contrast;
  }
}

const CA_OFFSET = new THREE.Vector2(0.0004, 0.0004);

/**
 * Desktop post-processing, tuned for an archviz-renderer finish (D5 /
 * Enscape style):
 *  - wide, soft ambient occlusion that reads as bounced-light contact shading;
 *  - bloom only on light sources and bright glints;
 *  - AgX filmic tone mapping (gentle highlight roll-off, no clipped skies);
 *  - a split-tone grade (cool shadows, warm highlights) with an S-curve;
 *  - faint lens fringing at the edges, a vignette and fine film grain.
 */
export function Effects() {
  const time = useViewerStore((s) => s.timeOfDay);
  const a = ATMOSPHERES[time];
  const grade = useMemo(() => new GradeEffect(), []);
  const exposure = useMemo(() => new ExposureEffect(), []);
  useEffect(() => {
    grade.set(a.grade);
    exposure.set(a);
  }, [grade, exposure, a]);
  useEffect(
    () => () => {
      grade.dispose();
      exposure.dispose();
    },
    [grade, exposure],
  );
  return (
    <EffectComposer multisampling={4}>
      <N8AO halfRes quality="medium" aoRadius={1.1} distanceFalloff={0.8} intensity={3} />
      <Bloom mipmapBlur luminanceThreshold={a.bloomThreshold} luminanceSmoothing={0.2} intensity={a.bloomIntensity} />
      <primitive object={exposure} />
      <ToneMapping mode={ToneMappingMode.AGX} />
      <primitive object={grade} />
      <ChromaticAberration offset={CA_OFFSET} radialModulation modulationOffset={0.35} />
      <Vignette offset={0.28} darkness={a.grade.vignette} />
      <Noise premultiply blendFunction={BlendFunction.SOFT_LIGHT} opacity={0.18} />
    </EffectComposer>
  );
}
