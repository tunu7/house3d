import type { FloorId, HouseModel, PlanPoint, PlanRect, Slab } from "@/types/architecture";
import { furnitureFootprint } from "./furniture";
import { ENTRANCE_STEPS, STEP_RISER } from "./site";
import {
  labelArea,
  pointInPolygon,
  polygonArea,
  rectArea,
  rectOverlapArea,
  roomArea,
} from "./geometry";

export type IssueLevel = "error" | "warning" | "info";

export interface ValidationIssue {
  level: IssueLevel;
  check: string;
  message: string;
}

const EPS = 1e-6;
/** Minimum masonry between an opening and the end of its wall. */
const MIN_JAMB = 0.03;
/** Comfortable residential riser range (guidance, not a code citation). */
const RISER_RANGE: [number, number] = [0.15, 0.19];
/** Target riser used to choose the step count. */
const PREFERRED_RISER = 0.18;

const fmt = (n: number) => n.toFixed(2);

const corners = (r: PlanRect): PlanPoint[] => [
  { x: r.x0, z: r.z0 },
  { x: r.x1, z: r.z0 },
  { x: r.x1, z: r.z1 },
  { x: r.x0, z: r.z1 },
];

function pointOnSlab(p: PlanPoint, slab: Slab): boolean {
  if (!pointInPolygon(p, slab.outline)) return false;
  return !slab.holes.some((h) => p.x > h.x0 && p.x < h.x1 && p.z > h.z0 && p.z < h.z1);
}

/**
 * Geometric consistency checks for the house model. Errors indicate the model
 * contradicts itself; warnings flag deviations from the reference drawing.
 */
export function validateHouse(model: HouseModel): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const push = (level: IssueLevel, check: string, message: string) =>
    issues.push({ level, check, message });

  const footprintArea = polygonArea(model.footprint);
  push("info", "footprint", `Footprint area ${fmt(footprintArea)} m²`);

  for (const floor of ["ground", "first"] as FloorId[]) {
    // Balconies are outside the footprint: checked against their own slab below.
    const rooms = model.rooms.filter((r) => r.floor === floor && r.kind !== "balcony");

    // Rects are well-formed and inside the footprint (the L-shape is
    // orthogonally convex, so four corners inside ⇒ rect inside).
    for (const room of rooms) {
      for (const r of room.rects) {
        if (!(r.x0 < r.x1 && r.z0 < r.z1)) {
          push("error", "rect", `${room.id}: degenerate rect ${JSON.stringify(r)}`);
        }
        if (!corners(r).every((c) => pointInPolygon(c, model.footprint))) {
          push("error", "containment", `${room.id}: rect extends outside the footprint`);
        }
      }
    }

    // No overlaps between rooms (or between rects of one room).
    const all = rooms.flatMap((room) => room.rects.map((rect) => ({ room, rect })));
    for (let i = 0; i < all.length; i++) {
      for (let j = i + 1; j < all.length; j++) {
        const overlap = rectOverlapArea(all[i].rect, all[j].rect);
        if (overlap > EPS) {
          push("error", "overlap", `${floor}: ${all[i].room.id} overlaps ${all[j].room.id} by ${fmt(overlap)} m²`);
        }
      }
    }

    // Rooms tile the footprint exactly.
    const total = rooms.reduce((s, r) => s + roomArea(r), 0);
    if (Math.abs(total - footprintArea) > EPS) {
      push("error", "coverage", `${floor}: rooms total ${fmt(total)} m² ≠ footprint ${fmt(footprintArea)} m²`);
    } else {
      push("info", "coverage", `${floor}: rooms tile the footprint exactly (${fmt(total)} m²)`);
    }

    // Deviations from the drawing's written sizes. An owner revision (brief)
    // supersedes the drawing and must match exactly, counting carved-out rooms.
    for (const room of rooms) {
      const actual = roomArea(room);
      if (room.brief) {
        const included = (room.brief.includes ?? []).map((id) => model.rooms.find((r) => r.id === id));
        if (included.some((r) => !r)) push("error", "brief", `${room.id}: brief includes an unknown room`);
        const total = actual + included.reduce((s, r) => s + (r ? roomArea(r) : 0), 0);
        const target = labelArea(room.brief.label);
        if (target !== null && Math.abs(target - total) > 0.01) {
          push("error", "brief", `${room.id}: ${fmt(total)} m² does not match owner revision "${room.brief.label}" (${fmt(target)} m²)`);
        }
        continue;
      }
      const labelled = labelArea(room.drawingLabel);
      if (labelled !== null && Math.abs(labelled - actual) > 0.01) {
        push("warning", "drawing", `${room.id}: modelled ${fmt(actual)} m² vs drawing "${room.drawingLabel}" (${fmt(labelled)} m²)`);
      }
    }
  }

  // Walls and openings.
  for (const wall of model.walls) {
    if (!(wall.from < wall.to) || wall.thickness <= 0 || wall.height <= 0) {
      push("error", "wall", `${wall.id}: invalid extent/thickness/height`);
    }
    const mid = (wall.from + wall.to) / 2;
    const centre = wall.axis === "x" ? { x: mid, z: wall.at } : { x: wall.at, z: mid };
    if (!pointInPolygon(centre, model.footprint)) {
      push("error", "wall", `${wall.id}: centreline lies outside the footprint`);
    }
    const sorted = [...wall.openings].sort((a, b) => a.from - b.from);
    sorted.forEach((o, i) => {
      if (o.from < wall.from + MIN_JAMB || o.to > wall.to - MIN_JAMB) {
        push("error", "opening", `${o.id}: span ${fmt(o.from)}–${fmt(o.to)} not within ${wall.id} (${fmt(wall.from)}–${fmt(wall.to)})`);
      }
      if (!(o.from < o.to) || o.sill < 0 || !(o.head > o.sill) || o.head > wall.height) {
        push("error", "opening", `${o.id}: invalid sill/head or span`);
      }
      if (o.kind === "door" && o.sill !== 0) {
        push("error", "opening", `${o.id}: door must start at floor level`);
      }
      const next = sorted[i + 1];
      if (next && next.from < o.to + MIN_JAMB) {
        push("error", "opening", `${o.id} and ${next.id} overlap or leave no pier`);
      }
    });
  }

  // Void: no first-floor slab anywhere inside it.
  const firstSlab = model.slabs.find((s) => s.top === model.levels.first.ffl);
  const voids = model.rooms.filter((r) => r.kind === "void");
  if (!firstSlab) {
    push("error", "slab", "No first-floor slab found");
  } else {
    for (const v of voids) {
      for (const r of v.rects) {
        const samples: PlanPoint[] = [
          { x: (r.x0 + r.x1) / 2, z: (r.z0 + r.z1) / 2 },
          ...corners(r).map((c) => ({
            x: c.x + Math.sign((r.x0 + r.x1) / 2 - c.x) * 0.1,
            z: c.z + Math.sign((r.z0 + r.z1) / 2 - c.z) * 0.1,
          })),
        ];
        if (samples.some((p) => pointOnSlab(p, firstSlab))) {
          push("error", "void", `${v.id}: first-floor slab intrudes into the void`);
        }
      }
    }
    const holeArea = firstSlab.holes.reduce((s, h) => s + rectArea(h), 0);
    push("info", "slab", `First-floor slab ${fmt(polygonArea(firstSlab.outline) - holeArea)} m² (stair opening ${fmt(holeArea)} m²)`);

    // Every non-void, non-stair first-floor room must be supported by the slab.
    for (const room of model.rooms.filter((r) => r.floor === "first" && !["void", "stair", "balcony"].includes(r.kind))) {
      for (const r of room.rects) {
        const c = { x: (r.x0 + r.x1) / 2, z: (r.z0 + r.z1) / 2 };
        if (!pointOnSlab(c, firstSlab)) {
          push("error", "slab", `${room.id}: centre not supported by first-floor slab`);
        }
      }
    }
  }

  // Stair: riser count/height, tread sequence, and containment in the well.
  const { stair } = model;
  const rise = model.levels.first.ffl - model.levels.ground.ffl;
  if (Math.abs(stair.risers * stair.riser - rise) > EPS) {
    push("error", "stair", `Risers total ${fmt(stair.risers * stair.riser)} m ≠ floor-to-floor ${fmt(rise)} m`);
  }
  push(
    stair.riser >= RISER_RANGE[0] && stair.riser <= RISER_RANGE[1] ? "info" : "warning",
    "stair",
    `${stair.risers} risers × ${(stair.riser * 1000).toFixed(0)} mm for ${fmt(rise)} m floor-to-floor (target ${(PREFERRED_RISER * 1000).toFixed(0)} mm)`,
  );
  if (stair.treads.length !== stair.risers - 1) {
    push("error", "stair", `${stair.treads.length} treads for ${stair.risers} risers (expected ${stair.risers - 1})`);
  }
  stair.treads.forEach((t, i) => {
    if (Math.abs(t.top - (i + 1) * stair.riser) > EPS) {
      push("error", "stair", `Tread ${t.index} top ${fmt(t.top)} is not ${i + 1} risers`);
    }
    const b = stair.bounds;
    if (t.outline.some((p) => p.x < b.x0 - EPS || p.x > b.x1 + EPS || p.z < b.z0 - EPS || p.z > b.z1 + EPS)) {
      push("error", "stair", `Tread ${t.index} extends outside the stair well`);
    }
  });
  const treadArea = stair.treads.reduce((s, t) => s + polygonArea(t.outline), 0);
  const winders = stair.treads.filter((t) => t.kind === "winder").length;
  push("info", "stair", `${stair.treads.length} treads (${winders} winders), ${fmt(stair.flightWidth)} m flights, ${fmt(treadArea)} m² of treads`);
  if (stair.flightWidth < 0.9) {
    push("warning", "stair", `Flight width ${fmt(stair.flightWidth)} m is below the common 0.9–1.0 m residential guidance`);
  }

  // Doors need hinge/swing data to be rendered.
  for (const o of model.walls.flatMap((w) => w.openings)) {
    if (o.kind === "door" && o.operation !== "sliding" && (o.hinge === undefined || o.swing === undefined)) {
      push("error", "opening", `${o.id}: door missing hinge/swing`);
    }
  }

  // Railings stand on a first-floor slab (main floor or balcony).
  const upperSlabs = model.slabs.filter((s) => s.top === model.levels.first.ffl);
  for (const r of model.railings) {
    const ends = r.axis === "x"
      ? [{ x: r.from, z: r.at }, { x: r.to, z: r.at }]
      : [{ x: r.at, z: r.from }, { x: r.at, z: r.to }];
    if (!ends.every((p) => upperSlabs.some((s) => pointInPolygon(p, s.outline)))) {
      push("error", "railing", `${r.id}: not supported by a first-floor slab`);
    }
  }
  // Balconies sit on a slab of their own.
  for (const b of model.rooms.filter((r) => r.kind === "balcony")) {
    for (const r of b.rects) {
      const c = { x: (r.x0 + r.x1) / 2, z: (r.z0 + r.z1) / 2 };
      if (!upperSlabs.some((s) => pointInPolygon(c, s.outline))) push("error", "balcony", `${b.id}: no slab under it`);
    }
  }

  // Furniture: inside its room, clear of wall faces, and not colliding.
  const roomsById = new Map(model.rooms.map((r) => [r.id, r]));
  for (const f of model.furniture) {
    const room = roomsById.get(f.roomId);
    if (!room || room.floor !== f.floor) {
      push("error", "furniture", `${f.id}: unknown room ${f.roomId} on ${f.floor}`);
      continue;
    }
    const fp = furnitureFootprint(f);
    // Sample corners pulled 1 mm inward; each must lie in one of the room's rects.
    const inset = corners({ x0: fp.x0 + 0.001, x1: fp.x1 - 0.001, z0: fp.z0 + 0.001, z1: fp.z1 - 0.001 });
    if (!inset.every((c) => room.rects.some((r) => c.x >= r.x0 && c.x <= r.x1 && c.z >= r.z0 && c.z <= r.z1))) {
      push("error", "furniture", `${f.id}: extends outside ${room.id}`);
    }
    for (const wall of model.walls.filter((w) => w.floor === f.floor)) {
      const half = wall.thickness / 2;
      const wallRect: PlanRect = wall.axis === "x"
        ? { x0: wall.from, x1: wall.to, z0: wall.at - half, z1: wall.at + half }
        : { x0: wall.at - half, x1: wall.at + half, z0: wall.from, z1: wall.to };
      if (rectOverlapArea(fp, wallRect) > 1e-4) {
        push("error", "furniture", `${f.id}: intersects wall ${wall.id}`);
      }
    }
  }
  // Floor-standing items in the same room must not overlap (rugs and wall-mounted items excepted).
  const standing = model.furniture.filter((f) => f.type !== "rug" && !f.elevation);
  for (let i = 0; i < standing.length; i++) {
    for (let j = i + 1; j < standing.length; j++) {
      const a = standing[i];
      const b = standing[j];
      if (a.floor !== b.floor) continue;
      const overlap = rectOverlapArea(furnitureFootprint(a), furnitureFootprint(b));
      if (overlap > 1e-4) push("error", "furniture", `${a.id} overlaps ${b.id} by ${fmt(overlap)} m²`);
    }
  }
  push("info", "furniture", `${model.furniture.length} furniture items and fixtures placed`);

  // Entrance steps climb exactly the plinth height in comfortable risers.
  const riserTotal = ENTRANCE_STEPS.risers * STEP_RISER;
  if (Math.abs(riserTotal - model.dimensions.plinthHeight) > EPS) {
    push("error", "site", `Entrance steps rise ${fmt(riserTotal)} m, plinth is ${fmt(model.dimensions.plinthHeight)} m`);
  }
  push(
    STEP_RISER <= RISER_RANGE[1] ? "info" : "warning",
    "site",
    `Entrance: ${ENTRANCE_STEPS.risers} risers × ${(STEP_RISER * 1000).toFixed(0)} mm, flower planters both sides`,
  );

  return issues;
}
