"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import type { Atmosphere } from "@/lib/viewer/atmosphere";

const vertexShader = /* glsl */ `
varying vec3 vWorld;
void main() {
  vec4 w = modelMatrix * vec4(position, 1.0);
  vWorld = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
  // Pin to the far plane like the sky, so the dome is never clipped.
  gl_Position.z = gl_Position.w;
}`;

const fragmentShader = /* glsl */ `
uniform vec3 sunDir;
uniform vec3 litColor;
uniform vec3 shadeColor;
uniform float coverage;
uniform float opacity;
varying vec3 vWorld;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 6; i++) { v += a * noise(p); p = p * 2.03 + vec2(17.1, 9.2); a *= 0.5; }
  return v;
}

void main() {
  vec3 d = normalize(vWorld - cameraPosition);
  if (d.y <= 0.0) discard;
  // Project the view ray onto a flat cloud deck: clouds bunch up toward the horizon.
  vec2 p = d.xz / (d.y + 0.08) * 1.4 + vec2(3.0, 1.0);
  float n = fbm(p);
  float c = smoothstep(coverage, coverage + 0.22, n);
  // Self-shadowing: denser toward the sun-facing edge reads as a lit rim.
  float n2 = fbm(p + sunDir.xz * 0.12);
  float light = clamp(0.55 + (n - n2) * 5.0, 0.0, 1.0);
  float glow = pow(max(dot(d, sunDir), 0.0), 8.0);
  vec3 col = mix(shadeColor, litColor, light) * (1.0 + glow * 0.8);
  float a = c * opacity * smoothstep(0.0, 0.18, d.y);
  gl_FragColor = vec4(col, a);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

/**
 * Procedural cumulus over the sky dome: a flat cloud deck sampled along the
 * view ray, lit from the sun's side, thinning to nothing at the horizon so it
 * blends into the haze. Rendered just after the sky.
 */
export function Clouds({ atmosphere }: { atmosphere: Atmosphere }) {
  const material = useMemo(() => {
    const c = atmosphere.clouds;
    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        sunDir: { value: new THREE.Vector3(...atmosphere.skySun).normalize() },
        litColor: { value: new THREE.Color(c.lit).multiplyScalar(c.brightness) },
        shadeColor: { value: new THREE.Color(c.shade).multiplyScalar(c.brightness) },
        coverage: { value: c.coverage },
        opacity: { value: c.opacity },
      },
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
      fog: false,
    });
  }, [atmosphere]);
  useEffect(() => () => material.dispose(), [material]);
  return (
    <mesh material={material} renderOrder={-1} frustumCulled={false}>
      <sphereGeometry args={[350, 32, 16]} />
    </mesh>
  );
}

const toneFragment = /* glsl */ `
uniform float horizon;
uniform float zenith;
varying vec3 vWorld;
void main() {
  vec3 d = normalize(vWorld - cameraPosition);
  float f = mix(horizon, zenith, pow(clamp(d.y, 0.0, 1.0), 0.6));
  gl_FragColor = vec4(vec3(f), 1.0);
}`;

/**
 * Darkens the physical sky (and only the sky: it sits on the far plane) by a
 * horizon-to-zenith factor. The sky model is far brighter than the scene, so
 * under filmic tone mapping it washes out to white; this restores a deep
 * blue zenith like a photographic HDRI sky, and calms the image-based fill
 * light the environment map takes from it.
 */
export function SkyTone({ atmosphere }: { atmosphere: Atmosphere }) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader: toneFragment,
        uniforms: { horizon: { value: atmosphere.skyTone.horizon }, zenith: { value: atmosphere.skyTone.zenith } },
        side: THREE.BackSide,
        transparent: true,
        depthWrite: false,
        fog: false,
        blending: THREE.CustomBlending,
        blendEquation: THREE.AddEquation,
        blendSrc: THREE.ZeroFactor,
        blendDst: THREE.SrcColorFactor,
      }),
    [atmosphere],
  );
  useEffect(() => () => material.dispose(), [material]);
  return (
    <mesh material={material} renderOrder={-2} frustumCulled={false}>
      <sphereGeometry args={[360, 32, 16]} />
    </mesh>
  );
}
