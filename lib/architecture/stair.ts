import type { PlanPoint, PlanPoint3, PlanRect, Stair, StairTread } from "@/types/architecture";
import { LEVELS, STAIR_OPENING } from "./dimensions";

/**
 * Half-turn (U) stair with winders, fitted into the 2.0 × 2.5 m well beside
 * the wet strip (owner revision R6).
 *
 *   north  ┌──── 6 winders (half turn) ────┐
 *          │  flight 2 ↓    ┃  flight 1 ↑  │
 *          │  (west half)   ┃  (east half) │
 *          │  arrives in    ┃──────────────┤
 *          │  the sitting   ┃ 3 winders  ← entry from the living room
 *   south  └── area above ──┸──────────────┘
 *          x = 1.5        x = 2.5        x = 3.5
 *
 * You enter from the living room at the south-east corner, turn north up the
 * east half, make a half turn at the back, then climb the west half heading
 * south, arriving at first-floor level in the open sitting area.
 *
 * Provisional geometry: winders at both turns; check against local code.
 */

const B = STAIR_OPENING;
const RISE = LEVELS.first.ffl - LEVELS.ground.ffl;
const RISERS = 18;
const R = RISE / RISERS;
const XM = (B.x0 + B.x1) / 2;
/** Each half of the well is one flight. */
const W = (B.x1 - B.x0) / 2;
const ENTRY_WINDERS = 3;
const TURN_WINDERS = 6;
const EAST_TREADS = 2;
const WEST_TREADS = RISERS - 1 - ENTRY_WINDERS - EAST_TREADS - TURN_WINDERS;
const HANDRAIL_HEIGHT = 0.9;

const rect = (x0: number, x1: number, z0: number, z1: number): PlanPoint[] => [
  { x: x0, z: z0 },
  { x: x1, z: z0 },
  { x: x1, z: z1 },
  { x: x0, z: z1 },
];

/**
 * Winder wedges fanning around `pivot` (on the region's boundary) from angle
 * `a0` through `sweep` radians, split into `n` equal angles. Each wedge runs
 * from the pivot to where its two rays leave `region`, picking up any region
 * corners in between.
 */
function fan(pivot: PlanPoint, region: PlanRect, a0: number, sweep: number, n: number): PlanPoint[][] {
  const hit = (a: number): PlanPoint => {
    const d = { x: Math.cos(a), z: Math.sin(a) };
    let best = Infinity;
    for (const xe of [region.x0, region.x1]) {
      if (Math.abs(d.x) < 1e-9) continue;
      const s = (xe - pivot.x) / d.x;
      const zz = pivot.z + d.z * s;
      if (s > 1e-6 && zz >= region.z0 - 1e-9 && zz <= region.z1 + 1e-9) best = Math.min(best, s);
    }
    for (const ze of [region.z0, region.z1]) {
      if (Math.abs(d.z) < 1e-9) continue;
      const s = (ze - pivot.z) / d.z;
      const xx = pivot.x + d.x * s;
      if (s > 1e-6 && xx >= region.x0 - 1e-9 && xx <= region.x1 + 1e-9) best = Math.min(best, s);
    }
    return { x: pivot.x + d.x * best, z: pivot.z + d.z * best };
  };
  // Progress of a direction along the sweep, in [0, 2π).
  const progress = (p: PlanPoint) => {
    const a = Math.atan2(p.z - pivot.z, p.x - pivot.x);
    const t = ((a - a0) * Math.sign(sweep)) % (2 * Math.PI);
    return t < 0 ? t + 2 * Math.PI : t;
  };
  const corners = rect(region.x0, region.x1, region.z0, region.z1).filter(
    (c) => Math.hypot(c.x - pivot.x, c.z - pivot.z) > 1e-6,
  );
  return Array.from({ length: n }, (_, i) => {
    const p0 = (Math.abs(sweep) * i) / n;
    const p1 = (Math.abs(sweep) * (i + 1)) / n;
    const between = corners
      .filter((c) => progress(c) > p0 + 1e-9 && progress(c) < p1 - 1e-9)
      .sort((a, b) => progress(a) - progress(b));
    return [pivot, hit(a0 + (sweep * i) / n), ...between, hit(a0 + (sweep * (i + 1)) / n)];
  });
}

const ENTRY_TOP = B.z0 + W;
const TURN_START = B.z1 - W;

function buildTreads(): StairTread[] {
  const out: { outline: PlanPoint[]; kind: StairTread["kind"] }[] = [];
  // Entry: step in heading west from the living room, turn north (pivot at the east wall).
  fan({ x: B.x1, z: ENTRY_TOP }, { x0: XM, x1: B.x1, z0: B.z0, z1: ENTRY_TOP }, -Math.PI / 2, -Math.PI / 2, ENTRY_WINDERS)
    .forEach((outline) => out.push({ outline, kind: "winder" }));
  // Flight 1: north up the east half.
  const g1 = (TURN_START - ENTRY_TOP) / EAST_TREADS;
  for (let i = 0; i < EAST_TREADS; i++) {
    out.push({ outline: rect(XM, B.x1, ENTRY_TOP + i * g1, ENTRY_TOP + (i + 1) * g1), kind: "straight" });
  }
  // Half turn at the back, around the centre of the well.
  fan({ x: XM, z: TURN_START }, { x0: B.x0, x1: B.x1, z0: TURN_START, z1: B.z1 }, 0, Math.PI, TURN_WINDERS)
    .forEach((outline) => out.push({ outline, kind: "winder" }));
  // Flight 2: climbing south along the west half to the sitting area.
  const g2 = (TURN_START - B.z0) / WEST_TREADS;
  for (let i = 0; i < WEST_TREADS; i++) {
    out.push({ outline: rect(B.x0, XM, TURN_START - (i + 1) * g2, TURN_START - i * g2), kind: "straight" });
  }
  return out.map((t, i) => ({ index: i + 1, top: (i + 1) * R, ...t }));
}

const TREADS = buildTreads();

/**
 * Handrails on the central spine between the two flights, following each
 * flight's nosing line, with newels at both ends of the spine and at the
 * turn, and a baluster on every straight tread.
 */
function buildRails(): Pick<Stair, "handrails" | "posts"> {
  const h = HANDRAIL_HEIGHT;
  const eastFirst = ENTRY_WINDERS + 1;
  const westFirst = ENTRY_WINDERS + EAST_TREADS + TURN_WINDERS + 1;
  const runs = [
    // Flight 1: from its first nosing to the turn, extended one going.
    { from: [XM, eastFirst * R + h, ENTRY_TOP] as PlanPoint3, to: [XM, (eastFirst + EAST_TREADS) * R + h, TURN_START] as PlanPoint3 },
    // Flight 2: from the turn to the top, ending at floor level + rail height.
    { from: [XM, westFirst * R + h, TURN_START] as PlanPoint3, to: [XM, RISE + h, B.z0] as PlanPoint3 },
  ];
  const railY = (run: (typeof runs)[number], z: number) =>
    run.from[1] + ((run.to[1] - run.from[1]) * (z - run.from[2])) / (run.to[2] - run.from[2]);

  const posts: { from: PlanPoint3; to: PlanPoint3 }[] = [
    { from: [XM, 0, ENTRY_TOP], to: [XM, runs[0].from[1], ENTRY_TOP] },
    { from: [XM, 0, TURN_START], to: [XM, runs[1].from[1], TURN_START] },
    { from: [XM, 0, B.z0], to: [XM, runs[1].to[1], B.z0] },
  ];
  for (const t of TREADS.filter((tr) => tr.kind === "straight")) {
    const run = t.index < westFirst ? runs[0] : runs[1];
    const zs = t.outline.map((p) => p.z);
    const cz = (Math.min(...zs) + Math.max(...zs)) / 2;
    posts.push({ from: [XM, t.top, cz], to: [XM, railY(run, cz), cz] });
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
