/**
 * Shared GLSL for the "rendered" finish, used by the real-time post-processing
 * (Effects) and the path-traced display (PathTracer) so both read the same.
 */

/** Split-tone, S-curve contrast and saturation, in display space; input and output linear sRGB. */
export const GRADE_GLSL = /* glsl */ `
uniform vec3 shadowTint;
uniform vec3 highlightTint;
uniform float saturation;
uniform float contrast;

vec3 grade(vec3 linear) {
  vec3 g = pow(max(linear, 0.0), vec3(1.0 / 2.2));
  float l = dot(g, vec3(0.2126, 0.7152, 0.0722));
  g += shadowTint * (1.0 - smoothstep(0.0, 0.55, l)) + highlightTint * smoothstep(0.4, 1.0, l);
  g = clamp(g, 0.0, 1.0);
  g = mix(g, g * g * (3.0 - 2.0 * g), contrast);
  g = mix(vec3(dot(g, vec3(0.2126, 0.7152, 0.0722))), g, saturation);
  return pow(clamp(g, 0.0, 1.0), vec3(2.2));
}`;

/**
 * AgX filmic tone mapping (three.js's Filament/Blender port), without the
 * renderer's exposure uniform: callers scale the input themselves.
 * Input and output are linear sRGB.
 */
export const AGX_GLSL = /* glsl */ `
vec3 agxContrast(vec3 x) {
  vec3 x2 = x * x;
  vec3 x4 = x2 * x2;
  return 15.5 * x4 * x2 - 40.14 * x4 * x + 31.96 * x4 - 6.868 * x2 * x + 0.4298 * x2 + 0.1191 * x - 0.00232;
}

vec3 agx(vec3 color) {
  const mat3 toRec2020 = mat3(
    vec3(0.6274, 0.0691, 0.0164),
    vec3(0.3293, 0.9195, 0.0880),
    vec3(0.0433, 0.0113, 0.8956)
  );
  const mat3 fromRec2020 = mat3(
    vec3(1.6605, -0.1246, -0.0182),
    vec3(-0.5876, 1.1329, -0.1006),
    vec3(-0.0728, -0.0083, 1.1187)
  );
  const mat3 inset = mat3(
    vec3(0.856627153315983, 0.137318972929847, 0.11189821299995),
    vec3(0.0951212405381588, 0.761241990602591, 0.0767994186031903),
    vec3(0.0482516061458583, 0.101439036467562, 0.811302368396859)
  );
  const mat3 outset = mat3(
    vec3(1.1271005818144368, -0.1413297634984383, -0.14132976349843826),
    vec3(-0.11060664309660323, 1.157823702216272, -0.11060664309660294),
    vec3(-0.016493938717834573, -0.016493938717834257, 1.2519364065950405)
  );
  const float minEv = -12.47393;
  const float maxEv = 4.026069;
  color = inset * (toRec2020 * color);
  color = clamp((log2(max(color, 1e-10)) - minEv) / (maxEv - minEv), 0.0, 1.0);
  color = outset * agxContrast(color);
  color = pow(max(vec3(0.0), color), vec3(2.2));
  return clamp(fromRec2020 * color, 0.0, 1.0);
}`;
