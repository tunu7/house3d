"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { FullScreenQuad } from "three/examples/jsm/postprocessing/Pass.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { WebGLPathTracer } from "three-gpu-pathtracer";
import { GenerateMeshBVHWorker } from "three-mesh-bvh/worker";
import { FINE_DETAIL, MATERIALS, TRANSLUCENT } from "@/components/architecture/materials";
import { usePathTraceStatus } from "@/lib/store/path-trace-status";
import { useViewerStore } from "@/lib/store/viewer-store";
import { ATMOSPHERES, type Atmosphere } from "@/lib/viewer/atmosphere";
import { cameraInside } from "./AutoExposure";
import { AGX_GLSL, GRADE_GLSL } from "./grade";
import { type SkyProbe, useSky } from "./hdri";

/**
 * Path-traced render mode, the way D5 Render or Enscape produce a still:
 * whenever the camera rests, a GPU path tracer (three-gpu-pathtracer) refines
 * the view sample by sample — light bouncing between rooms, soft sun and sky
 * shadows, true reflections and glass — and fades it in over the real-time
 * frame. Moving the camera drops straight back to real time.
 *
 * The tracer sees a proxy of the scene: only physical geometry (instanced
 * planting baked into plain meshes, glazing swapped for transmissive glass),
 * lit by the photographed sky and its sun (as an exact directional light),
 * plus the lamps when they are on.
 */

/** Set on an object's `userData` to leave it (and its children) out of path-traced renders. */
export const NO_PATH_TRACE = "noPathTrace";

/** Camera must be still this long before tracing starts (and after any scene change). */
const REST_MS = 250;
/** Fade-in of the traced image over the real-time one. */
const FADE_MS = 600;
/** Stop refining here; the image is converged for a still. */
const MAX_SAMPLES = 2048;
const BOUNCES = 4;
const TRANSMISSIVE_BOUNCES = 6;
const TILES = 3;
/** Denoise strength fades to nothing by this many samples. */
const DENOISE_UNTIL = 300;

/**
 * Window panes: thin-walled clear glass with a faint tint, instead of the
 * real-time alpha-blended stand-in. By day, like archviz renderers, panes
 * don't block shadow rays, so sun and sky reach interiors directly instead of
 * by chance. At dusk the light is indoors, and pass-through panes would hide
 * glowing lamps seen through them (the tracer drops emission behind skipped
 * shadow casters), so they are traced solid.
 */
const glass = (castShadow: boolean) =>
  Object.assign(
    new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#ffffff").lerp(MATERIALS.glass.color, 0.2),
      roughness: 0,
      metalness: 0,
      transmission: 1,
      ior: 1.5,
      side: THREE.DoubleSide,
    }),
    { castShadow },
  );
const GLASS = { day: glass(false), lampsOn: glass(true) };
/** Pool water: a refracting, absorbing volume (the real-time stand-in is a tinted, see-through surface). */
const WATER = new THREE.MeshPhysicalMaterial({
  color: "#ffffff",
  roughness: 0.02,
  metalness: 0,
  transmission: 1,
  ior: 1.33,
  thickness: 1,
  attenuationColor: MATERIALS.water.color,
  attenuationDistance: 1.2,
});
const SUBSTITUTED = new Set<THREE.Material>([MATERIALS.glass, MATERIALS.water]);
const substitute = (m: THREE.Material, a: Atmosphere) =>
  m === MATERIALS.glass ? (a.lampsOn ? GLASS.lampsOn : GLASS.day) : m === MATERIALS.water ? WATER : null;
/** Leaves flagged `translucent` let some light through (thin, rough transmission), so backlit fronds aren't black. */
const LEAF_TRANSMISSION = 0.4;

/**
 * The material the tracer sees for a mesh:
 *  - glazing and pool water swapped for transmissive glass and water;
 *  - translucent leaves (`userData.translucent`) given a thin, rough transmission;
 *  - clearcoat dropped (the tracer renders clearcoat layers black), so
 *    lacquer, waxed wood and glazed stone are traced as their base layer, a
 *    little glossier to compensate;
 *  - shadow casting as in real time: meshes that cast no shadow there (grass,
 *    distant trees) block no shadow rays here either.
 */
const proxyMaterials = new Map<string, THREE.Material>();
function proxyMaterial(m: THREE.Material, castShadow: boolean, a: Atmosphere): THREE.Material {
  const swapped = substitute(m, a);
  if (swapped) return swapped;
  const clearcoat = m instanceof THREE.MeshPhysicalMaterial && m.clearcoat > 0;
  const translucent = Boolean(m.userData[TRANSLUCENT]);
  if (!clearcoat && !translucent && castShadow) return m;
  const key = `${m.uuid}:${castShadow}`;
  let p = proxyMaterials.get(key);
  if (!p) {
    p = m.clone();
    if (p instanceof THREE.MeshPhysicalMaterial && m instanceof THREE.MeshPhysicalMaterial && clearcoat) {
      p.clearcoat = 0;
      p.roughness = THREE.MathUtils.lerp(m.roughness, m.clearcoatRoughness, m.clearcoat * 0.5);
    }
    // The tracer reads these fields from any material, physical or not.
    Object.assign(p, { castShadow }, translucent ? { transmission: LEAF_TRANSMISSION, thickness: 0, ior: 1.3 } : {});
    proxyMaterials.set(key, p);
  }
  return p;
}

const unsupported = (m: THREE.Material) =>
  !m.visible || m instanceof THREE.ShaderMaterial || m instanceof THREE.MeshBasicMaterial || (m.transparent && m.opacity === 0);

/** Geometry and materials created for one proxy, disposed when it is replaced. */
interface Proxy {
  scene: THREE.Scene;
  dispose: () => void;
}

type Owned = { geometries: THREE.BufferGeometry[]; materials: THREE.Material[] };

/**
 * Vertex colours as RGBA floats, optionally tinted. The tracer merges every
 * mesh into one buffer and pads missing colours as RGBA, so RGB colours must
 * be widened to match.
 */
function rgbaColors(g: THREE.BufferGeometry, tint?: THREE.Color) {
  const n = g.attributes.position.count;
  const base = g.getAttribute("color");
  const out = new Float32Array(n * 4);
  for (let v = 0; v < n; v++) {
    out[v * 4] = (base ? base.getX(v) : 1) * (tint ? tint.r : 1);
    out[v * 4 + 1] = (base ? base.getY(v) : 1) * (tint ? tint.g : 1);
    out[v * 4 + 2] = (base ? base.getZ(v) : 1) * (tint ? tint.b : 1);
    out[v * 4 + 3] = base && base.itemSize === 4 ? base.getW(v) : 1;
  }
  g.setAttribute("color", new THREE.BufferAttribute(out, 4));
}

/** Bakes an instanced mesh into one static mesh (world transforms and instance colours applied). */
function bakeInstances(mesh: THREE.InstancedMesh, material: THREE.Material, owned: Owned) {
  const m = new THREE.Matrix4();
  const c = new THREE.Color();
  const parts: THREE.BufferGeometry[] = [];
  for (let i = 0; i < mesh.count; i++) {
    const g = mesh.geometry.clone();
    mesh.getMatrixAt(i, m);
    g.applyMatrix4(m.premultiply(mesh.matrixWorld));
    if (mesh.instanceColor) mesh.getColorAt(i, c);
    if (mesh.instanceColor || g.getAttribute("color")) rgbaColors(g, mesh.instanceColor ? c : undefined);
    parts.push(g);
  }
  const merged = parts.length ? mergeGeometries(parts, false) : null;
  parts.forEach((g) => g.dispose());
  if (!merged) return null;
  owned.geometries.push(merged);
  let mat = material;
  if (mesh.instanceColor && !material.vertexColors) {
    mat = material.clone();
    mat.vertexColors = true;
    owned.materials.push(mat);
  }
  return new THREE.Mesh(merged, mat);
}

function buildProxy(root: THREE.Scene, a: Atmosphere, sky: SkyProbe): Proxy {
  root.updateMatrixWorld(true);
  const scene = new THREE.Scene();
  const owned: Owned = { geometries: [], materials: [] };
  const place = (o: THREE.Object3D, matrix: THREE.Matrix4) => {
    o.matrixAutoUpdate = false;
    o.matrix.copy(matrix);
    scene.add(o);
  };

  const visit = (o: THREE.Object3D) => {
    if (!o.visible || o.userData[NO_PATH_TRACE]) return;
    if (o instanceof THREE.Mesh) {
      const source = Array.isArray(o.material) ? o.material[0] : (o.material as THREE.Material);
      if (source && !unsupported(source)) {
        const material = proxyMaterial(source, o.castShadow, a);
        if (o instanceof THREE.InstancedMesh) {
          const baked = bakeInstances(o, material, owned);
          if (baked) place(baked, new THREE.Matrix4());
        } else {
          let geometry = o.geometry as THREE.BufferGeometry;
          const color = geometry.getAttribute("color");
          if (color && color.itemSize !== 4) {
            geometry = geometry.clone();
            rgbaColors(geometry);
            owned.geometries.push(geometry);
          }
          place(new THREE.Mesh(geometry, material), o.matrixWorld);
        }
      }
    } else if (o instanceof THREE.PointLight && o.intensity > 0) {
      const light = new THREE.PointLight(o.color, o.intensity * a.pathTrace.lamps, o.distance, o.decay);
      light.position.setFromMatrixPosition(o.matrixWorld);
      scene.add(light);
    } else if (o instanceof THREE.SpotLight && o.intensity > 0) {
      const light = new THREE.SpotLight(o.color, o.intensity * a.pathTrace.lamps, o.distance, o.angle, o.penumbra, o.decay);
      light.position.setFromMatrixPosition(o.matrixWorld);
      light.target.position.setFromMatrixPosition(o.target.matrixWorld);
      scene.add(light, light.target);
    }
    o.children.forEach(visit);
  };
  root.children.forEach(visit);

  // The sun clipped out of the sky image, as an exactly sampled light of the same energy.
  const e = sky.sunIrradiance;
  const sunIntensity = 0.2126 * e.r + 0.7152 * e.g + 0.0722 * e.b;
  if (sunIntensity > 0) {
    const sun = new THREE.DirectionalLight(e.clone().multiplyScalar(1 / sunIntensity), sunIntensity * a.pathTrace.sky);
    sun.position.copy(sky.sun).multiplyScalar(100);
    scene.add(sun, sun.target);
  }

  // The photographed sky lights the scene and is seen behind it, at one scale.
  scene.environment = sky.texture;
  scene.environmentRotation.copy(sky.rotation);
  scene.environmentIntensity = a.pathTrace.sky;
  scene.background = sky.texture;
  scene.backgroundRotation.copy(sky.rotation);
  scene.backgroundIntensity = a.pathTrace.sky;
  return {
    scene,
    dispose: () => {
      owned.geometries.forEach((g) => g.dispose());
      owned.materials.forEach((m) => m.dispose());
    },
  };
}

/**
 * Rasterised normal/depth guide for the denoiser: view-space normal (rgb) and
 * view depth (a; 0 for sky). Instancing-aware, so planting is included, and
 * cut-out foliage is alpha-tested like the real material.
 */
function guideMaterial(output: "normalDepth" | "white", map: THREE.Texture | null = null, alphaTest = 0) {
  return new THREE.ShaderMaterial({
    uniforms: { map: { value: map }, alphaTest: { value: alphaTest } },
    defines: { ...(map ? { CUTOUT: "" } : {}), ...(output === "white" ? { WHITE: "" } : {}) },
    vertexShader: /* glsl */ `
      #include <common>
      varying vec3 vNormal;
      varying float vDepth;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        #include <beginnormal_vertex>
        #include <defaultnormal_vertex>
        #include <begin_vertex>
        #include <project_vertex>
        vNormal = transformedNormal;
        vDepth = -mvPosition.z;
      }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D map;
      uniform float alphaTest;
      varying vec3 vNormal;
      varying float vDepth;
      varying vec2 vUv;
      void main() {
        #ifdef CUTOUT
          if (texture2D(map, vUv).a < alphaTest) discard;
        #endif
        #ifdef WHITE
          gl_FragColor = vec4(1.0);
        #else
          gl_FragColor = vec4(normalize(vNormal) * (gl_FrontFacing ? 1.0 : -1.0), vDepth);
        #endif
      }`,
    side: THREE.DoubleSide,
  });
}
const guideMaterials = new Map<string, THREE.Material>();
/** The guide material for `m`: shared, or per texture when the material is alpha-cut. */
function guideOf(m: THREE.Material, output: "normalDepth" | "white"): THREE.Material {
  const { map, alphaTest } = m as THREE.MeshStandardMaterial;
  const cutout = map && alphaTest > 0;
  const key = `${output}:${cutout ? map.uuid : ""}`;
  let g = guideMaterials.get(key);
  if (!g) guideMaterials.set(key, (g = guideMaterial(output, cutout ? map : null, alphaTest)));
  return g;
}
const normalDepthOf = (m: THREE.Material) => guideOf(m, "normalDepth");

/**
 * Unlit base colour (with textures and vertex/instance colours) of a material,
 * for the albedo guide. Sub-pixel foliage is white: its colour can't be
 * separated from its lighting pixel by pixel, so it is filtered as a whole.
 */
const albedoMaterials = new WeakMap<THREE.Material, THREE.Material>();
function albedoOf(m: THREE.Material): THREE.Material {
  if (m.userData[FINE_DETAIL]) return guideOf(m, "white");
  let a = albedoMaterials.get(m);
  if (!a) {
    const src = m as THREE.MeshStandardMaterial;
    a = new THREE.MeshBasicMaterial({
      color: src.color ?? new THREE.Color("#ffffff"),
      map: src.map ?? null,
      vertexColors: src.vertexColors,
      alphaTest: src.alphaTest,
      side: src.side,
      fog: false,
      toneMapped: false,
    });
    albedoMaterials.set(m, a);
  }
  return a;
}

/**
 * Renders the scene into `target` with every surface's material replaced by
 * `pick(material)`. Glazing and overlays are hidden, so the guides describe
 * what the tracer sees through the windows.
 */
function renderPass(
  gl: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
  target: THREE.WebGLRenderTarget,
  pick: (m: THREE.Material) => THREE.Material,
  clearColor: THREE.ColorRepresentation = 0x000000,
) {
  const swapped: [THREE.Mesh, THREE.Material | THREE.Material[]][] = [];
  const hidden: THREE.Object3D[] = [];
  scene.traverseVisible((o) => {
    if (!(o instanceof THREE.Mesh)) return;
    const m = Array.isArray(o.material) ? o.material[0] : (o.material as THREE.Material);
    if (!m || unsupported(m) || SUBSTITUTED.has(m) || o.userData[NO_PATH_TRACE]) {
      hidden.push(o);
      return;
    }
    swapped.push([o, o.material]);
    o.material = pick(m);
  });
  hidden.forEach((o) => (o.visible = false));
  const { background } = scene;
  const clear = gl.getClearColor(new THREE.Color());
  const clearAlpha = gl.getClearAlpha();
  scene.background = null;
  gl.setRenderTarget(target);
  gl.setClearColor(clearColor, 0);
  gl.clear();
  gl.render(scene, camera);
  gl.setRenderTarget(null);
  gl.setClearColor(clear, clearAlpha);
  scene.background = background;
  hidden.forEach((o) => (o.visible = true));
  swapped.forEach(([o, m]) => (o.material = m));
}

/**
 * Tone maps and grades the accumulated radiance exactly like the real-time
 * post-processing, after denoising it the way archviz renderers do: the
 * radiance is divided by the surface colour (albedo) to leave only the
 * lighting, which is smooth; that is filtered across neighbours facing the
 * same way at the same depth, rejecting outliers (fireflies) against a first
 * local estimate; then the albedo is multiplied back, so textures stay sharp.
 * `denoise` (0–1) shrinks the filter as samples accumulate.
 */
function displayMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      map: { value: null },
      guide: { value: null },
      albedo: { value: null },
      texel: { value: new THREE.Vector2() },
      denoise: { value: 0 },
      exposure: { value: 1 },
      whiteBalance: { value: new THREE.Vector3(1, 1, 1) },
      opacity: { value: 0 },
      vignette: { value: 0.4 },
      shadowTint: { value: new THREE.Vector3() },
      highlightTint: { value: new THREE.Vector3() },
      saturation: { value: 1 },
      contrast: { value: 0 },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position.xy, 0.0, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D map;
      uniform sampler2D guide;
      uniform sampler2D albedo;
      uniform vec2 texel;
      uniform float denoise;
      uniform float exposure;
      uniform vec3 whiteBalance;
      uniform float opacity;
      uniform float vignette;
      varying vec2 vUv;
      ${AGX_GLSL}
      ${GRADE_GLSL}

      #define RADIUS 4

      float luma(vec3 c) {
        return dot(c, vec3(0.2126, 0.7152, 0.0722));
      }

      vec3 albedoAt(vec2 uv) {
        return max(texture2D(albedo, uv).rgb, vec3(0.03));
      }

      // Lighting only: radiance divided by surface colour.
      vec3 lightingAt(vec2 uv) {
        return texture2D(map, uv).rgb / albedoAt(uv);
      }

      // The guide is multisampled: a pixel covering one surface has a unit normal, while one
      // that mixes surfaces (a leaf against the sky, a blade over soil) averages to a shorter one.
      float purity(vec4 g) {
        return length(g.rgb);
      }

      // Sky blends only with sky; surfaces only with unmixed surfaces facing the same way at the same depth.
      float sameSurface(vec4 g0, vec4 g) {
        if (g0.a == 0.0 || g.a == 0.0) return float(g0.a == g.a);
        float facing = pow(max(dot(normalize(g.rgb), normalize(g0.rgb)), 0.0), 32.0);
        return facing * smoothstep(0.8, 0.95, purity(g)) * exp(-abs(g.a - g0.a) / (0.04 * g0.a + 0.02));
      }

      vec3 radiance() {
        vec3 raw = texture2D(map, vUv).rgb;
        vec4 g0 = texture2D(guide, vUv);
        // Mixed pixels are left as traced: no neighbour shares what they show.
        if (denoise <= 0.0 || (g0.a > 0.0 && purity(g0) < 0.9)) return raw;
        float stride = 1.0 + 2.0 * denoise;
        float sigma = max(3.0 * denoise, 0.05);

        // Pass 1: geometry-weighted local mean of the lighting.
        vec3 mean = vec3(0.0);
        float total = 0.0;
        for (int x = -RADIUS; x <= RADIUS; x++) {
          for (int y = -RADIUS; y <= RADIUS; y++) {
            vec2 d = vec2(float(x), float(y));
            vec2 uv = vUv + d * stride * texel;
            float w = exp(-dot(d, d) / (2.0 * sigma * sigma)) * sameSurface(g0, texture2D(guide, uv));
            mean += lightingAt(uv) * w;
            total += w;
          }
        }
        mean /= max(total, 1e-6);

        // Pass 2: the same, but samples far (in log brightness) from that mean count less.
        float tolerance = 0.35 + 1.0 * denoise;
        float logMean = log(luma(mean) + 1e-4);
        vec3 sum = vec3(0.0);
        vec3 sumRadiance = vec3(0.0);
        total = 0.0;
        for (int x = -RADIUS; x <= RADIUS; x++) {
          for (int y = -RADIUS; y <= RADIUS; y++) {
            vec2 d = vec2(float(x), float(y));
            vec2 uv = vUv + d * stride * texel;
            vec3 l = lightingAt(uv);
            float off = log(luma(l) + 1e-4) - logMean;
            float w = exp(-dot(d, d) / (2.0 * sigma * sigma) - off * off / (2.0 * tolerance * tolerance)) * sameSurface(g0, texture2D(guide, uv));
            sum += l * w;
            sumRadiance += texture2D(map, uv).rgb * w;
            total += w;
          }
        }
        if (total <= 1e-4) return mean * albedoAt(vUv);
        vec3 lighting = sum / total;

        // On surface boundaries, where a pixel mixes surfaces and the albedo can't
        // be divided out reliably, use the same filter on the radiance itself.
        float same = 0.0;
        for (int x = -1; x <= 1; x++) {
          for (int y = -1; y <= 1; y++) {
            same += step(0.5, sameSurface(g0, texture2D(guide, vUv + vec2(float(x), float(y)) * texel)));
          }
        }
        return mix(sumRadiance / total, lighting * albedoAt(vUv), smoothstep(5.0, 9.0, same));
      }

      void main() {
        vec3 c = grade(agx(radiance() * whiteBalance * exposure));
        // Same vignette as the real-time pass (postprocessing's, offset 0.28).
        c *= smoothstep(0.8, 0.28 * 0.799, distance(vUv, vec2(0.5)) * (vignette + 0.28));
        gl_FragColor = vec4(c, opacity);
        #include <colorspace_fragment>
      }`,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
  });
}

/** Publishes progress for the badge and for automated renders (`window.__ptSamples`). */
function report(samples: number, preparing = false) {
  const shown = Math.floor(samples);
  const status = usePathTraceStatus.getState();
  if (status.samples !== shown || status.preparing !== preparing) usePathTraceStatus.setState({ samples: shown, preparing });
  (window as unknown as { __ptSamples: number }).__ptSamples = shown;
}

/**
 * One path-tracing session: the tracer, its proxy scene, the denoise guide
 * and the display pass, plus the camera-rest bookkeeping. Driven once per
 * frame by <PathTracer>.
 */
class PathTraceSession {
  private readonly tracer: WebGLPathTracer;
  private readonly quad = new FullScreenQuad(displayMaterial());
  // Both guides are multisampled: a pixel that mixes surfaces (a leaf against the sky, a blade
  // over soil) averages to a normal and depth unlike either neighbour, so it is left unfiltered
  // rather than smeared toward the wrong surface.
  private readonly guide = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 });
  private readonly albedo = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 });
  private readonly camera = new THREE.Matrix4();
  private readonly projection = new THREE.Matrix4();
  private proxy: Proxy | null = null;
  private restSince = performance.now();
  private dirty = true;
  /** Background BVH build in flight (the page stays interactive meanwhile). */
  private building: Promise<void> | null = null;
  private readonly bvhWorker = new GenerateMeshBVHWorker();
  private guided = false;
  private opacity = 0;
  private disposed = false;

  constructor(gl: THREE.WebGLRenderer) {
    const pt = new WebGLPathTracer(gl);
    pt.renderToCanvas = false;
    pt.renderDelay = 0;
    pt.minSamples = 1;
    pt.bounces = BOUNCES;
    pt.transmissiveBounces = TRANSMISSIVE_BOUNCES;
    pt.filterGlossyFactor = 0.5;
    pt.multipleImportanceSampling = true;
    // Each frame traces one tile of the image, keeping every GPU submission short.
    pt.tiles.set(TILES, TILES);
    pt.textureSize.set(1024, 1024);
    pt.setBVHWorker(this.bvhWorker);
    this.tracer = pt;
  }

  /** The scene or lighting changed: rebuild the proxy once things settle. */
  invalidateScene() {
    this.dirty = true;
    this.guided = false;
    this.opacity = 0;
    this.restSince = performance.now();
  }

  /** Returns true while more frames are wanted. */
  frame(gl: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera, a: Atmosphere, sky: SkyProbe, delta: number): boolean {
    const now = performance.now();
    camera.updateMatrixWorld();
    if (!this.camera.equals(camera.matrixWorld) || !this.projection.equals(camera.projectionMatrix)) {
      this.camera.copy(camera.matrixWorld);
      this.projection.copy(camera.projectionMatrix);
      this.restSince = now;
      this.guided = false;
      this.opacity = 0;
      // Cutaway hides walls by camera direction: the proxy must follow.
      if (useViewerStore.getState().cutaway) this.dirty = true;
      if (this.proxy) this.tracer.updateCamera();
      report(0);
      return true;
    }
    if (now - this.restSince < REST_MS) return true;
    if (this.dirty && !this.building) {
      // Build the new proxy's BVH in a worker; the real-time view shows meanwhile.
      this.dirty = false;
      const proxy = buildProxy(scene, a, sky);
      this.building = this.tracer
        .setSceneAsync(proxy.scene, camera)
        .then(() => {
          if (this.disposed) {
            proxy.dispose();
            return;
          }
          this.proxy?.dispose();
          this.proxy = proxy;
          this.guided = false;
          this.opacity = 0;
          this.tracer.updateCamera();
        })
        .catch((error: unknown) => {
          proxy.dispose();
          console.error("Path tracer: scene build failed", error);
        })
        .finally(() => (this.building = null));
    }
    if (this.building || !this.proxy) {
      report(0, true);
      return true;
    }
    // Trace at CSS-pixel resolution; the display pass upscales smoothly.
    this.tracer.renderScale = 1 / gl.getPixelRatio();

    this.tracer.renderSample();
    const target = this.tracer.target;
    if (!this.guided) {
      this.guide.setSize(target.width, target.height);
      this.albedo.setSize(target.width, target.height);
      renderPass(gl, scene, camera, this.guide, normalDepthOf);
      // Sky counts as white, so silhouettes against it don't darken.
      renderPass(gl, scene, camera, this.albedo, albedoOf, 0xffffff);
      this.guided = true;
    }
    const samples = this.tracer.samples;
    report(samples);
    if (samples >= 1) {
      this.opacity = Math.min(1, this.opacity + (delta * 1000) / FADE_MS);
      this.draw(gl, camera, a, samples);
    }
    return samples < MAX_SAMPLES || this.opacity < 1;
  }

  private draw(gl: THREE.WebGLRenderer, camera: THREE.Camera, a: Atmosphere, samples: number) {
    const target = this.tracer.target;
    const u = (this.quad.material as THREE.ShaderMaterial).uniforms;
    u.map.value = target.texture;
    u.guide.value = this.guide.texture;
    u.albedo.value = this.albedo.texture;
    u.texel.value.set(1 / target.width, 1 / target.height);
    u.denoise.value = Math.max(0, 1 - Math.sqrt(samples / DENOISE_UNTIL));
    const inside = cameraInside(camera);
    u.exposure.value = a.pathTrace.exposure * (inside ? a.pathTrace.interiorExposure : 1);
    u.whiteBalance.value.set(...(inside ? a.pathTrace.interiorWhiteBalance : ([1, 1, 1] as const)));
    u.opacity.value = this.opacity;
    u.vignette.value = a.grade.vignette;
    u.shadowTint.value.set(...a.grade.shadows);
    u.highlightTint.value.set(...a.grade.highlights);
    u.saturation.value = a.grade.saturation;
    u.contrast.value = a.grade.contrast;
    const autoClear = gl.autoClear;
    gl.autoClear = false;
    gl.setRenderTarget(null);
    this.quad.render(gl);
    gl.autoClear = autoClear;
  }

  dispose() {
    this.disposed = true;
    this.proxy?.dispose();
    this.tracer.dispose();
    this.bvhWorker.dispose();
    this.guide.dispose();
    this.albedo.dispose();
    this.quad.material.dispose();
    this.quad.dispose();
    report(0);
  }
}

/** Mounted with the post-processing (it draws over the composer's frame, at render priority 2). */
export function PathTracer() {
  const invalidate = useThree((s) => s.invalidate);
  const time = useViewerStore((s) => s.timeOfDay);
  const a = ATMOSPHERES[time];
  const sky = useSky(a);
  // Created on the first frame and dropped on unmount, so a remount (Strict Mode) gets a fresh one.
  const session = useRef<PathTraceSession | null>(null);
  useEffect(
    () => () => {
      session.current?.dispose();
      session.current = null;
    },
    [],
  );

  // Any viewer change (floors, layers, cutaway, time of day…) rebuilds the proxy.
  useEffect(() => {
    session.current?.invalidateScene();
    invalidate();
    return useViewerStore.subscribe(() => {
      session.current?.invalidateScene();
      invalidate();
    });
  }, [invalidate, a, sky]);

  useFrame((state, delta) => {
    session.current ??= new PathTraceSession(state.gl);
    if (session.current.frame(state.gl, state.scene, state.camera, a, sky, delta)) state.invalidate();
  }, 2);

  return null;
}
