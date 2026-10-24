import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { rng } from "@/components/architecture/textures";

/**
 * House-plant geometry: real leaf blades (cupped across the midrib, drooping
 * toward the tip) on stems, so plants keep their silhouette from every angle
 * and catch light like waxy leaves. Deterministic per seed; split into two
 * leaf tones plus stems so each plant bakes into three draw batches.
 */

/** One leaf blade along +X from the origin: `length`, max `width`, cup and droop in metres. */
function blade(length: number, width: number, cup: number, droop: number, pointed: number): THREE.BufferGeometry {
  const nu = 8;
  const nv = 4;
  const positions: number[] = [];
  const index: number[] = [];
  for (let i = 0; i <= nu; i++) {
    const u = i / nu;
    // Ovate outline: widest a little below the middle, tapering to a point.
    const half = (width / 2) * Math.sin(Math.PI * u ** (0.8 + pointed * 0.4)) ** 0.8;
    for (let j = 0; j <= nv; j++) {
      const v = (j / nv) * 2 - 1;
      positions.push(u * length, cup * v * v * (half / (width / 2)) - droop * u * u, v * half);
    }
  }
  for (let i = 0; i < nu; i++) {
    for (let j = 0; j < nv; j++) {
      const a = i * (nv + 1) + j;
      const b = a + nv + 1;
      index.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  g.setIndex(index);
  g.computeVertexNormals();
  return g;
}

export type PlantKind = "fig" | "strappy";

export interface PlantGeometry {
  /** Each part is null when the plant has none (a strappy plant has no stems). */
  leaves: THREE.BufferGeometry | null;
  leavesDark: THREE.BufferGeometry | null;
  stems: THREE.BufferGeometry | null;
}

const cache = new Map<string, PlantGeometry>();

/**
 * A house plant rising `height` metres above the soil, about `spread` wide.
 * `fig`: a few woody stems carrying broad alternate leaves (fiddle-leaf fig /
 * rubber plant). `strappy`: long arching leaves from the crown (dracaena,
 * peace lily), for small pots.
 */
export function plantGeometry(kind: PlantKind, height: number, spread: number, seed: number): PlantGeometry {
  const key = `${kind}|${height.toFixed(2)}|${spread.toFixed(2)}|${seed}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const rand = rng(seed * 977 + 13);
  const light: THREE.BufferGeometry[] = [];
  const dark: THREE.BufferGeometry[] = [];
  const stems: THREE.BufferGeometry[] = [];
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();

  const place = (g: THREE.BufferGeometry, at: THREE.Vector3, azimuth: number, elevation: number, roll: number) => {
    e.set(0, azimuth, elevation, "YZX");
    q.setFromEuler(e);
    const r = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), roll);
    q.multiply(r);
    m.compose(at, q, new THREE.Vector3(1, 1, 1));
    g.applyMatrix4(m);
    (rand() > 0.45 ? light : dark).push(g);
  };

  if (kind === "fig") {
    const stemCount = 4;
    for (let s = 0; s < stemCount; s++) {
      const lean = new THREE.Vector3((rand() - 0.5) * spread * 0.5, height * (0.75 + rand() * 0.25), (rand() - 0.5) * spread * 0.5);
      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3((rand() - 0.5) * 0.04, 0, (rand() - 0.5) * 0.04),
        new THREE.Vector3(lean.x * 0.2, lean.y * 0.5, lean.z * 0.2),
        lean,
      );
      stems.push(new THREE.TubeGeometry(curve, 10, 0.011, 6));
      const leaves = 13 + Math.floor(rand() * 5);
      for (let i = 0; i < leaves; i++) {
        const t = 0.22 + (0.78 * i) / (leaves - 1);
        const at = curve.getPoint(Math.min(1, t));
        const size = 0.16 + rand() * 0.08 - (t > 0.9 ? 0.05 : 0);
        const g = blade(size * spread * 3.4, size * spread * 2.3, 0.02, 0.03 + rand() * 0.05, 0.2);
        place(g, at, i * 2.4 + s * 1.3 + rand() * 0.6, -0.1 + rand() * 0.75, (rand() - 0.5) * 0.8);
      }
    }
  } else {
    const leaves = 16 + Math.floor(rand() * 6);
    for (let i = 0; i < leaves; i++) {
      const len = height * (0.75 + rand() * 0.45);
      const g = blade(len, 0.035 + rand() * 0.025, 0.006, len * (0.3 + rand() * 0.3), 0.6);
      place(g, new THREE.Vector3((rand() - 0.5) * 0.03, 0.01, (rand() - 0.5) * 0.03), (i / leaves) * Math.PI * 2 + rand() * 0.4, 0.75 + rand() * 0.6, (rand() - 0.5) * 0.4);
    }
  }

  const merge = (parts: THREE.BufferGeometry[]) => {
    if (!parts.length) return null;
    const nonIndexed = parts.map((p) => {
      const n = p.index ? p.toNonIndexed() : p;
      for (const name of Object.keys(n.attributes)) if (name !== "position" && name !== "normal") n.deleteAttribute(name);
      return n;
    });
    return mergeGeometries(nonIndexed);
  };
  const result = { leaves: merge(light), leavesDark: merge(dark), stems: merge(stems) };
  cache.set(key, result);
  return result;
}
