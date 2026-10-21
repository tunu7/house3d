import type { PlanPoint, PlanPoint3, Stair, StairTread } from "@/types/architecture";
import { LEVELS, STAIR_OPENING } from "./dimensions";

/**
 * Three-flight U stair with winders, fitted into the clear stair well.
 *
 *   north  ┌──────── flight 3 (east) ──────→ landing
 *          │ W2 │        well
 *          │ fl.2 (north)
 *          │ W1 │
 *   south  └──────── flight 1 (west) ←────── foot (lobby)
 *          west wall                         x = 2.0 (open side)
 *
 * Provisional geometry: 0.8 m flights with three 30° winders per turn are
 * tighter than typical comfort guidance. Check against local code.
 */

const B = STAIR_OPENING;
const RISE = LEVELS.first.ffl - LEVELS.ground.ffl;
const RISERS = 18;
const R = RISE / RISERS;
const W = 0.8;
const WINDERS_PER_TURN = 3;
const STRAIGHT = { flight1: 4, flight2: 3, flight3: 4 } as const;
const HANDRAIL_HEIGHT = 0.9;

/** Inner corners of the turns (pivot of the winders). */
const P1: PlanPoint = { x: B.x0 + W, z: B.z0 + W };
const P2: PlanPoint = { x: B.x0 + W, z: B.z1 - W };

const rect = (x0: number, x1: number, z0: number, z1: number): PlanPoint[] => [
  { x: x0, z: z0 },
  { x: x1, z: z0 },
  { x: x1, z: z1 },
  { x: x0, z: z1 },
];

/**
 * Winder wedges radiating from `pivot` across a square turn whose far corner is
 * `outer`. Rays sweep 90° from `startDir` to `endDir` in equal steps.
 */
function winders(pivot: PlanPoint, outer: PlanPoint, startDir: PlanPoint, endDir: PlanPoint): PlanPoint[][] {
  const a0 = Math.atan2(startDir.z, startDir.x);
  const turn = Math.sign(startDir.x * endDir.z - startDir.z * endDir.x) * (Math.PI / 2);
  const hit = (t: number): PlanPoint => {
    const a = a0 + turn * t;
    const d = { x: Math.cos(a), z: Math.sin(a) };
    const candidates = [
      (outer.x - pivot.x) / d.x,
      (outer.z - pivot.z) / d.z,
    ].filter((s) => Number.isFinite(s) && s > 1e-9);
    const s = Math.min(...candidates);
    return { x: pivot.x + d.x * s, z: pivot.z + d.z * s };
  };
  return Array.from({ length: WINDERS_PER_TURN }, (_, i) => {
    const t0 = i / WINDERS_PER_TURN;
    const t1 = (i + 1) / WINDERS_PER_TURN;
    const poly = [pivot, hit(t0)];
    if (t0 < 0.5 && t1 > 0.5) poly.push(outer);
    poly.push(hit(t1));
    return poly;
  });
}

function buildTreads(): StairTread[] {
  const outlines: { outline: PlanPoint[]; kind: StairTread["kind"] }[] = [];
  const straight = (outline: PlanPoint[]) => outlines.push({ outline, kind: "straight" });
  const winder = (outline: PlanPoint[]) => outlines.push({ outline, kind: "winder" });

  // Flight 1: climbing west along the south side.
  const g1 = (B.x1 - P1.x) / STRAIGHT.flight1;
  for (let i = 0; i < STRAIGHT.flight1; i++) {
    straight(rect(B.x1 - (i + 1) * g1, B.x1 - i * g1, B.z0, P1.z));
  }
  winders(P1, { x: B.x0, z: B.z0 }, { x: 0, z: -1 }, { x: -1, z: 0 }).forEach(winder);

  // Flight 2: climbing north along the west wall.
  const g2 = (P2.z - P1.z) / STRAIGHT.flight2;
  for (let i = 0; i < STRAIGHT.flight2; i++) {
    straight(rect(B.x0, P1.x, P1.z + i * g2, P1.z + (i + 1) * g2));
  }
  winders(P2, { x: B.x0, z: B.z1 }, { x: -1, z: 0 }, { x: 0, z: 1 }).forEach(winder);

  // Flight 3: climbing east along the north side to the landing.
  const g3 = (B.x1 - P2.x) / STRAIGHT.flight3;
  for (let i = 0; i < STRAIGHT.flight3; i++) {
    straight(rect(P2.x + i * g3, P2.x + (i + 1) * g3, P2.z, B.z1));
  }

  return outlines.map((t, i) => ({ index: i + 1, top: (i + 1) * R, ...t }));
}

const TREADS = buildTreads();

/**
 * Handrail along the well edge of each flight, following the nosing line
 * extended to the turn pivots, with newel posts at the turns and balusters
 * on every straight tread.
 */
function buildRails(): Pick<Stair, "handrails" | "posts"> {
  const h = HANDRAIL_HEIGHT;
  const f1 = STRAIGHT.flight1;
  const f2Start = f1 + WINDERS_PER_TURN + 1;
  const f3Start = f2Start + STRAIGHT.flight2 + WINDERS_PER_TURN;

  // Each flight's rail spans its straight treads plus one extra going, so the
  // nosing slope carries through to the pivot / landing.
  const runs: { from: PlanPoint3; to: PlanPoint3 }[] = [
    { from: [B.x1, R + h, P1.z], to: [P1.x, (f1 + 1) * R + h, P1.z] },
    { from: [P1.x, f2Start * R + h, P1.z], to: [P1.x, (f2Start + STRAIGHT.flight2) * R + h, P2.z] },
    { from: [P2.x, f3Start * R + h, P2.z], to: [B.x1, (f3Start + STRAIGHT.flight3) * R + h, P2.z] },
  ];

  const railY = (run: (typeof runs)[number], x: number, z: number) => {
    const len = Math.hypot(run.to[0] - run.from[0], run.to[2] - run.from[2]);
    const t = Math.hypot(x - run.from[0], z - run.from[2]) / len;
    return run.from[1] + (run.to[1] - run.from[1]) * t;
  };

  const posts: { from: PlanPoint3; to: PlanPoint3 }[] = [
    // Newels from the ground at the foot, both turns, and the head of the stair.
    { from: [B.x1, 0, P1.z], to: [B.x1, runs[0].from[1], P1.z] },
    { from: [P1.x, 0, P1.z], to: [P1.x, runs[1].from[1], P1.z] },
    { from: [P2.x, 0, P2.z], to: [P2.x, runs[2].from[1], P2.z] },
    { from: [B.x1, 0, P2.z], to: [B.x1, runs[2].to[1], P2.z] },
  ];

  // One baluster per straight tread, at the tread's midpoint on the well edge.
  const flightOf = (index: number) =>
    index <= f1 ? runs[0] : index < f3Start ? runs[1] : runs[2];
  for (const tread of TREADS.filter((t) => t.kind === "straight")) {
    const run = flightOf(tread.index);
    const xs = tread.outline.map((p) => p.x);
    const zs = tread.outline.map((p) => p.z);
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
    const cz = (Math.min(...zs) + Math.max(...zs)) / 2;
    // Snap to the well edge (the run's fixed coordinate).
    const [x, z] = run.from[0] === run.to[0] ? [run.from[0], cz] : [cx, run.from[2]];
    posts.push({ from: [x, tread.top, z], to: [x, railY(run, x, z), z] });
  }

  return { handrails: runs, posts };
}

export const STAIR: Stair = {
  bounds: B,
  risers: RISERS,
  riser: R,
  flightWidth: W,
  treads: TREADS,
  ...buildRails(),
};
