import type { Opening, PlanPoint, PlanRect, Room, Wall } from "@/types/architecture";
import { DIMENSIONS } from "./dimensions";

const HALF_W = DIMENSIONS.overallWidth / 2;
const HALF_D = DIMENSIONS.overallDepth / 2;

export type Vec3 = [number, number, number];

/** Plan (x, z) → world (X, Z). The house is centred on the origin; the front faces +Z. */
export function planToWorld(x: number, z: number): [number, number] {
  return [x - HALF_W, HALF_D - z];
}

/**
 * Plan point → THREE.Shape coordinates for a shape that is extruded upward
 * after `rotation.x = -π/2` (shape y maps to world −Z).
 */
export function planToShape(p: PlanPoint): [number, number] {
  return [p.x - HALF_W, p.z - HALF_D];
}

export function rectArea(r: PlanRect): number {
  return (r.x1 - r.x0) * (r.z1 - r.z0);
}

export function roomArea(room: Room): number {
  return room.rects.reduce((sum, r) => sum + rectArea(r), 0);
}

export function rectOverlapArea(a: PlanRect, b: PlanRect): number {
  const w = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0);
  const d = Math.min(a.z1, b.z1) - Math.max(a.z0, b.z0);
  return w > 0 && d > 0 ? w * d : 0;
}

export function signedArea(points: PlanPoint[]): number {
  let sum = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    sum += a.x * b.z - b.x * a.z;
  }
  return sum / 2;
}

export function polygonArea(points: PlanPoint[]): number {
  return Math.abs(signedArea(points));
}

/** Point-in-polygon; points on the boundary count as inside. */
export function pointInPolygon(p: PlanPoint, poly: PlanPoint[], eps = 1e-9): boolean {
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const cross = (b.x - a.x) * (p.z - a.z) - (b.z - a.z) * (p.x - a.x);
    const within =
      p.x >= Math.min(a.x, b.x) - eps && p.x <= Math.max(a.x, b.x) + eps &&
      p.z >= Math.min(a.z, b.z) - eps && p.z <= Math.max(a.z, b.z) + eps;
    if (Math.abs(cross) < eps && within) return true;
  }
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i];
    const b = poly[j];
    if (a.z > p.z !== b.z > p.z && p.x < ((b.x - a.x) * (p.z - a.z)) / (b.z - a.z) + a.x) {
      inside = !inside;
    }
  }
  return inside;
}

/**
 * Offset a rectilinear (orthogonal) polygon outward by `d` (negative = inset).
 * Each vertex moves along the sum of its two edges' outward normals, which is
 * exact for 90° convex and reflex corners.
 */
export function offsetOrthoPolygon(points: PlanPoint[], d: number): PlanPoint[] {
  const ccw = signedArea(points) > 0;
  const n = points.length;
  const normal = (a: PlanPoint, b: PlanPoint): PlanPoint => {
    const len = Math.hypot(b.x - a.x, b.z - a.z);
    const nx = (b.z - a.z) / len;
    const nz = -(b.x - a.x) / len;
    return ccw ? { x: nx, z: nz } : { x: -nx, z: -nz };
  };
  return points.map((p, i) => {
    const prev = points[(i - 1 + n) % n];
    const next = points[(i + 1) % n];
    const n1 = normal(prev, p);
    const n2 = normal(p, next);
    return { x: p.x + d * (n1.x + n2.x), z: p.z + d * (n1.z + n2.z) };
  });
}

export interface BoxPiece {
  center: Vec3;
  size: Vec3;
}

/**
 * Split a wall into solid boxes around its openings: full-height piers between
 * openings, plus spandrels below sills and lintels above heads. Openings are
 * genuinely open — no geometry is generated inside them.
 */
export function wallPieces(wall: Wall, baseY: number): BoxPiece[] {
  const spans: { from: number; to: number; y0: number; y1: number }[] = [];
  const openings = [...wall.openings].sort((a, b) => a.from - b.from);
  let cursor = wall.from;
  for (const o of openings) {
    if (o.from > cursor) spans.push({ from: cursor, to: o.from, y0: 0, y1: wall.height });
    if (o.sill > 0) spans.push({ from: o.from, to: o.to, y0: 0, y1: o.sill });
    if (o.head < wall.height) spans.push({ from: o.from, to: o.to, y0: o.head, y1: wall.height });
    cursor = Math.max(cursor, o.to);
  }
  if (cursor < wall.to) spans.push({ from: cursor, to: wall.to, y0: 0, y1: wall.height });

  return spans.map(({ from, to, y0, y1 }) => {
    const mid = (from + to) / 2;
    const len = to - from;
    const [px, pz] = wall.axis === "x" ? [mid, wall.at] : [wall.at, mid];
    const [wx, wz] = planToWorld(px, pz);
    return {
      center: [wx, baseY + (y0 + y1) / 2, wz],
      size: wall.axis === "x" ? [len, y1 - y0, wall.thickness] : [wall.thickness, y1 - y0, len],
    };
  });
}

/** Parse a drawing label like "3.5 m × 4.5 m" into its area, if possible. */
export function labelArea(label: string | undefined): number | null {
  if (!label) return null;
  const m = label.match(/([\d.]+)\s*m?\s*[×x]\s*([\d.]+)/);
  return m ? Number(m[1]) * Number(m[2]) : null;
}

/** Unit vectors for a wall: `run` along its length, `normal` along its fixed axis. */
function wallAxes(wall: Wall): { run: PlanPoint; normal: PlanPoint } {
  return wall.axis === "x"
    ? { run: { x: 1, z: 0 }, normal: { x: 0, z: 1 } }
    : { run: { x: 0, z: 1 }, normal: { x: 1, z: 0 } };
}

/** Plan point at `along` on the wall's run axis, `offset` from its centreline. */
function wallPoint(wall: Wall, along: number, offset = 0): PlanPoint {
  return wall.axis === "x" ? { x: along, z: wall.at + offset } : { x: wall.at + offset, z: along };
}

/** Box aligned with a wall, spanning [a0, a1] along it and [y0, y1] above `baseY`. */
function wallBox(wall: Wall, baseY: number, a0: number, a1: number, y0: number, y1: number, depth: number, offset = 0): BoxPiece {
  const p = wallPoint(wall, (a0 + a1) / 2, offset);
  const [wx, wz] = planToWorld(p.x, p.z);
  const len = a1 - a0;
  return {
    center: [wx, baseY + (y0 + y1) / 2, wz],
    size: wall.axis === "x" ? [len, y1 - y0, depth] : [depth, y1 - y0, len],
  };
}

/** Coping cap along the top of a wall, `overhang` wider than the wall each side. */
export function wallCapPiece(wall: Wall, baseY: number, overhang: number, height: number): BoxPiece {
  return wallBox(wall, baseY, wall.from, wall.to, wall.height, wall.height + height, wall.thickness + 2 * overhang);
}

export interface FrameSpec {
  /** Face width of the frame profile. */
  width: number;
  /** Depth of the frame through the wall. */
  depth: number;
}

/**
 * Frame members for an opening: two jambs and a head, plus a sill for windows
 * and a central mullion for windows wider than `mullionOver`.
 */
export function openingFramePieces(wall: Wall, o: Opening, baseY: number, f: FrameSpec, mullionOver = 1.2): BoxPiece[] {
  const pieces = [
    wallBox(wall, baseY, o.from, o.from + f.width, o.sill, o.head, f.depth),
    wallBox(wall, baseY, o.to - f.width, o.to, o.sill, o.head, f.depth),
    wallBox(wall, baseY, o.from + f.width, o.to - f.width, o.head - f.width, o.head, f.depth),
  ];
  if (o.kind !== "door") {
    pieces.push(wallBox(wall, baseY, o.from + f.width, o.to - f.width, o.sill, o.sill + f.width, f.depth));
    if (o.to - o.from > mullionOver) {
      const mid = (o.from + o.to) / 2;
      pieces.push(wallBox(wall, baseY, mid - f.width / 2, mid + f.width / 2, o.sill + f.width, o.head - f.width, f.depth));
    }
  }
  return pieces;
}

/** Glass pane filling a window/vent inside its frame. */
export function paneBox(wall: Wall, o: Opening, baseY: number, frameWidth: number, thickness = 0.012): BoxPiece {
  return wallBox(wall, baseY, o.from + frameWidth, o.to - frameWidth, o.sill + frameWidth, o.head - frameWidth, thickness);
}

/**
 * Two-panel sliding grille in a door opening: both panels parked over the
 * `from` half on adjacent tracks (one slid behind the other), leaving the
 * other half of the doorway open. Each panel is a frame with vertical bars.
 */
export function slidingGrillePieces(wall: Wall, o: Opening, baseY: number, frameWidth: number): BoxPiece[] {
  const stile = 0.04;
  const rail = 0.05;
  const bar = 0.016;
  const barSpacing = 0.11;
  const depth = 0.03;
  const track = 0.035;
  const clear = o.to - o.from - 2 * frameWidth;
  const panelW = clear / 2 + 0.03;
  const a0 = o.from + frameWidth;
  const h0 = 0.01;
  const h1 = o.head - frameWidth;
  const pieces: BoxPiece[] = [];
  for (const offset of [-track, track]) {
    const a1 = a0 + panelW;
    pieces.push(
      wallBox(wall, baseY, a0, a0 + stile, h0, h1, depth, offset),
      wallBox(wall, baseY, a1 - stile, a1, h0, h1, depth, offset),
      wallBox(wall, baseY, a0 + stile, a1 - stile, h0, h0 + rail, depth, offset),
      wallBox(wall, baseY, a0 + stile, a1 - stile, h1 - rail, h1, depth, offset),
      wallBox(wall, baseY, a0 + stile, a1 - stile, (h0 + h1) / 2 - rail / 2, (h0 + h1) / 2 + rail / 2, depth, offset),
    );
    const inner = panelW - 2 * stile;
    const bars = Math.floor(inner / barSpacing);
    for (let i = 1; i <= bars; i++) {
      const c = a0 + stile + (inner * i) / (bars + 1);
      pieces.push(wallBox(wall, baseY, c - bar / 2, c + bar / 2, h0 + rail, h1 - rail, bar, offset));
    }
  }
  return pieces;
}

export interface LeafPlacement {
  center: Vec3;
  size: Vec3;
  /** Rotation about world Y for a box whose length runs along local X. */
  rotationY: number;
}

/**
 * Door leaf hinged at one jamb and opened `angle` radians toward the swing side.
 * Leaf thickness sits on the swing-side face of the wall.
 */
export function doorLeaf(wall: Wall, o: Opening, baseY: number, frameWidth: number, angle: number, thickness = 0.04): LeafPlacement {
  const { run, normal } = wallAxes(wall);
  const swing = o.swing ?? 1;
  const atStart = (o.hinge ?? "start") === "start";
  const width = o.to - o.from - 2 * frameWidth - 0.01;
  const height = o.head - frameWidth - 0.01;
  const hinge = wallPoint(wall, atStart ? o.from + frameWidth : o.to - frameWidth, swing * (wall.thickness / 2));
  const u = atStart ? run : { x: -run.x, z: -run.z };
  const n = { x: normal.x * swing, z: normal.z * swing };
  const dir = { x: u.x * Math.cos(angle) + n.x * Math.sin(angle), z: u.z * Math.cos(angle) + n.z * Math.sin(angle) };
  // Offset half the leaf thickness away from the wall plane it swung out of.
  const side = { x: -u.x * Math.sin(angle) + n.x * Math.cos(angle), z: -u.z * Math.sin(angle) + n.z * Math.cos(angle) };
  const c = {
    x: hinge.x + dir.x * (width / 2) - side.x * (thickness / 2),
    z: hinge.z + dir.z * (width / 2) - side.z * (thickness / 2),
  };
  const [wx, wz] = planToWorld(c.x, c.z);
  return {
    center: [wx, baseY + 0.005 + height / 2, wz],
    size: [width, height, thickness],
    // World direction is (dir.x, −dir.z); local X → (cos θ, 0, −sin θ).
    rotationY: Math.atan2(dir.z, dir.x),
  };
}

/** Outward-pointing plan normal of an exterior wall (away from the footprint interior). */
export function exteriorNormal(wall: Wall, footprint: PlanPoint[]): PlanPoint {
  const { normal } = wallAxes(wall);
  const mid = (wall.from + wall.to) / 2;
  const probe = wallPoint(wall, mid, wall.thickness);
  return pointInPolygon(probe, footprint) ? { x: -normal.x, z: -normal.z } : normal;
}

/** World (X, Z) → plan (x, z). Inverse of `planToWorld`. */
export function worldToPlan(x: number, z: number): PlanPoint {
  return { x: x + HALF_W, z: HALF_D - z };
}
