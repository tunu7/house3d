import * as THREE from "three";
import { mergeGeometries, mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/**
 * Procedural plant geometry: lumpy foliage clumps, tree canopies and trunks,
 * and grass tufts. All deterministic, built once and shared by instanced
 * meshes, so a whole garden costs a handful of draw calls.
 */

/** Smooth 3D lumps from a few seeded sine products (cheap, tileable enough for clumps). */
function lumps(x: number, y: number, z: number, seed: number) {
  const a = Math.sin(x * 3.1 + seed) * Math.sin(y * 2.7 + seed * 1.7) * Math.sin(z * 3.3 + seed * 2.3);
  const b = Math.sin(x * 7.3 + seed * 3.1) * Math.sin(y * 6.1 + seed) * Math.sin(z * 6.7 + seed * 0.7);
  const c = Math.sin(x * 13.1 + seed * 0.3) * Math.sin(y * 11.7 + seed * 2.9) * Math.sin(z * 12.3 + seed * 1.3);
  return a * 0.6 + b * 0.28 + c * 0.12;
}

/** A foliage clump: an icosphere pushed in and out by smooth noise, with smooth normals. */
export function clump(radius: number, seed: number, detail = 2, lump = 0.22): THREE.BufferGeometry {
  const base = new THREE.IcosahedronGeometry(1, detail);
  base.deleteAttribute("normal");
  const g = mergeVertices(base);
  base.dispose();
  const pos = g.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i).normalize();
    const k = radius * (1 + lump * lumps(v.x, v.y, v.z, seed));
    pos.setXYZ(i, v.x * k, v.y * k * 0.9, v.z * k);
  }
  g.computeVertexNormals();
  return g;
}

/** Shades a geometry darker toward its base and core: self-shadowing that light alone can't give. */
function shadeByHeight(g: THREE.BufferGeometry, y0: number, y1: number, dark: THREE.Color, light: THREE.Color, seed: number) {
  const pos = g.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const t = THREE.MathUtils.clamp((pos.getY(i) - y0) / (y1 - y0), 0, 1);
    const n = 0.5 + 0.5 * lumps(pos.getX(i) * 1.7, pos.getY(i) * 1.7, pos.getZ(i) * 1.7, seed);
    c.copy(dark).lerp(light, THREE.MathUtils.clamp(t * 0.75 + n * 0.35, 0, 1));
    c.toArray(colors, i * 3);
  }
  g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
}

export interface TreeGeometry {
  /** Alpha-tested leaf cards: the visible, airy outline of the crown. */
  leaves: THREE.BufferGeometry;
  /** Solid inner clumps so the crown never looks see-through. */
  core: THREE.BufferGeometry;
  trunk: THREE.BufferGeometry;
}

interface Lobe {
  c: THREE.Vector3;
  r: number;
  /** Vertical stretch. */
  sy: number;
}

/**
 * Leaf cards scattered over each lobe's surface, facing random directions.
 * Normals point out from the crown (a blend of lobe and crown centre), the
 * standard foliage trick that makes a cloud of cards shade like one soft
 * volume; vertex colours darken the inner and lower cards.
 */
function leafCards(lobes: Lobe[], perLobe: number, size: number, crown: THREE.Vector3, y0: number, y1: number, rand: () => number) {
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const colors: number[] = [];
  const dark = new THREE.Color("#3b5a22");
  const light = new THREE.Color("#b5d06e");
  const c = new THREE.Color();
  const d = new THREE.Vector3();
  const p = new THREE.Vector3();
  const n = new THREE.Vector3();
  const u = new THREE.Vector3();
  const v = new THREE.Vector3();
  const corner = new THREE.Vector3();
  for (const lobe of lobes) {
    for (let k = 0; k < perLobe; k++) {
      d.set(rand() * 2 - 1, rand() * 2 - 1, rand() * 2 - 1).normalize();
      const depth = 0.8 + Math.sqrt(rand()) * 0.35;
      p.set(d.x * lobe.r * depth, d.y * lobe.r * depth * lobe.sy, d.z * lobe.r * depth).add(lobe.c);
      n.copy(p).sub(crown).normalize().lerp(d, 0.5).normalize();
      // Card plane: random orientation, biased to face outward.
      u.set(rand() * 2 - 1, rand() * 2 - 1, rand() * 2 - 1).cross(d).normalize();
      v.crossVectors(d, u).normalize().lerp(new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5), 0.4).normalize();
      const sz = size * (0.7 + rand() * 0.6);
      const t = THREE.MathUtils.clamp((p.y - y0) / (y1 - y0), 0, 1);
      c.copy(dark).lerp(light, THREE.MathUtils.clamp(t * 0.55 + (depth - 0.8) * 1.2 + rand() * 0.15, 0, 1));
      const quad: [number, number][] = [
        [-1, -1],
        [1, -1],
        [1, 1],
        [-1, -1],
        [1, 1],
        [-1, 1],
      ];
      for (const [a, b] of quad) {
        corner.copy(p).addScaledVector(u, (a * sz) / 2).addScaledVector(v, (b * sz) / 2);
        positions.push(corner.x, corner.y, corner.z);
        normals.push(n.x, n.y, n.z);
        uvs.push((a + 1) / 2, (b + 1) / 2);
        colors.push(c.r, c.g, c.b);
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  g.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  return g;
}

/** Unit-height tree (scaled per instance): leafy crown of lobes over a trunk with two limbs. */
export function treeGeometry(kind: "broadleaf" | "columnar", seed: number): TreeGeometry {
  let s = seed;
  const rand = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const lobes: Lobe[] = [];
  if (kind === "broadleaf") {
    // Wide, irregular crown from about 0.4 to 1.0 of the height.
    for (let i = 0; i < 14; i++) {
      const a = rand() * Math.PI * 2;
      const r = i < 2 ? rand() * 0.05 : 0.1 + rand() * 0.19;
      lobes.push({ c: new THREE.Vector3(Math.cos(a) * r, 0.6 + rand() * 0.27 - r * 0.4, Math.sin(a) * r), r: 0.1 + rand() * 0.07, sy: 0.85 });
    }
  } else {
    // Tall, narrow crown (a cypress / ashoka habit).
    for (let i = 0; i < 7; i++) {
      lobes.push({ c: new THREE.Vector3((rand() - 0.5) * 0.05, 0.25 + i * 0.11, (rand() - 0.5) * 0.05), r: 0.12 - Math.abs(i - 2.5) * 0.012, sy: 1.6 });
    }
  }
  const crown = lobes.reduce((acc, l) => acc.add(l.c), new THREE.Vector3()).divideScalar(lobes.length);
  const leaves = leafCards(lobes, kind === "broadleaf" ? 60 : 64, kind === "broadleaf" ? 0.12 : 0.09, crown, 0.3, 1, rand);
  const parts = lobes.map((l, i) => {
    const part = clump(l.r * 0.7, seed + i * 13, 1, 0.3);
    part.scale(1, l.sy, 1);
    part.translate(l.c.x, l.c.y, l.c.z);
    return part;
  });
  const core = mergeGeometries(parts)!;
  parts.forEach((p) => p.dispose());
  shadeByHeight(core, 0.25, 1, new THREE.Color("#243a16"), new THREE.Color("#5d7f37"), seed);

  const trunkParts: THREE.BufferGeometry[] = [];
  const stem = new THREE.CylinderGeometry(0.012, 0.022, kind === "broadleaf" ? 0.62 : 0.3, 7);
  stem.translate(0, kind === "broadleaf" ? 0.31 : 0.15, 0);
  trunkParts.push(stem);
  if (kind === "broadleaf") {
    for (const dir of [-1, 1]) {
      const limb = new THREE.CylinderGeometry(0.006, 0.011, 0.22, 6);
      limb.translate(0, 0.11, 0);
      limb.rotateZ(dir * 0.6);
      limb.rotateY(rand() * Math.PI);
      limb.translate(0, 0.45, 0);
      trunkParts.push(limb);
    }
  }
  const trunk = mergeGeometries(trunkParts.map((p) => p.toNonIndexed()))!;
  trunkParts.forEach((p) => p.dispose());
  return { leaves, core, trunk };
}

/**
 * Unit-height palm (scaled per instance): a slender, slightly leaning trunk
 * and a crown of arching fronds, each a spine of stiff, narrow leaflets in a
 * shallow V. The leaflets are solid blades (no leaf texture): see the palm
 * frond material in Landscape.
 */
export function palmGeometry(seed: number): TreeGeometry {
  let s = seed;
  const rand = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const lean = new THREE.Vector3((rand() - 0.5) * 0.12, 0, (rand() - 0.5) * 0.12);
  const crown = new THREE.Vector3(lean.x, 0.86, lean.z);

  // Trunk: a few tapered segments following a gentle curve to the crown.
  const segments = 6;
  const trunkParts: THREE.BufferGeometry[] = [];
  const at = (t: number) => new THREE.Vector3(lean.x * t * t, 0.86 * t, lean.z * t * t);
  for (let i = 0; i < segments; i++) {
    const a = at(i / segments);
    const b = at((i + 1) / segments);
    const len = a.distanceTo(b);
    const part = new THREE.CylinderGeometry(0.017 - 0.005 * ((i + 1) / segments), 0.017 - 0.005 * (i / segments), len * 1.02, 8);
    part.translate(0, len / 2, 0);
    part.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()));
    part.translate(a.x, a.y, a.z);
    trunkParts.push(part.toNonIndexed());
    part.dispose();
  }
  const trunk = mergeGeometries(trunkParts)!;
  trunkParts.forEach((p) => p.dispose());

  // Fronds: an arching spine with stiff, narrow leaflets in pairs, folded into a shallow V.
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const colors: number[] = [];
  const dark = new THREE.Color("#2f5220");
  const light = new THREE.Color("#8fb24a");
  const c = new THREE.Color();
  const fronds = 15;
  const spine = (dir: THREE.Vector3, length: number, rise: number, droop: number, t: number) =>
    new THREE.Vector3(dir.x * length * t, rise * t - droop * t * t, dir.z * length * t).add(crown);
  const up = new THREE.Vector3(0, 1, 0);
  for (let f = 0; f < fronds; f++) {
    const angle = (f / fronds) * Math.PI * 2 + rand() * 0.3;
    const dir = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
    const side = new THREE.Vector3(-dir.z, 0, dir.x);
    const length = 0.4 + rand() * 0.12;
    const rise = 0.14 + rand() * 0.1;
    const droop = 0.2 + rand() * 0.1;
    const leaflets = 38;
    for (let k = 1; k <= leaflets; k++) {
      const t = k / (leaflets + 1);
      const p = spine(dir, length, rise, droop, t);
      const tangent = spine(dir, length, rise, droop, t + 0.01).sub(p).normalize();
      // Leaflets are longest mid-frond and short at both ends.
      const len = 0.13 * Math.sin(Math.PI * Math.min(1, t * 1.15)) + 0.02;
      const width = 0.007;
      c.copy(dark).lerp(light, THREE.MathUtils.clamp(0.3 + t * 0.5 + rand() * 0.15, 0, 1));
      for (const sign of [-1, 1]) {
        // Out to the side, angled toward the tip and slightly down: the V of a palm frond.
        const out = side.clone().multiplyScalar(sign).addScaledVector(tangent, 0.45).add(new THREE.Vector3(0, -0.25, 0)).normalize();
        const across = new THREE.Vector3().crossVectors(out, up).normalize().multiplyScalar(width / 2);
        const n = new THREE.Vector3().crossVectors(across, out).normalize();
        if (n.y < 0) n.negate();
        const tip = p.clone().addScaledVector(out, len);
        // A slim blade: wide at the base, pointed at the tip.
        const tri = [p.clone().add(across), p.clone().sub(across), tip];
        for (const v of tri) {
          positions.push(v.x, v.y, v.z);
          normals.push(n.x, n.y, n.z);
          uvs.push(0.5, 0.5);
          colors.push(c.r, c.g, c.b);
        }
      }
    }
  }
  const leaves = new THREE.BufferGeometry();
  leaves.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  leaves.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  leaves.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  leaves.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));

  // Crown: the dark knot of frond bases (and coconuts) where the fronds meet.
  const core = clump(0.026, seed, 1, 0.35);
  core.translate(crown.x, crown.y - 0.01, crown.z);
  shadeByHeight(core, crown.y - 0.04, crown.y + 0.02, new THREE.Color("#3a2c1c"), new THREE.Color("#5f5a2c"), seed);
  return { leaves, core, trunk };
}

/**
 * Clipped hedge along a straight run (centred on the origin, along X): a
 * finely subdivided box with softened edges and a leafy, slightly uneven
 * surface, base at y = 0.
 */
export function hedgeGeometry(length: number, height: number, width: number, seed: number): THREE.BufferGeometry {
  const seg = (m: number) => Math.max(2, Math.round(m / 0.12));
  const base = new THREE.BoxGeometry(length, height, width, seg(length), seg(height), seg(width));
  base.deleteAttribute("normal");
  const g = mergeVertices(base);
  base.dispose();
  const pos = g.attributes.position;
  const half = new THREE.Vector3(length / 2, height / 2, width / 2);
  const round = 0.12;
  const p = new THREE.Vector3();
  const inner = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    p.fromBufferAttribute(pos, i);
    // Round every edge: pull points toward a shrunken inner box, then out by the radius.
    inner.set(
      THREE.MathUtils.clamp(p.x, -half.x + round, half.x - round),
      THREE.MathUtils.clamp(p.y, -half.y + round, half.y - round),
      THREE.MathUtils.clamp(p.z, -half.z + round, half.z - round),
    );
    const dir = p.clone().sub(inner);
    const len = dir.length() || 1;
    const bump = 1 + 0.25 * lumps(p.x * 2.2, p.y * 2.2, p.z * 2.2, seed);
    p.copy(inner).addScaledVector(dir, (round * bump) / len);
    // Base sits on the ground; the top bellies out slightly, as clipped hedges do.
    pos.setXYZ(i, p.x, p.y + height / 2, p.z * (1 + 0.06 * (p.y / half.y)));
  }
  g.computeVertexNormals();
  return g;
}

/**
 * A tuft of curved grass blades around the origin (about 7 cm across, 1 m
 * tall before instance scaling). Normals point up so the lawn shades evenly
 * like a turf surface instead of glittering blade by blade; vertex colours run
 * from a dark root to a sunlit tip.
 */
export function grassTuft(blades = 7, seed = 5): THREE.BufferGeometry {
  let s = seed;
  const rand = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const positions: number[] = [];
  const colors: number[] = [];
  const root = new THREE.Color("#1e3412");
  const tip = new THREE.Color("#a9c46a");
  const c = new THREE.Color();
  for (let b = 0; b < blades; b++) {
    const a = rand() * Math.PI * 2;
    const ox = Math.cos(a) * rand() * 0.035;
    const oz = Math.sin(a) * rand() * 0.035;
    const face = rand() * Math.PI;
    const lean = 0.15 + rand() * 0.25;
    const h = 0.7 + rand() * 0.3;
    const w = 0.006 + rand() * 0.004;
    const fx = Math.cos(face);
    const fz = Math.sin(face);
    // Blade profile: base, mid, tip; leaning outward along `a` with a curve.
    const ring = [0, 0.55, 1].map((t) => ({
      x: ox + Math.cos(a) * lean * t * t * h * 0.4,
      y: t * h,
      z: oz + Math.sin(a) * lean * t * t * h * 0.4,
      w: w * (1 - t * 0.95),
      t,
    }));
    const vert = (p: (typeof ring)[number], side: number) => {
      positions.push(p.x + fx * p.w * side, p.y, p.z + fz * p.w * side);
      c.copy(root).lerp(tip, Math.pow(p.t, 0.8));
      colors.push(c.r, c.g, c.b);
    };
    for (let k = 0; k < 2; k++) {
      const [p, q] = [ring[k], ring[k + 1]];
      for (const [v, side] of [[p, -1], [p, 1], [q, 1], [p, -1], [q, 1], [q, -1]] as const) vert(v, side);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  const normals = new Float32Array(positions.length);
  for (let i = 1; i < normals.length; i += 3) normals[i] = 1;
  g.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
  return g;
}
